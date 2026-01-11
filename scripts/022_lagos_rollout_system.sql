-- =====================================================
-- LAGOS, NIGERIA ROLLOUT SYSTEM
-- Complete Database Schema for Driver & Rider Waitlists
-- =====================================================

-- Driver Waitlist Table (separate from rider waitlist)
CREATE TABLE IF NOT EXISTS lagos_driver_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  city TEXT NOT NULL DEFAULT 'Lagos',
  country TEXT NOT NULL DEFAULT 'Nigeria',
  
  -- Vehicle Information
  vehicle_info JSONB,
  
  -- Lagos-Specific Requirements (to be completed before rollout)
  date_of_birth DATE,
  hackney_permit TEXT,
  hackney_verified BOOLEAN DEFAULT false,
  lasdri_certification TEXT,
  lasdri_expiry DATE,
  lasdri_verified BOOLEAN DEFAULT false,
  vehicle_insurance TEXT,
  insurance_expiry DATE,
  insurance_verified BOOLEAN DEFAULT false,
  vis_certificate TEXT,
  vis_expiry DATE,
  vis_verified BOOLEAN DEFAULT false,
  
  -- Background Check
  background_check_status TEXT DEFAULT 'pending', -- pending, completed, verified
  background_check_id TEXT,
  background_check_verified BOOLEAN DEFAULT false,
  
  -- Fees
  app_signup_fee_paid BOOLEAN DEFAULT false,
  app_signup_fee_amount DECIMAL(10,2) DEFAULT 150.00, -- $150 USD
  yearly_license_fee_paid BOOLEAN DEFAULT false,
  yearly_license_fee_amount DECIMAL(10,2) DEFAULT 30.00, -- $30 USD per vehicle
  license_anniversary_date DATE,
  fee_package_choice TEXT, -- 'upfront_18' or 'no_upfront_20'
  
  -- Profile Completion
  driver_photo_url TEXT,
  vehicle_photo_url TEXT,
  profile_completed BOOLEAN DEFAULT false,
  all_verifications_complete BOOLEAN DEFAULT false,
  ready_for_activation BOOLEAN DEFAULT false,
  
  -- Rollout Status
  rollout_notification_sent BOOLEAN DEFAULT false,
  activated BOOLEAN DEFAULT false,
  activated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Added CHECK constraint to ensure driver is 21+ years old
  CHECK (date_of_birth IS NULL OR date_of_birth <= (CURRENT_DATE - INTERVAL '21 years'))
);

-- Rider Waitlist for Lagos
CREATE TABLE IF NOT EXISTS lagos_rider_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  city TEXT NOT NULL DEFAULT 'Lagos',
  country TEXT NOT NULL DEFAULT 'Nigeria',
  
  rollout_notification_sent BOOLEAN DEFAULT false,
  activated BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_driver_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_pi_user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- expiry_warning, fee_due, verification_needed, etc
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_field TEXT, -- hackney_permit, lasdri, insurance, vis, etc
  expiry_date DATE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver-Admin Messages
CREATE TABLE IF NOT EXISTS driver_admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_pi_user_id TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'admin' or 'driver'
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee breakdown tracking
CREATE TABLE IF NOT EXISTS lagos_fee_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_pi_user_id TEXT NOT NULL,
  ride_id UUID REFERENCES rides(id),
  total_commission_percent DECIMAL(5,2) NOT NULL, -- 18% or 20%
  vat_tax_percent DECIMAL(5,2) DEFAULT 7.5,
  ops_processing_percent DECIMAL(5,2) DEFAULT 3.0,
  driver_incentive_percent DECIMAL(5,2) DEFAULT 2.0,
  ride_fare_pi DECIMAL(10,2),
  commission_collected_pi DECIMAL(10,2),
  vat_collected_pi DECIMAL(10,2),
  ops_collected_pi DECIMAL(10,2),
  incentive_collected_pi DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lagos_driver_waitlist_pi_user ON lagos_driver_waitlist(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_lagos_driver_waitlist_city ON lagos_driver_waitlist(city);
CREATE INDEX IF NOT EXISTS idx_lagos_driver_waitlist_ready ON lagos_driver_waitlist(ready_for_activation) WHERE ready_for_activation = true;
CREATE INDEX IF NOT EXISTS idx_lagos_rider_waitlist_pi_user ON lagos_rider_waitlist(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_driver ON admin_driver_notifications(driver_pi_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON admin_driver_notifications(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_driver_messages ON driver_admin_messages(driver_pi_user_id, created_at DESC);

-- Function to check expiring documents
CREATE OR REPLACE FUNCTION check_expiring_documents()
RETURNS void AS $$
DECLARE
  driver_record RECORD;
BEGIN
  -- Check all drivers for expiring documents (30 days warning)
  FOR driver_record IN 
    SELECT * FROM lagos_driver_waitlist 
    WHERE activated = true OR ready_for_activation = true
  LOOP
    -- Check LASDRI expiry
    IF driver_record.lasdri_expiry IS NOT NULL 
       AND driver_record.lasdri_expiry - CURRENT_DATE <= 30 
       AND driver_record.lasdri_expiry > CURRENT_DATE THEN
      INSERT INTO admin_driver_notifications (
        driver_pi_user_id, notification_type, title, message, related_field, expiry_date
      ) VALUES (
        driver_record.pi_user_id,
        'expiry_warning',
        'LASDRI Certification Expiring Soon',
        'Your LASDRI certification expires in ' || (driver_record.lasdri_expiry - CURRENT_DATE) || ' days. Please renew to continue driving.',
        'lasdri',
        driver_record.lasdri_expiry
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Check Insurance expiry
    IF driver_record.insurance_expiry IS NOT NULL 
       AND driver_record.insurance_expiry - CURRENT_DATE <= 30 
       AND driver_record.insurance_expiry > CURRENT_DATE THEN
      INSERT INTO admin_driver_notifications (
        driver_pi_user_id, notification_type, title, message, related_field, expiry_date
      ) VALUES (
        driver_record.pi_user_id,
        'expiry_warning',
        'Vehicle Insurance Expiring Soon',
        'Your comprehensive insurance expires in ' || (driver_record.insurance_expiry - CURRENT_DATE) || ' days. Please renew to continue driving.',
        'insurance',
        driver_record.insurance_expiry
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Check VIS certificate expiry
    IF driver_record.vis_expiry IS NOT NULL 
       AND driver_record.vis_expiry - CURRENT_DATE <= 30 
       AND driver_record.vis_expiry > CURRENT_DATE THEN
      INSERT INTO admin_driver_notifications (
        driver_pi_user_id, notification_type, title, message, related_field, expiry_date
      ) VALUES (
        driver_record.pi_user_id,
        'expiry_warning',
        'VIS Certificate Expiring Soon',
        'Your Lagos State VIS certificate expires in ' || (driver_record.vis_expiry - CURRENT_DATE) || ' days. Please renew to continue driving.',
        'vis',
        driver_record.vis_expiry
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Check License Anniversary (yearly fee)
    IF driver_record.license_anniversary_date IS NOT NULL 
       AND driver_record.license_anniversary_date - CURRENT_DATE <= 30 
       AND driver_record.license_anniversary_date > CURRENT_DATE THEN
      INSERT INTO admin_driver_notifications (
        driver_pi_user_id, notification_type, title, message, related_field, expiry_date
      ) VALUES (
        driver_record.pi_user_id,
        'fee_due',
        'Yearly License Fee Due Soon',
        'Your $30 yearly license fee is due in ' || (driver_record.license_anniversary_date - CURRENT_DATE) || ' days.',
        'yearly_fee',
        driver_record.license_anniversary_date
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to validate age (must be 21+)
CREATE OR REPLACE FUNCTION validate_driver_age()
RETURNS TRIGGER AS $$
DECLARE
  calculated_age INTEGER;
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    calculated_age := EXTRACT(YEAR FROM AGE(NEW.date_of_birth));
    
    IF calculated_age < 21 THEN
      RAISE EXCEPTION 'Driver must be at least 21 years old. Current age: %', calculated_age;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for age validation
DROP TRIGGER IF EXISTS trigger_validate_driver_age ON lagos_driver_waitlist;
CREATE TRIGGER trigger_validate_driver_age
BEFORE INSERT OR UPDATE ON lagos_driver_waitlist
FOR EACH ROW
EXECUTE FUNCTION validate_driver_age();

-- Function to check if driver profile is complete
CREATE OR REPLACE FUNCTION update_driver_readiness()
RETURNS TRIGGER AS $$
DECLARE
  calculated_age INTEGER;
BEGIN
  -- Calculate age in the trigger function instead of storing it
  calculated_age := EXTRACT(YEAR FROM AGE(NEW.date_of_birth));
  
  -- Check if all requirements are met
  NEW.all_verifications_complete := (
    calculated_age >= 21 AND
    NEW.hackney_verified = true AND
    NEW.lasdri_verified = true AND
    NEW.insurance_verified = true AND
    NEW.vis_verified = true AND
    NEW.background_check_verified = true AND
    NEW.driver_photo_url IS NOT NULL AND
    NEW.vehicle_photo_url IS NOT NULL
  );
  
  NEW.profile_completed := (
    NEW.driver_photo_url IS NOT NULL AND
    NEW.vehicle_photo_url IS NOT NULL AND
    NEW.vehicle_info IS NOT NULL AND
    NEW.date_of_birth IS NOT NULL
  );
  
  -- Ready for activation if all verifications complete AND fees paid
  NEW.ready_for_activation := (
    NEW.all_verifications_complete = true AND
    NEW.app_signup_fee_paid = true AND
    NEW.yearly_license_fee_paid = true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for readiness check
DROP TRIGGER IF EXISTS trigger_update_driver_readiness ON lagos_driver_waitlist;
CREATE TRIGGER trigger_update_driver_readiness
BEFORE INSERT OR UPDATE ON lagos_driver_waitlist
FOR EACH ROW
EXECUTE FUNCTION update_driver_readiness();

-- RLS Policies
ALTER TABLE lagos_driver_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE lagos_rider_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_driver_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lagos_fee_breakdown ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own waitlist entry
CREATE POLICY lagos_driver_waitlist_select_own ON lagos_driver_waitlist FOR SELECT
USING (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Drivers can update their own entry
CREATE POLICY lagos_driver_waitlist_update_own ON lagos_driver_waitlist FOR UPDATE
USING (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Riders can view their own waitlist entry
CREATE POLICY lagos_rider_waitlist_select_own ON lagos_rider_waitlist FOR SELECT
USING (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Drivers can view their notifications
CREATE POLICY admin_notifications_select_own ON admin_driver_notifications FOR SELECT
USING (driver_pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Drivers can update (mark as read) their notifications
CREATE POLICY admin_notifications_update_own ON admin_driver_notifications FOR UPDATE
USING (driver_pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Drivers can view and create messages
CREATE POLICY driver_messages_manage_own ON driver_admin_messages FOR ALL
USING (driver_pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Fee breakdown policies
CREATE POLICY fee_breakdown_select_own ON lagos_fee_breakdown FOR SELECT
USING (driver_pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
