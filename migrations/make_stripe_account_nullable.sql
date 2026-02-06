-- Migration: Ensure stripe_account_id is nullable
-- This prevents creating Stripe accounts for 'zombie' users who never intend to process payments

-- Make stripe_account_id nullable if it isn't already
ALTER TABLE tenants 
  ALTER COLUMN stripe_account_id DROP NOT NULL;

-- Add a comment explaining the nullable field
COMMENT ON COLUMN tenants.stripe_account_id IS 'Stripe Connect account ID. NULL until user explicitly enables payments. Only created when user clicks "Enable Payments" to prevent charges for inactive users.';

