-- Add status column to marketplace_products table
ALTER TABLE marketplace_products
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update existing products to active
UPDATE marketplace_products
SET status = 'active'
WHERE status IS NULL;

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace_products(status);
