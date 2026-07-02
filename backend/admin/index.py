"""Административная панель: пользователи, баланс, турниры, статистика."""
import json, os
import psycopg2

SCHEMA = os.environ['MAIN_DB_SCHEMA']
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data)}

def err(status, msg):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}

def get_admin(cur, session_id):
    cur.execute(
        f"""SELECT u.id, u.is_admin FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id=s.user_id
            WHERE s.id=%s AND s.expires_at > NOW()""",
        (session_id,)
    )
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    session_id = (event.get('headers') or {}).get('X-Session-Id', '')
    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')

    conn = get_conn()
    cur = conn.cursor()

    admin = get_admin(cur, session_id)
    if not admin or not admin[1]:
        conn.close()
        return err(403, 'Доступ запрещён')

    # Статистика
    if action == 'stats':
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users")
        total_users = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE last_seen > NOW() - INTERVAL '15 minutes'")
        online = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(amount_pzc),0) FROM {SCHEMA}.payments WHERE status='succeeded' AND confirmed_at > NOW() - INTERVAL '24 hours'")
        paid_today = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tournaments WHERE status='active'")
        active_tournaments = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(balance),0) FROM {SCHEMA}.users")
        total_pzc = cur.fetchone()[0]
        conn.close()
        return ok({'total_users': total_users, 'online': online, 'paid_today': int(paid_today),
                   'active_tournaments': active_tournaments, 'total_pzc': int(total_pzc)})

    # Список пользователей
    if action == 'users':
        search = body.get('search', '')
        limit = int(body.get('limit', 50))
        offset = int(body.get('offset', 0))
        like = f'%{search}%'
        cur.execute(
            f"""SELECT id, username, email, balance, xp, level, vip_tier, is_admin, is_banned, created_at, last_seen
                FROM {SCHEMA}.users WHERE username ILIKE %s OR email ILIKE %s
                ORDER BY id DESC LIMIT %s OFFSET %s""",
            (like, like, limit, offset)
        )
        rows = cur.fetchall()
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE username ILIKE %s OR email ILIKE %s", (like, like))
        total = cur.fetchone()[0]
        conn.close()
        users = [{'id': r[0], 'username': r[1], 'email': r[2], 'balance': r[3],
                  'xp': r[4], 'level': r[5], 'vip_tier': r[6], 'is_admin': r[7],
                  'is_banned': r[8], 'created_at': str(r[9]), 'last_seen': str(r[10])} for r in rows]
        return ok({'users': users, 'total': total})

    # Обновление пользователя
    if action == 'user_update':
        uid = body.get('user_id')
        if not uid:
            conn.close(); return err(400, 'user_id required')

        if 'balance_delta' in body:
            delta = int(body['balance_delta'])
            cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id=%s", (uid,))
            row = cur.fetchone()
            if not row:
                conn.close(); return err(404, 'Пользователь не найден')
            before = row[0]
            after = before + delta
            if after < 0:
                conn.close(); return err(400, 'Баланс не может быть отрицательным')
            cur.execute(f"UPDATE {SCHEMA}.users SET balance=%s WHERE id=%s", (after, uid))
            cur.execute(
                f"""INSERT INTO {SCHEMA}.transactions (user_id, type, amount, balance_before, balance_after, description)
                    VALUES (%s,%s,%s,%s,%s,%s)""",
                (uid, 'admin_adjust', delta, before, after, body.get('reason', 'Корректировка администратором'))
            )

        if 'is_banned' in body:
            cur.execute(f"UPDATE {SCHEMA}.users SET is_banned=%s WHERE id=%s", (bool(body['is_banned']), uid))
        if 'is_admin' in body:
            cur.execute(f"UPDATE {SCHEMA}.users SET is_admin=%s WHERE id=%s", (bool(body['is_admin']), uid))
        if 'vip_tier' in body:
            cur.execute(f"UPDATE {SCHEMA}.users SET vip_tier=%s WHERE id=%s", (body['vip_tier'], uid))

        conn.commit(); conn.close()
        return ok({'ok': True})

    # Транзакции
    if action == 'transactions':
        uid = body.get('user_id')
        limit = int(body.get('limit', 30))
        if uid:
            cur.execute(
                f"""SELECT id, user_id, type, amount, balance_before, balance_after, description, created_at
                    FROM {SCHEMA}.transactions WHERE user_id=%s ORDER BY id DESC LIMIT %s""",
                (uid, limit)
            )
        else:
            cur.execute(
                f"""SELECT id, user_id, type, amount, balance_before, balance_after, description, created_at
                    FROM {SCHEMA}.transactions ORDER BY id DESC LIMIT %s""",
                (limit,)
            )
        rows = cur.fetchall()
        conn.close()
        txs = [{'id': r[0], 'user_id': r[1], 'type': r[2], 'amount': r[3],
                'balance_before': r[4], 'balance_after': r[5], 'description': r[6],
                'created_at': str(r[7])} for r in rows]
        return ok({'transactions': txs})

    # Список турниров
    if action == 'tournaments':
        cur.execute(
            f"""SELECT id, name, tier, prize_pool, entry_fee, max_players, status, starts_at, ends_at, created_at
                FROM {SCHEMA}.tournaments ORDER BY id DESC"""
        )
        rows = cur.fetchall()
        conn.close()
        ts = [{'id': r[0], 'name': r[1], 'tier': r[2], 'prize_pool': r[3], 'entry_fee': r[4],
               'max_players': r[5], 'status': r[6], 'starts_at': str(r[7]),
               'ends_at': str(r[8]), 'created_at': str(r[9])} for r in rows]
        return ok({'tournaments': ts})

    # Сохранить турнир (создать или обновить)
    if action == 'tournament_save':
        tid = body.get('id')
        if tid:
            cur.execute(
                f"""UPDATE {SCHEMA}.tournaments SET name=%s, tier=%s, prize_pool=%s, entry_fee=%s,
                    max_players=%s, status=%s, starts_at=%s, ends_at=%s WHERE id=%s""",
                (body['name'], body['tier'], body['prize_pool'], body['entry_fee'],
                 body['max_players'], body['status'], body.get('starts_at'), body.get('ends_at'), tid)
            )
        else:
            cur.execute(
                f"""INSERT INTO {SCHEMA}.tournaments (name, tier, prize_pool, entry_fee, max_players, status, starts_at, ends_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (body['name'], body['tier'], body['prize_pool'], body['entry_fee'],
                 body['max_players'], body.get('status', 'upcoming'), body.get('starts_at'), body.get('ends_at'))
            )
            tid = cur.fetchone()[0]
        conn.commit(); conn.close()
        return ok({'ok': True, 'id': tid})

    conn.close()
    return err(400, 'Неизвестное действие')
