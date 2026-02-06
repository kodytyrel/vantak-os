-- Migration: Add Founding Member fields to tenants table
-- This migration adds support for the "Founding 100" program

-- Add is_founding_member boolean column (default false)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT FALSE;

-- Add founding_member_number integer column (nullable, unique)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS founding_member_number INTEGER;

-- Create unique index on founding_member_number to ensure no duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_founding_member_number 
ON tenants(founding_member_number) 
WHERE founding_member_number IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN tenants.is_founding_member IS 'True if this tenant is part of the Founding 100 program';
COMMENT ON COLUMN tenants.founding_member_number IS 'Unique number (1-100) assigned to founding members. NULL for non-founding members.';

