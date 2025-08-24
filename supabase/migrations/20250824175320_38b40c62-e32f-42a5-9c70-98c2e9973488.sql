-- Add soft delete functionality for housekeeping tasks
ALTER TABLE housekeeping_tasks 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- Create index for better performance on non-deleted tasks
CREATE INDEX idx_housekeeping_tasks_not_deleted ON housekeeping_tasks (hotel_id, status) WHERE deleted_at IS NULL;

-- Add RBAC trigger for sensitive operations
CREATE OR REPLACE FUNCTION check_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has permission for price changes
  IF TG_TABLE_NAME = 'daily_rates' AND TG_OP = 'UPDATE' THEN
    IF NOT public.has_role(auth.uid(), 'admin') AND NOT public.has_role(auth.uid(), 'manager') THEN
      RAISE EXCEPTION 'Insufficient permissions to modify pricing';
    END IF;
  END IF;
  
  -- Check if user has permission to delete housekeeping tasks
  IF TG_TABLE_NAME = 'housekeeping_tasks' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF NOT public.has_role(auth.uid(), 'admin') AND NOT public.has_role(auth.uid(), 'manager') THEN
      RAISE EXCEPTION 'Insufficient permissions to delete tasks';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply permission checks to sensitive tables
CREATE TRIGGER check_daily_rates_permissions
  BEFORE UPDATE ON daily_rates
  FOR EACH ROW EXECUTE FUNCTION check_user_permissions();

CREATE TRIGGER check_housekeeping_permissions
  BEFORE UPDATE ON housekeeping_tasks
  FOR EACH ROW EXECUTE FUNCTION check_user_permissions();