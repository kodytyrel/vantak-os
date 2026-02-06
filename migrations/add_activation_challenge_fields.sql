-- Add Activation Challenge Fields to tenants table
-- Migration: add_activation_challenge_fields.sql

-- Add challenge_type column (enum-like text: 'starter', 'elite')
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS challenge_type TEXT DEFAULT 'starter';

-- Add check constraint for challenge_type
ALTER TABLE tenants
DROP CONSTRAINT IF EXISTS valid_challenge_type;

ALTER TABLE tenants
ADD CONSTRAINT valid_challenge_type 
CHECK (challenge_type IN ('starter', 'elite'));

-- Add deposit_paid column (decimal for currency amount)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS deposit_paid DECIMAL(10, 2) DEFAULT 0.00;

-- Add challenge_status column (enum-like text: 'waived', 'active', 'refunded', 'credited')
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS challenge_status TEXT DEFAULT 'waived';

-- Add check constraint for challenge_status
ALTER TABLE tenants
DROP CONSTRAINT IF EXISTS valid_challenge_status;

ALTER TABLE tenants
ADD CONSTRAINT valid_challenge_status 
CHECK (challenge_status IN ('waived', 'active', 'refunded', 'credited'));

-- Set defaults for existing founding members
UPDATE tenants 
SET challenge_type = 'starter',
    challenge_status = 'waived',
    deposit_paid = 0.00
WHERE is_founding_member = true;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tenants_challenge_type ON tenants(challenge_type);
CREATE INDEX IF NOT EXISTS idx_tenants_challenge_status ON tenants(challenge_status);

