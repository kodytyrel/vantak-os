-- This ensures the tenants table has EVERY column the frontend is trying to send
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT,
ADD COLUMN IF NOT EXISTS secondary_color TEXT,
ADD COLUMN IF NOT EXISTS accent_color TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC DEFAULT 1.5,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS physical_address TEXT,
ADD COLUMN IF NOT EXISTS hours_of_operation JSONB,
ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS founding_member_number INTEGER;

-- Add social media columns if they don't exist
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS facebook_page TEXT,
ADD COLUMN IF NOT EXISTS tiktok_handle TEXT;

-- Enable RLS so the frontend can actually talk to it
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Create a policy so anyone can "Create" an account (Insert)
CREATE POLICY "Allow public insert" ON tenants FOR INSERT WITH CHECK (true);

-- Create a policy so anyone can "Check" if a slug exists (Select)
CREATE POLICY "Allow public select" ON tenants FOR SELECT USING (true);

-- Create a policy for UPDATE (needed for social media updates during signup)
-- NOTE: This allows anyone to update any tenant - for production, you may want to restrict this
CREATE POLICY "Allow public update" ON tenants FOR UPDATE USING (true) WITH CHECK (true);

-- Alternative: More restrictive UPDATE policy (only allow updating specific fields)
-- CREATE POLICY "Allow public update limited" ON tenants 
--   FOR UPDATE 
--   USING (true) 
--   WITH CHECK (
--     -- Only allow updating social media fields
--     instagram_handle IS DISTINCT FROM OLD.instagram_handle OR
--     facebook_page IS DISTINCT FROM OLD.facebook_page OR
--     tiktok_handle IS DISTINCT FROM OLD.tiktok_handle
--   );

