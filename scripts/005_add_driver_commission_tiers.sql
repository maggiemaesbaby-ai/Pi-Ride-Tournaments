-- Add commission tier fields to drivers table
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS commission_tier TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(4,3) DEFAULT 0.05,
ADD COLUMN IF NOT EXISTS upfront_fee_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS upfront_fee_amount DECIMAL(10,2) DEFAULT 0;

-- Updated comments to reflect correct commission rates: 3% for upfront, 5% for standard
COMMENT ON COLUMN drivers.commission_tier IS 'upfront (3% commission) or standard (5% commission)';
COMMENT ON COLUMN drivers.commission_rate IS 'Actual commission rate (0.03 or 0.05)';
COMMENT ON COLUMN drivers.upfront_fee_paid IS 'Whether driver paid $100 upfront signup fee';
COMMENT ON COLUMN drivers.upfront_fee_amount IS 'Amount of upfront fee owed (100 Pi for upfront tier)';
