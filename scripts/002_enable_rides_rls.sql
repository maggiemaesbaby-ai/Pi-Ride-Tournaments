-- Enable Row Level Security on rides tables
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;

-- Drivers table policies - drivers can only see and update their own data
CREATE POLICY "Drivers can view their own profile"
  ON drivers FOR SELECT
  USING (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Drivers can update their own profile"
  ON drivers FOR UPDATE
  USING (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Anyone can view approved on-duty drivers"
  ON drivers FOR SELECT
  USING (application_status = 'approved' AND is_on_duty = true);

CREATE POLICY "Service role can manage all drivers"
  ON drivers FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- Rides table policies - riders see their rides, drivers see their assigned rides
CREATE POLICY "Riders can view their own rides"
  ON rides FOR SELECT
  USING (rider_pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Drivers can view their assigned rides"
  ON rides FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Riders can create rides"
  ON rides FOR INSERT
  WITH CHECK (rider_pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Drivers can update their assigned rides"
  ON rides FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Service role can manage all rides"
  ON rides FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- Driver waitlist policies - users can only manage their own waitlist entries
CREATE POLICY "Users can view their own waitlist entries"
  ON driver_waitlist FOR SELECT
  USING (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create their own waitlist entries"
  ON driver_waitlist FOR INSERT
  WITH CHECK (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role can manage all waitlist entries"
  ON driver_waitlist FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- Driver applications policies - applicants can only see their own applications
CREATE POLICY "Applicants can view their own application"
  ON driver_applications FOR SELECT
  USING (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Applicants can create their own application"
  ON driver_applications FOR INSERT
  WITH CHECK (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role can manage all applications"
  ON driver_applications FOR ALL
  USING (current_setting('role', true) = 'service_role');
