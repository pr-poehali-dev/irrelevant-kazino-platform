const URLS = {
  auth: 'https://functions.poehali.dev/7c7d0d18-ac78-47cc-a4f4-080e44232764',
  admin: 'https://functions.poehali.dev/7475b908-8b13-46c7-9400-e0a65b22e5b5',
  payments: 'https://functions.poehali.dev/d8017bd3-9ce9-48ed-804c-54df86fe9752',
};

function getSession() {
  return localStorage.getItem('session_id') || '';
}

async function call(fn: keyof typeof URLS, body: object) {
  const res = await fetch(URLS[fn], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': getSession(),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const api = {
  register: (username: string, email: string, password: string) =>
    call('auth', { action: 'register', username, email, password }),

  login: (email: string, password: string) =>
    call('auth', { action: 'login', email, password }),

  logout: () => call('auth', { action: 'logout' }),

  me: () => call('auth', { action: 'me' }),

  // Admin
  adminStats: () => call('admin', { action: 'stats' }),
  adminUsers: (search = '', offset = 0) =>
    call('admin', { action: 'users', search, limit: 50, offset }),
  adminUserUpdate: (data: object) =>
    call('admin', { action: 'user_update', ...data }),
  adminTransactions: (user_id?: number) =>
    call('admin', { action: 'transactions', ...(user_id ? { user_id } : {}) }),
  adminTournaments: () => call('admin', { action: 'tournaments' }),
  adminTournamentSave: (data: object) =>
    call('admin', { action: 'tournament_save', ...data }),

  // Payments
  createPayment: (amount_rub: number) =>
    call('payments', { action: 'create', amount_rub }),
};
