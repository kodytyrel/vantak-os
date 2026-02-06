-- Migration: Add Business Identity fields to tenants table
-- This migration adds hours_of_operation (JSONB), contact_phone, and physical_address fields

-- Add hours_of_operation JSONB column
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS hours_of_operation JSONB DEFAULT NULL;

-- Add contact_phone column (if not exists)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT NULL;

-- Add physical_address column (if not exists) - for full address string
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS physical_address TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN tenants.hours_of_operation IS 'JSONB structure for business hours: {"monday": {"closed": false, "open": "09:00", "close": "17:00"}, ...}';
COMMENT ON COLUMN tenants.contact_phone IS 'Business phone number for customer contact';
COMMENT ON COLUMN tenants.physical_address IS 'Full physical address (street, city, state, zip) for location-based businesses';

