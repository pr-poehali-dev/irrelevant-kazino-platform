"""Регистрация, вход, выход и профиль — Irrelevant Kazino."""
import json, os, secrets, hashlib
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data)}

def err(status, msg):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', 'me')
    session_id = (event.get('headers') or {}).get('X-Session-Id', '')

    conn = get_conn()
    cur = conn.cursor()

    if action == 'register':
        username = body.get('username', '').strip()
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        if not username or not email or not password:
            conn.close(); return err(400, 'Заполните все поля')
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE username=%s OR email=%s", (username, email))
        if cur.fetchone():
            conn.close(); return err(409, 'Пользователь уже существует')
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (username, email, password_hash) VALUES (%s,%s,%s) RETURNING id",
            (username, email, hash_password(password))
        )
        user_id = cur.fetchone()[0]
        sid = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s,%s)", (sid, user_id))
        conn.commit(); conn.close()
        return ok({'session_id': sid, 'user_id': user_id, 'username': username, 'is_admin': False})

    if action == 'login':
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        cur.execute(
            f"SELECT id, username, is_admin, is_banned FROM {SCHEMA}.users WHERE email=%s AND password_hash=%s",
            (email, hash_password(password))
        )
        row = cur.fetchone()
        if not row:
            conn.close(); return err(401, 'Неверный email или пароль')
        user_id, username, is_admin, is_banned = row
        if is_banned:
            conn.close(); return err(403, 'Аккаунт заблокирован')
        sid = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s,%s)", (sid, user_id))
        cur.execute(f"UPDATE {SCHEMA}.users SET last_seen=NOW() WHERE id=%s", (user_id,))
        conn.commit(); conn.close()
        return ok({'session_id': sid, 'user_id': user_id, 'username': username, 'is_admin': is_admin})

    if action == 'logout':
        if session_id:
            cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at=NOW() WHERE id=%s", (session_id,))
            conn.commit()
        conn.close()
        return ok({'ok': True})

    # me — профиль по сессии
    cur.execute(
        f"""SELECT u.id, u.username, u.email, u.balance, u.xp, u.level, u.vip_tier, u.is_admin, u.created_at
            FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id=s.user_id
            WHERE s.id=%s AND s.expires_at > NOW()""",
        (session_id,)
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        return err(401, 'Не авторизован')
    return ok({'id': row[0], 'username': row[1], 'email': row[2], 'balance': row[3],
               'xp': row[4], 'level': row[5], 'vip_tier': row[6], 'is_admin': row[7],
               'created_at': str(row[8])})
