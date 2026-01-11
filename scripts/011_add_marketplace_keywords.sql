-- Add keywords column to marketplace_products table
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create GIN index for efficient keyword searches
CREATE INDEX IF NOT EXISTS idx_marketplace_products_keywords ON marketplace_products USING GIN(keywords);

-- Update existing products to have empty keywords array
UPDATE marketplace_products 
SET keywords = ARRAY[]::TEXT[] 
WHERE keywords IS NULL;
