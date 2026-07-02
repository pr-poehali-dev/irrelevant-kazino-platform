"""Платежи через ЮKassa: создание платежа и webhook."""
import json, os, uuid, base64
import psycopg2
import urllib.request

SCHEMA = os.environ['MAIN_DB_SCHEMA']
SHOP_ID = os.environ.get('YUKASSA_SHOP_ID', '')
SECRET_KEY = os.environ.get('YUKASSA_SECRET_KEY', '')
RETURN_URL = os.environ.get('SITE_URL', 'https://poehali.dev')
PZC_RATE = 10  # 1 руб = 10 PZC

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

def yukassa_request(method, path, body=None):
    url = f'https://api.yookassa.ru/v3{path}'
    creds = base64.b64encode(f'{SHOP_ID}:{SECRET_KEY}'.encode()).decode()
    hdrs = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json',
            'Idempotence-Key': str(uuid.uuid4())}
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')
    session_id = (event.get('headers') or {}).get('X-Session-Id', '')

    conn = get_conn()
    cur = conn.cursor()

    # Создание платежа
    if action == 'create':
        cur.execute(
            f"""SELECT u.id, u.username FROM {SCHEMA}.sessions s
                JOIN {SCHEMA}.users u ON u.id=s.user_id
                WHERE s.id=%s AND s.expires_at > NOW()""",
            (session_id,)
        )
        user = cur.fetchone()
        if not user:
            conn.close(); return err(401, 'Не авторизован')

        amount_rub = float(body.get('amount_rub', 0))
        if amount_rub < 100:
            conn.close(); return err(400, 'Минимальная сумма 100 ₽')

        amount_pzc = int(amount_rub * PZC_RATE)
        user_id, username = user

        payment = yukassa_request('POST', '/payments', {
            'amount': {'value': f'{amount_rub:.2f}', 'currency': 'RUB'},
            'confirmation': {'type': 'redirect', 'return_url': f'{RETURN_URL}/?payment=success'},
            'capture': True,
            'description': f'Пополнение {amount_pzc} PZC для {username}',
            'metadata': {'user_id': str(user_id), 'amount_pzc': str(amount_pzc)},
        })

        payment_id = payment['id']
        confirm_url = payment['confirmation']['confirmation_url']
        cur.execute(
            f"""INSERT INTO {SCHEMA}.payments (user_id, payment_id, amount_rub, amount_pzc, status)
                VALUES (%s,%s,%s,%s,'pending')""",
            (user_id, payment_id, amount_rub, amount_pzc)
        )
        conn.commit(); conn.close()
        return ok({'payment_id': payment_id, 'confirm_url': confirm_url, 'amount_pzc': amount_pzc})

    # Webhook от ЮKassa (event != action, читаем поле 'event')
    if body.get('event') == 'payment.succeeded':
        obj = body.get('object', {})
        payment_id = obj.get('id')
        meta = obj.get('metadata', {})
        user_id = int(meta.get('user_id', 0))
        amount_pzc = int(meta.get('amount_pzc', 0))

        cur.execute(f"SELECT status FROM {SCHEMA}.payments WHERE payment_id=%s", (payment_id,))
        row = cur.fetchone()
        if not row or row[0] == 'succeeded':
            conn.close(); return ok({})

        cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id=%s", (user_id,))
        before = cur.fetchone()[0]
        after = before + amount_pzc
        cur.execute(f"UPDATE {SCHEMA}.users SET balance=%s WHERE id=%s", (after, user_id))
        cur.execute(
            f"""INSERT INTO {SCHEMA}.transactions (user_id, type, amount, balance_before, balance_after, description, payment_id)
                VALUES (%s,'deposit',%s,%s,%s,'Пополнение через ЮKassa',%s)""",
            (user_id, amount_pzc, before, after, payment_id)
        )
        cur.execute(
            f"UPDATE {SCHEMA}.payments SET status='succeeded', confirmed_at=NOW() WHERE payment_id=%s",
            (payment_id,)
        )
        conn.commit(); conn.close()
        return ok({})

    # Статус платежа
    if action == 'status':
        payment_id = body.get('payment_id', '')
        cur.execute(
            f"SELECT status, amount_pzc FROM {SCHEMA}.payments WHERE payment_id=%s",
            (payment_id,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return err(404, 'Платёж не найден')
        return ok({'status': row[0], 'amount_pzc': row[1]})

    conn.close()
    return ok({})
