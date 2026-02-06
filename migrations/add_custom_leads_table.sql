-- Migration: Add custom_leads table for Custom Solutions lead generation
-- This table stores inquiries from businesses that need custom solutions beyond VantakOS

CREATE TABLE IF NOT EXISTS custom_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vision TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  tenant_slug VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  notes TEXT
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_custom_leads_created_at ON custom_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_leads_status ON custom_leads(status);
CREATE INDEX IF NOT EXISTS idx_custom_leads_email ON custom_leads(email);

-- Add comment
COMMENT ON TABLE custom_leads IS 'Stores leads from businesses inquiring about custom solutions beyond VantakOS';
COMMENT ON COLUMN custom_leads.vision IS 'Description of the business vision/custom requirements';
COMMENT ON COLUMN custom_leads.email IS 'Contact email for the lead';
COMMENT ON COLUMN custom_leads.tenant_slug IS 'Optional: slug of the tenant if they came from a specific business page';
COMMENT ON COLUMN custom_leads.status IS 'Lead status: new, contacted, qualified, or closed';

