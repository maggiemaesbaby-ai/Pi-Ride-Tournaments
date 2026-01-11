-- Add location fields to marketplace_products table
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';

-- Create index for location-based searches
CREATE INDEX IF NOT EXISTS idx_marketplace_products_city ON marketplace_products(city);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_state ON marketplace_products(state);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_country ON marketplace_products(country);
