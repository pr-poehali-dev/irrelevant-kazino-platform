
CREATE TABLE IF NOT EXISTS t_p78879105_irrelevant_kazino_pl.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  balance BIGINT NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  vip_tier VARCHAR(20) NOT NULL DEFAULT 'none',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p78879105_irrelevant_kazino_pl.sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p78879105_irrelevant_kazino_pl.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE IF NOT EXISTS t_p78879105_irrelevant_kazino_pl.transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p78879105_irrelevant_kazino_pl.users(id),
  type VARCHAR(30) NOT NULL,
  amount BIGINT NOT NULL,
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  description TEXT,
  payment_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p78879105_irrelevant_kazino_pl.tournaments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tier VARCHAR(30) NOT NULL DEFAULT 'Про',
  prize_pool BIGINT NOT NULL DEFAULT 0,
  entry_fee BIGINT NOT NULL DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 100,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p78879105_irrelevant_kazino_pl.tournament_participants (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES t_p78879105_irrelevant_kazino_pl.tournaments(id),
  user_id INTEGER NOT NULL REFERENCES t_p78879105_irrelevant_kazino_pl.users(id),
  score BIGINT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

CREATE TABLE IF NOT EXISTS t_p78879105_irrelevant_kazino_pl.payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p78879105_irrelevant_kazino_pl.users(id),
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  amount_rub NUMERIC(12,2) NOT NULL,
  amount_pzc BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON t_p78879105_irrelevant_kazino_pl.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON t_p78879105_irrelevant_kazino_pl.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON t_p78879105_irrelevant_kazino_pl.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON t_p78879105_irrelevant_kazino_pl.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_pid ON t_p78879105_irrelevant_kazino_pl.payments(payment_id);
