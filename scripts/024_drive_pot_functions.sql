-- Drive Pot Helper Functions

CREATE OR REPLACE FUNCTION add_to_drive_pot(
  amount DECIMAL(20,8),
  transaction_type TEXT,
  ride_id UUID DEFAULT NULL,
  driver_id UUID DEFAULT NULL,
  fee_breakdown JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE drive_pot_wallet
  SET 
    balance_pi = balance_pi + amount,
    locked_balance_pi = CASE 
      WHEN transaction_type = 'rider_payment' THEN locked_balance_pi + amount
      ELSE locked_balance_pi
    END,
    updated_at = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000001';

  INSERT INTO drive_pot_transactions (
    transaction_type,
    amount_pi,
    driver_id,
    ride_id,
    fee_breakdown,
    description
  ) VALUES (
    transaction_type,
    amount,
    driver_id,
    ride_id,
    fee_breakdown,
    'Rider payment for ride'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lock_driver_earnings(
  driver_id UUID,
  ride_id UUID,
  amount DECIMAL(20,8)
)
RETURNS void AS $$
BEGIN
  INSERT INTO driver_earnings_wallet (driver_id, balance_pi, lifetime_earnings_pi)
  VALUES (driver_id, 0, 0)
  ON CONFLICT (driver_id) DO NOTHING;

  -- Earnings will be released when ride completes
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION release_driver_earnings(
  ride_id UUID
)
RETURNS void AS $$
DECLARE
  ride_record RECORD;
  driver_earnings DECIMAL(20,8);
BEGIN
  SELECT * INTO ride_record FROM rides WHERE id = ride_id;
  
  IF ride_record.status != 'completed' THEN
    RAISE EXCEPTION 'Ride must be completed to release earnings';
  END IF;

  driver_earnings := ride_record.price_pi;

  UPDATE driver_earnings_wallet
  SET 
    balance_pi = balance_pi + driver_earnings,
    lifetime_earnings_pi = lifetime_earnings_pi + driver_earnings,
    updated_at = NOW()
  WHERE driver_id = ride_record.driver_id;

  UPDATE drive_pot_wallet
  SET 
    locked_balance_pi = locked_balance_pi - (ride_record.price_pi + ride_record.platform_fee),
    total_commissions_pi = total_commissions_pi + ride_record.platform_fee,
    updated_at = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000001';

  INSERT INTO drive_pot_transactions (
    transaction_type,
    amount_pi,
    driver_id,
    ride_id,
    description
  ) VALUES (
    'driver_payout',
    driver_earnings,
    ride_record.driver_id,
    ride_id,
    'Earnings released to driver wallet'
  );
END;
$$ LANGUAGE plpgsql;
