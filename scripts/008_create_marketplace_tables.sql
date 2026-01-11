-- =====================================================
-- MARKETPLACE DATABASE TABLES
-- =====================================================

-- MARKETPLACE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS marketplace_products (
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
  shipping JSONB NOT NULL,
  pickup JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_business ON marketplace_products(business_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_location ON marketplace_products(location);

-- MARKETPLACE OFFERS TABLE
CREATE TABLE IF NOT EXISTS marketplace_offers (
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

CREATE INDEX IF NOT EXISTS idx_marketplace_offers_buyer ON marketplace_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_seller ON marketplace_offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_product ON marketplace_offers(product_id);

-- MARKETPLACE ORDERS TABLE
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES marketplace_products(id) ON DELETE RESTRICT,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  shipping BOOLEAN DEFAULT false,
  pickup BOOLEAN DEFAULT false,
  shipping_address JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  buyer_notified BOOLEAN DEFAULT false,
  seller_notified BOOLEAN DEFAULT false,
  admin_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);
