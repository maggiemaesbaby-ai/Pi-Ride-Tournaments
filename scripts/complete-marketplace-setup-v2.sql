-- =====================================================
-- COMPLETE MARKETPLACE DATABASE SCHEMA v2
-- Includes all columns required by the application
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Drop existing tables if they exist (be careful - this deletes data!)
DROP TABLE IF EXISTS marketplace_refunds CASCADE;
DROP TABLE IF EXISTS marketplace_orders CASCADE;
DROP TABLE IF EXISTS marketplace_offers CASCADE;
DROP TABLE IF EXISTS marketplace_products CASCADE;

-- 1. MARKETPLACE PRODUCTS TABLE
CREATE TABLE marketplace_products (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  price_usd DECIMAL(10, 2),
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  photos_3d JSONB,
  has_3d BOOLEAN DEFAULT false,
  color_variants JSONB,
  category TEXT NOT NULL,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  location TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL,
  shipping_regions JSONB DEFAULT '[]'::jsonb,
  accepts_offers BOOLEAN DEFAULT false,
  offer_range JSONB,
  stock INTEGER DEFAULT 1,
  condition TEXT NOT NULL,
  brand TEXT,
  weight_kg DECIMAL(10, 2),
  dimensions JSONB,
  model_3d TEXT,
  shipping JSONB NOT NULL DEFAULT '{"available": false, "cost": 0, "estimatedDays": "3-5", "service": "owner-delivery"}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0
);

CREATE INDEX idx_marketplace_products_business ON marketplace_products(business_id);
CREATE INDEX idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX idx_marketplace_products_location ON marketplace_products(location);
CREATE INDEX idx_marketplace_products_status ON marketplace_products(status);

-- 2. MARKETPLACE OFFERS TABLE
CREATE TABLE marketplace_offers (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL,
  buyer_username TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  counter_offer DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_marketplace_offers_buyer ON marketplace_offers(buyer_id);
CREATE INDEX idx_marketplace_offers_seller ON marketplace_offers(seller_id);
CREATE INDEX idx_marketplace_offers_product ON marketplace_offers(product_id);
CREATE INDEX idx_marketplace_offers_status ON marketplace_offers(status);

-- 3. MARKETPLACE ORDERS TABLE
CREATE TABLE marketplace_orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES marketplace_products(id) ON DELETE RESTRICT,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  seller_earnings DECIMAL(10, 2) NOT NULL,
  shipping BOOLEAN DEFAULT false,
  shipping_address JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  refund_status TEXT,
  buyer_notified BOOLEAN DEFAULT false,
  seller_notified BOOLEAN DEFAULT false,
  admin_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX idx_marketplace_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX idx_marketplace_orders_product ON marketplace_orders(product_id);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX idx_marketplace_orders_refund_status ON marketplace_orders(refund_status);

-- 4. MARKETPLACE REFUNDS TABLE
CREATE TABLE marketplace_refunds (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES marketplace_orders(id) ON DELETE RESTRICT,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  detailed_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  seller_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_marketplace_refunds_order ON marketplace_refunds(order_id);
CREATE INDEX idx_marketplace_refunds_buyer ON marketplace_refunds(buyer_id);
CREATE INDEX idx_marketplace_refunds_seller ON marketplace_refunds(seller_id);
CREATE INDEX idx_marketplace_refunds_status ON marketplace_refunds(status);

-- 5. CREATE PUBLIC READ/WRITE POLICIES (RLS disabled initially for testing)
ALTER TABLE marketplace_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_refunds DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want RLS enabled with public access policies
-- ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public access to marketplace_products" ON marketplace_products FOR ALL TO public USING (true) WITH CHECK (true);
-- (Repeat for other tables)

-- 6. VERIFY TABLE CREATION
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE 'marketplace_%'
ORDER BY table_name;

-- 7. SHOW ALL COLUMNS FOR VERIFICATION
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name LIKE 'marketplace_%'
ORDER BY table_name, ordinal_position;

-- Success message
SELECT 'Marketplace tables created successfully!' as message,
       COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name LIKE 'marketplace_%';
