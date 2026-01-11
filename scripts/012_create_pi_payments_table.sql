-- Pi Payments table for storing Pi Network payment records
CREATE TABLE IF NOT EXISTS pi_payments (
  payment_id TEXT PRIMARY KEY,
  transaction_id TEXT,
  user_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_pi_payments_user_id ON pi_payments(user_id);

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_pi_payments_status ON pi_payments(status);

-- Index for querying by transaction_id
CREATE INDEX IF NOT EXISTS idx_pi_payments_transaction_id ON pi_payments(transaction_id);
