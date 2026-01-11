-- Add status column to balance_transactions table
ALTER TABLE balance_transactions 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';

-- Create index for status column for faster queries
CREATE INDEX IF NOT EXISTS idx_balance_transactions_status ON balance_transactions(status);

-- Add comment to document the column
COMMENT ON COLUMN balance_transactions.status IS 'Transaction status: pending, completed, failed, cancelled';
