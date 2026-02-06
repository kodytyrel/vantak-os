-- Migration: Add Database Trigger for Automatic Pioneer Email Notification
-- This trigger automatically sends a confirmation email when a tenant is assigned founding member status

-- Create a function that will be called by the trigger to send email notifications
-- This trigger fires AFTER a tenant is assigned founding member status (either via auto-assign or manual)
CREATE OR REPLACE FUNCTION notify_pioneer_assignment()
RETURNS TRIGGER AS $$
DECLARE
  tenant_email TEXT;
  tenant_name TEXT;
BEGIN
  -- Only proceed if founding member status is being set to TRUE
  -- This handles cases where founding member is assigned via UPDATE (manual assignment)
  IF NEW.is_founding_member = TRUE AND (OLD.is_founding_member IS NULL OR OLD.is_founding_member = FALSE) THEN
    -- Get tenant email and business name
    tenant_email := COALESCE(NEW.contact_email, '');
    tenant_name := COALESCE(NEW.business_name, 'Valued Business');

    -- If email exists, add to email queue for processing
    IF tenant_email IS NOT NULL AND tenant_email != '' AND NEW.founding_member_number IS NOT NULL THEN
      -- Add to email queue (processed by background job or Edge Function)
      -- This ensures email is sent asynchronously without blocking the transaction
      INSERT INTO pioneer_email_queue (tenant_id, email, founding_member_number, business_name, created_at)
      VALUES (NEW.id, tenant_email, NEW.founding_member_number, tenant_name, NOW())
      ON CONFLICT (tenant_id) DO UPDATE
      SET 
        email = EXCLUDED.email,
        founding_member_number = EXCLUDED.founding_member_number,
        business_name = EXCLUDED.business_name,
        created_at = EXCLUDED.created_at,
        sent_at = NULL, -- Reset sent_at if re-queued
        error_message = NULL; -- Clear any previous errors
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_notify_pioneer_assignment ON tenants;
CREATE TRIGGER trigger_notify_pioneer_assignment
  AFTER UPDATE OF is_founding_member, founding_member_number ON tenants
  FOR EACH ROW
  WHEN (NEW.is_founding_member = TRUE AND (OLD.is_founding_member IS NULL OR OLD.is_founding_member = FALSE))
  EXECUTE FUNCTION notify_pioneer_assignment();

-- Create a queue table for email notifications (if using Option 2 above)
CREATE TABLE IF NOT EXISTS pioneer_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  founding_member_number INTEGER NOT NULL,
  business_name TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_tenant_queue UNIQUE(tenant_id)
);

-- Create index for processing queue
CREATE INDEX IF NOT EXISTS idx_pioneer_email_queue_created_at 
ON pioneer_email_queue(created_at) 
WHERE sent_at IS NULL;

-- Add comment for documentation
COMMENT ON FUNCTION notify_pioneer_assignment() IS 'Trigger function that sends Pioneer confirmation email when founding member status is assigned';
COMMENT ON TRIGGER trigger_notify_pioneer_assignment ON tenants IS 'Automatically sends Pioneer confirmation email when tenant becomes a founding member';
COMMENT ON TABLE pioneer_email_queue IS 'Queue table for Pioneer confirmation emails to be processed by background job';

