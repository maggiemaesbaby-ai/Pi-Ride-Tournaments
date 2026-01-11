-- App Pot Wallet System
-- Tracks all Pi collected from dashboard balance payments and manages payout reserve

CREATE TABLE IF NOT EXISTS app_pot_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_balance DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Total Pi in the pot
  locked_balance DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Pi locked up in ongoing games
  available_balance DECIMAL(10, 2) GENERATED ALWAYS AS (total_balance - locked_balance) STORED, -- Available for payouts or profit
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize pot wallet with single row
INSERT INTO app_pot_wallet (id, total_balance, locked_balance)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Pot transaction log for audit trail
CREATE TABLE IF NOT EXISTS pot_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'entry_fee', 'payout', 'profit_withdrawal', 'add_funds'
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  locked_before DECIMAL(10, 2) NOT NULL,
  locked_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  match_id UUID,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add pot tracking to tournament matches
ALTER TABLE tournament_matches 
ADD COLUMN IF NOT EXISTS uses_pot BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pot_locked_amount DECIMAL(10, 2) DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pot_transactions_type ON pot_transactions(type);
CREATE INDEX IF NOT EXISTS idx_pot_transactions_created ON pot_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_uses_pot ON tournament_matches(uses_pot) WHERE uses_pot = TRUE;
