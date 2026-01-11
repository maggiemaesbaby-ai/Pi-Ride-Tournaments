-- Create marketplace orders table
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  payment_id TEXT,
  txid TEXT,
  shipping_enabled BOOLEAN DEFAULT false,
  pickup_enabled BOOLEAN DEFAULT false,
  shipping_address JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number TEXT,
  delivered_at TIMESTAMP,
  refund_requested BOOLEAN DEFAULT false,
  refund_reason TEXT,
  refund_status TEXT CHECK (refund_status IN ('pending', 'approved', 'declined', 'completed')),
  refund_approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create seller balances table
CREATE TABLE IF NOT EXISTS seller_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id TEXT UNIQUE NOT NULL,
  available_balance DECIMAL(10, 2) DEFAULT 0,
  pending_balance DECIMAL(10, 2) DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_withdrawn DECIMAL(10, 2) DEFAULT 0,
  return_rate DECIMAL(5, 2) DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_returns INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Create app wallet table for platform earnings
CREATE TABLE IF NOT EXISTS app_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10, 2) NOT NULL,
  source TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create function to update seller balance
CREATE OR REPLACE FUNCTION update_seller_balance(
  p_seller_id TEXT,
  p_amount DECIMAL,
  p_balance_type TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update seller balance
  INSERT INTO seller_balances (seller_id, available_balance, pending_balance, total_earnings, last_updated)
  VALUES (
    p_seller_id,
    CASE WHEN p_balance_type = 'available' THEN p_amount ELSE 0 END,
    CASE WHEN p_balance_type = 'pending' THEN p_amount ELSE 0 END,
    p_amount,
    NOW()
  )
  ON CONFLICT (seller_id) DO UPDATE SET
    available_balance = CASE 
      WHEN p_balance_type = 'available' THEN seller_balances.available_balance + p_amount
      ELSE seller_balances.available_balance
    END,
    pending_balance = CASE 
      WHEN p_balance_type = 'pending' THEN seller_balances.pending_balance + p_amount
      ELSE seller_balances.pending_balance
    END,
    total_earnings = seller_balances.total_earnings + p_amount,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement product stock
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE marketplace_products
  SET stock = GREATEST(0, stock - 1)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX IF NOT EXISTS idx_seller_balances_seller_id ON seller_balances(seller_id);
CREATE INDEX IF NOT EXISTS idx_app_wallet_reference ON app_wallet(reference_id);

-- Add accepts_refunds column to marketplace_products if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplace_products' AND column_name = 'accepts_refunds'
    ) THEN
        ALTER TABLE marketplace_products 
        ADD COLUMN accepts_refunds BOOLEAN DEFAULT true;
    END IF;
END $$;
