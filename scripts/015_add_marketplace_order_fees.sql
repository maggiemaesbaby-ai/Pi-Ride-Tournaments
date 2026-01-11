-- Add missing columns to marketplace_orders table
ALTER TABLE marketplace_orders 
ADD COLUMN IF NOT EXISTS transaction_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS txid TEXT;

-- Rename shipping/pickup columns to match API expectations
ALTER TABLE marketplace_orders 
RENAME COLUMN shipping TO shipping_enabled;

ALTER TABLE marketplace_orders 
RENAME COLUMN pickup TO pickup_enabled;

-- Update existing rows to set net_amount equal to amount where null
UPDATE marketplace_orders 
SET net_amount = amount 
WHERE net_amount IS NULL;

-- Add indexes for payment tracking
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_payment ON marketplace_orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_txid ON marketplace_orders(txid);
