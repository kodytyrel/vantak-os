-- Create subscribers table for Marketing Engine (Pro Tier)
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  source VARCHAR(50) NOT NULL DEFAULT 'popup', -- 'checkout', 'popup', 'manual'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscribers_tenant_id ON subscribers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Enable RLS
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenants can only see their own subscribers
CREATE POLICY "Tenants can view their own subscribers"
  ON subscribers FOR SELECT
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

-- RLS Policy: Service role can do everything
CREATE POLICY "Service role has full access to subscribers"
  ON subscribers FOR ALL
  USING (auth.role() = 'service_role');


