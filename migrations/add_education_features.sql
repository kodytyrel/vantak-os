-- Add business_type column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS business_type VARCHAR(50) DEFAULT 'service' CHECK (business_type IN ('service', 'education'));

-- Add lesson_notes column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS lesson_notes TEXT;

-- Create index on business_type for faster queries
CREATE INDEX IF NOT EXISTS idx_tenants_business_type ON tenants(business_type);

-- Update existing tenants to have 'service' as default if NULL
UPDATE tenants SET business_type = 'service' WHERE business_type IS NULL;

