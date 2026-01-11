-- =====================================================
-- SYNC MARKETPLACE BUSINESS SETTINGS FROM PRODUCTS
-- Creates marketplace_business_settings table if missing
-- and populates it from existing product listings
-- =====================================================

-- Create marketplace_business_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketplace_business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  category TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  business_hours JSONB DEFAULT '{}',
  accepts_returns BOOLEAN DEFAULT true,
  return_policy TEXT,
  shipping_policy TEXT,
  is_verified BOOLEAN DEFAULT false,
  total_products INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on business_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_marketplace_business_settings_business_id 
ON marketplace_business_settings(business_id);

-- Sync existing businesses from marketplace_products
INSERT INTO marketplace_business_settings (
  business_id,
  business_name,
  category,
  city,
  state,
  country,
  total_products,
  created_at,
  updated_at
)
SELECT DISTINCT ON (business_id)
  business_id,
  business_name,
  category,
  city,
  state,
  country,
  (SELECT COUNT(*) FROM marketplace_products p2 WHERE p2.business_id = p1.business_id AND p2.status = 'active') as total_products,
  MIN(created_at) as created_at,
  NOW() as updated_at
FROM marketplace_products p1
WHERE business_id IS NOT NULL
  AND business_name IS NOT NULL
ON CONFLICT (business_id) DO UPDATE SET
  total_products = (SELECT COUNT(*) FROM marketplace_products WHERE business_id = EXCLUDED.business_id AND status = 'active'),
  updated_at = NOW();

-- Create function to auto-update business settings when products change
CREATE OR REPLACE FUNCTION sync_marketplace_business_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT or UPDATE of product, ensure business exists in settings
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO marketplace_business_settings (
      business_id,
      business_name,
      category,
      city,
      state,
      country,
      total_products
    ) VALUES (
      NEW.business_id,
      NEW.business_name,
      NEW.category,
      NEW.city,
      NEW.state,
      NEW.country,
      1
    )
    ON CONFLICT (business_id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      category = COALESCE(marketplace_business_settings.category, EXCLUDED.category),
      city = COALESCE(marketplace_business_settings.city, EXCLUDED.city),
      state = COALESCE(marketplace_business_settings.state, EXCLUDED.state),
      country = COALESCE(marketplace_business_settings.country, EXCLUDED.country),
      total_products = (
        SELECT COUNT(*) 
        FROM marketplace_products 
        WHERE business_id = NEW.business_id AND status = 'active'
      ),
      updated_at = NOW();
  END IF;

  -- On DELETE, update product count
  IF TG_OP = 'DELETE' THEN
    UPDATE marketplace_business_settings
    SET 
      total_products = (
        SELECT COUNT(*) 
        FROM marketplace_products 
        WHERE business_id = OLD.business_id AND status = 'active'
      ),
      updated_at = NOW()
    WHERE business_id = OLD.business_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_marketplace_business_settings ON marketplace_products;

-- Create trigger to auto-sync business settings
CREATE TRIGGER trigger_sync_marketplace_business_settings
AFTER INSERT OR UPDATE OR DELETE ON marketplace_products
FOR EACH ROW
EXECUTE FUNCTION sync_marketplace_business_settings();

-- Verify sync results
SELECT 
  business_id,
  business_name,
  total_products,
  city,
  state,
  category,
  created_at
FROM marketplace_business_settings
ORDER BY created_at DESC;

-- Show businesses that have products but aren't in settings (should be empty after sync)
SELECT DISTINCT 
  p.business_id,
  p.business_name,
  COUNT(*) as product_count
FROM marketplace_products p
LEFT JOIN marketplace_business_settings bs ON p.business_id = bs.business_id
WHERE bs.business_id IS NULL
GROUP BY p.business_id, p.business_name;
