-- Create user_balances table
CREATE TABLE IF NOT EXISTS user_balances (
  user_id TEXT PRIMARY KEY,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create balance_transactions table
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'tournament_entry', 'tournament_win'
  pi_payment_id TEXT,
  description TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type ON balance_transactions(type);

-- Add app_wallet tracking
CREATE TABLE IF NOT EXISTS app_wallet_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_escrow DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (id = 1) -- Only one row allowed
);

INSERT INTO app_wallet_stats (id, total_balance, total_escrow)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;
