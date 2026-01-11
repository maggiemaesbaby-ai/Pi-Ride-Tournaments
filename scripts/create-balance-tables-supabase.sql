-- Create user_balances table
CREATE TABLE IF NOT EXISTS user_balances (
  user_id TEXT PRIMARY KEY,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  app_wallet_held DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_balances_user ON user_balances(user_id);

-- Create balance_transactions table
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  pi_payment_id TEXT,
  pi_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type ON balance_transactions(type);
