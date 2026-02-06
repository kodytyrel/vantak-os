-- Add Pioneer Deposit Fields to tenants table
-- Migration: add_pioneer_deposit_fields.sql

-- Add deposit_amount_paid column (decimal for currency)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS deposit_amount_paid DECIMAL(10, 2) DEFAULT 0.00;

-- Add is_pioneer column (boolean, defaults to false)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS is_pioneer BOOLEAN DEFAULT FALSE;

-- Add deposit_status column (enum-like text with constraint)
-- Status values: 'waived', 'pending', 'paid', 'refunded', 'credited'
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'waived';

-- Add check constraint to ensure valid deposit_status values
ALTER TABLE tenants
DROP CONSTRAINT IF EXISTS valid_deposit_status;

ALTER TABLE tenants
ADD CONSTRAINT valid_deposit_status 
CHECK (deposit_status IN ('waived', 'pending', 'paid', 'refunded', 'credited'));

-- Set is_pioneer = true for all founding members (first 100)
UPDATE tenants 
SET is_pioneer = true 
WHERE is_founding_member = true;

-- Set deposit_status = 'waived' for all founding members
UPDATE tenants 
SET deposit_status = 'waived' 
WHERE is_founding_member = true;

-- Set deposit_amount_paid = 0.00 for all waived deposits
UPDATE tenants 
SET deposit_amount_paid = 0.00 
WHERE deposit_status = 'waived';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tenants_is_pioneer ON tenants(is_pioneer);
CREATE INDEX IF NOT EXISTS idx_tenants_deposit_status ON tenants(deposit_status);

