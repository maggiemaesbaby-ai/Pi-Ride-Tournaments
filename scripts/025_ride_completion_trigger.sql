-- Trigger to automatically release driver earnings when ride completes

CREATE OR REPLACE FUNCTION auto_release_driver_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM release_driver_earnings(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_release_earnings ON rides;
CREATE TRIGGER trigger_auto_release_earnings
AFTER UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION auto_release_driver_earnings();
