-- Add missing columns to marketplace_products table
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS photos_3d JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS has_3d BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS model_3d TEXT,
ADD COLUMN IF NOT EXISTS color_variants TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS shipping_regions TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS accepts_offers BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS offer_range JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{}'::jsonb;

-- Update existing products to have default values
UPDATE marketplace_products 
SET 
  photos_3d = '{}'::jsonb WHERE photos_3d IS NULL,
  has_3d = false WHERE has_3d IS NULL,
  color_variants = ARRAY[]::TEXT[] WHERE color_variants IS NULL,
  shipping_regions = ARRAY[]::TEXT[] WHERE shipping_regions IS NULL,
  accepts_offers = false WHERE accepts_offers IS NULL,
  offer_range = '{}'::jsonb WHERE offer_range IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_marketplace_products_has_3d ON marketplace_products(has_3d);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_condition ON marketplace_products(condition);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_price_usd ON marketplace_products(price_usd);
