-- Add return rate tracking functions
CREATE OR REPLACE FUNCTION update_seller_return_rate(p_seller_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_total_sales INTEGER;
  v_total_returns INTEGER;
  v_return_rate DECIMAL(5, 2);
BEGIN
  -- Count total sales
  SELECT COUNT(*) INTO v_total_sales
  FROM marketplace_orders
  WHERE seller_id = p_seller_id
  AND status IN ('shipped', 'delivered');

  -- Count total returns (approved refunds)
  SELECT COUNT(*) INTO v_total_returns
  FROM marketplace_orders
  WHERE seller_id = p_seller_id
  AND refund_status = 'completed';

  -- Calculate return rate
  IF v_total_sales > 0 THEN
    v_return_rate := (v_total_returns::DECIMAL / v_total_sales::DECIMAL) * 100;
  ELSE
    v_return_rate := 0;
  END IF;

  -- Update seller_balances table
  UPDATE seller_balances
  SET 
    return_rate = v_return_rate,
    total_sales = v_total_sales,
    total_returns = v_total_returns,
    last_updated = NOW()
  WHERE seller_id = p_seller_id;

  -- Create warning notifications if thresholds are exceeded
  IF v_return_rate >= 25 THEN
    INSERT INTO notifications (user_id, type, title, message, created_at)
    VALUES (
      p_seller_id,
      'return_rate_warning',
      'CRITICAL: High Return Rate Detected',
      'Your return rate is at ' || v_return_rate::TEXT || '%. If this rate continues to increase, selling products may be limited to certain categories. Please review your product quality and descriptions.',
      NOW()
    );
  ELSIF v_return_rate >= 10 THEN
    INSERT INTO notifications (user_id, type, title, message, created_at)
    VALUES (
      p_seller_id,
      'return_rate_warning',
      'Warning: Elevated Return Rate',
      'Your return rate is at ' || v_return_rate::TEXT || '%. Please be aware and consider adjusting your product listings, quality, or descriptions to improve customer satisfaction.',
      NOW()
    );
  END IF;

  RAISE NOTICE 'Updated return rate for seller % to %', p_seller_id, v_return_rate;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update return rate when refund is completed
CREATE OR REPLACE FUNCTION trigger_update_return_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.refund_status = 'completed' AND OLD.refund_status != 'completed' THEN
    PERFORM update_seller_return_rate(NEW.seller_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS refund_completed_trigger ON marketplace_orders;
CREATE TRIGGER refund_completed_trigger
AFTER UPDATE ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION trigger_update_return_rate();

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  reference_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
