-- Enable Row Level Security on daily check-in table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_checkins') THEN
    ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
    
    -- Daily check-in policies - users can only manage their own check-ins
    DROP POLICY IF EXISTS "Users can view their own check-ins" ON daily_checkins;
    CREATE POLICY "Users can view their own check-ins"
      ON daily_checkins FOR SELECT
      USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');
    
    DROP POLICY IF EXISTS "Users can insert their own check-ins" ON daily_checkins;
    CREATE POLICY "Users can insert their own check-ins"
      ON daily_checkins FOR INSERT
      WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');
    
    DROP POLICY IF EXISTS "Service role can manage all check-ins" ON daily_checkins;
    CREATE POLICY "Service role can manage all check-ins"
      ON daily_checkins FOR ALL
      USING (current_setting('role', true) = 'service_role');
  END IF;
END $$;
