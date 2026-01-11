-- Drive Pot Wallet System
-- Separate from arcade pot - handles all ride fares and driver payouts

CREATE TABLE IF NOT EXISTS drive_pot_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_balance DECIMAL(12,2) DEFAULT 0 CHECK (total_balance >= 0),
  locked_balance DECIMAL(12,2) DEFAULT 0 CHECK (locked_balance >= 0),
  
  -- Fee tracking for tax purposes
  total_signup_fees_collected DECIMAL(12,2) DEFAULT 0,
  total_yearly_fees_collected DECIMAL(12,2) DEFAULT 0,
  total_commission_collected DECIMAL(12,2) DEFAULT 0,
  total_vat_collected DECIMAL(12,2) DEFAULT 0,
  total_ops_collected DECIMAL(12,2) DEFAULT 0,
  total_incentive_reserved DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drive pot transactions
CREATE TABLE IF NOT EXISTS drive_pot_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL, -- fare_received, payout, signup_fee, yearly_fee, commission, admin_cashout
  amount DECIMAL(12,2) NOT NULL,
  driver_pi_user_id TEXT,
  rider_pi_user_id TEXT,
  ride_id UUID REFERENCES rides(id),
  description TEXT,
  balance_before DECIMAL(12,2),
  balance_after DECIMAL(12,2),
  locked_before DECIMAL(12,2),
  locked_after DECIMAL(12,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver earnings pending payout (locked in drive pot)
CREATE TABLE IF NOT EXISTS driver_earnings_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_pi_user_id TEXT NOT NULL,
  ride_id UUID REFERENCES rides(id),
  gross_fare DECIMAL(10,2) NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  net_payout DECIMAL(10,2) NOT NULL,
  locked_in_pot BOOLEAN DEFAULT true,
  paid_out BOOLEAN DEFAULT false,
  paid_out_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver wallet balances (before cashout to Pi wallet)
CREATE TABLE IF NOT EXISTS driver_wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_pi_user_id TEXT UNIQUE NOT NULL,
  available_balance DECIMAL(10,2) DEFAULT 0,
  lifetime_earnings DECIMAL(10,2) DEFAULT 0,
  total_cashed_out DECIMAL(10,2) DEFAULT 0,
  pending_rides_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_drive_pot_transactions_type ON drive_pot_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_drive_pot_transactions_driver ON drive_pot_transactions(driver_pi_user_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver ON driver_earnings_pending(driver_pi_user_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_unpaid ON driver_earnings_pending(paid_out) WHERE paid_out = false;
CREATE INDEX IF NOT EXISTS idx_driver_wallet_balances_driver ON driver_wallet_balances(driver_pi_user_id);

-- Initialize drive pot wallet
INSERT INTO drive_pot_wallet (id, total_balance, locked_balance)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Function to handle ride fare payment to drive pot
CREATE OR REPLACE FUNCTION process_ride_fare_to_drive_pot(
  p_ride_id UUID,
  p_rider_pi_user_id TEXT,
  p_driver_pi_user_id TEXT,
  p_fare_amount DECIMAL(10,2),
  p_commission_percent DECIMAL(5,2)
)
RETURNS JSONB AS $$
DECLARE
  v_commission_amount DECIMAL(10,2);
  v_net_payout DECIMAL(10,2);
  v_pot_record RECORD;
  v_new_balance DECIMAL(12,2);
  v_new_locked DECIMAL(12,2);
BEGIN
  -- Calculate commission and net payout
  v_commission_amount := p_fare_amount * (p_commission_percent / 100);
  v_net_payout := p_fare_amount - v_commission_amount;
  
  -- Get current pot state
  SELECT * INTO v_pot_record FROM drive_pot_wallet WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- Add fare to pot and lock the net payout amount
  v_new_balance := v_pot_record.total_balance + p_fare_amount;
  v_new_locked := v_pot_record.locked_balance + v_net_payout;
  
  -- Update drive pot
  UPDATE drive_pot_wallet
  SET 
    total_balance = v_new_balance,
    locked_balance = v_new_locked,
    total_commission_collected = total_commission_collected + v_commission_amount,
    updated_at = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- Log transaction
  INSERT INTO drive_pot_transactions (
    transaction_type, amount, driver_pi_user_id, rider_pi_user_id, ride_id,
    description, balance_before, balance_after, locked_before, locked_after
  ) VALUES (
    'fare_received', p_fare_amount, p_driver_pi_user_id, p_rider_pi_user_id, p_ride_id,
    'Ride fare received from rider',
    v_pot_record.total_balance, v_new_balance, v_pot_record.locked_balance, v_new_locked
  );
  
  -- Create pending earnings record
  INSERT INTO driver_earnings_pending (
    driver_pi_user_id, ride_id, gross_fare, commission_percent, 
    commission_amount, net_payout, locked_in_pot
  ) VALUES (
    p_driver_pi_user_id, p_ride_id, p_fare_amount, p_commission_percent,
    v_commission_amount, v_net_payout, true
  );
  
  -- Update driver wallet balance (create if doesn't exist)
  INSERT INTO driver_wallet_balances (driver_pi_user_id, pending_rides_count)
  VALUES (p_driver_pi_user_id, 1)
  ON CONFLICT (driver_pi_user_id) DO UPDATE
  SET pending_rides_count = driver_wallet_balances.pending_rides_count + 1;
  
  RETURN jsonb_build_object(
    'success', true,
    'commission', v_commission_amount,
    'net_payout', v_net_payout,
    'pot_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;

-- Function to release driver earnings from pot to driver dashboard wallet
CREATE OR REPLACE FUNCTION release_driver_earnings(p_driver_pi_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_total_pending DECIMAL(10,2);
  v_pot_record RECORD;
  v_new_locked DECIMAL(12,2);
BEGIN
  -- Calculate total pending earnings
  SELECT COALESCE(SUM(net_payout), 0) INTO v_total_pending
  FROM driver_earnings_pending
  WHERE driver_pi_user_id = p_driver_pi_user_id 
    AND paid_out = false
    AND locked_in_pot = true;
  
  IF v_total_pending = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'No pending earnings');
  END IF;
  
  -- Get pot state
  SELECT * INTO v_pot_record FROM drive_pot_wallet WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- Unlock from pot
  v_new_locked := v_pot_record.locked_balance - v_total_pending;
  
  UPDATE drive_pot_wallet
  SET 
    locked_balance = v_new_locked,
    updated_at = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- Mark earnings as paid out
  UPDATE driver_earnings_pending
  SET paid_out = true, paid_out_at = NOW(), locked_in_pot = false
  WHERE driver_pi_user_id = p_driver_pi_user_id AND paid_out = false;
  
  -- Add to driver available balance
  INSERT INTO driver_wallet_balances (driver_pi_user_id, available_balance, lifetime_earnings, pending_rides_count)
  VALUES (p_driver_pi_user_id, v_total_pending, v_total_pending, 0)
  ON CONFLICT (driver_pi_user_id) DO UPDATE
  SET 
    available_balance = driver_wallet_balances.available_balance + v_total_pending,
    lifetime_earnings = driver_wallet_balances.lifetime_earnings + v_total_pending,
    pending_rides_count = 0,
    updated_at = NOW();
  
  -- Log transaction
  INSERT INTO drive_pot_transactions (
    transaction_type, amount, driver_pi_user_id, description,
    balance_before, balance_after, locked_before, locked_after
  ) VALUES (
    'payout', v_total_pending, p_driver_pi_user_id,
    'Earnings released to driver dashboard wallet',
    v_pot_record.total_balance, v_pot_record.total_balance,
    v_pot_record.locked_balance, v_new_locked
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'amount_released', v_total_pending,
    'new_locked_balance', v_new_locked
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE drive_pot_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_pot_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_wallet_balances ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own earnings and wallet
CREATE POLICY driver_earnings_select_own ON driver_earnings_pending FOR SELECT
USING (driver_pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY driver_wallet_select_own ON driver_wallet_balances FOR SELECT
USING (driver_pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY driver_transactions_select_own ON drive_pot_transactions FOR SELECT
USING (driver_pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
