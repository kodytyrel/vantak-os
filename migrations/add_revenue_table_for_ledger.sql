-- Migration: Create revenue table for The Ledger
-- This table stores revenue entries that sync automatically from paid invoices

CREATE TABLE IF NOT EXISTS revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'invoice', -- 'invoice', 'service', 'product', 'other'
  description TEXT NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL, -- Link to invoice if from invoice payment
  invoice_number VARCHAR(50), -- Invoice number for reference
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_revenue_tenant_id ON revenue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);
CREATE INDEX IF NOT EXISTS idx_revenue_category ON revenue(category);
CREATE INDEX IF NOT EXISTS idx_revenue_invoice_id ON revenue(invoice_id);

-- Enable RLS
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Tenants can only see their own revenue
CREATE POLICY "Tenants can view their own revenue"
  ON revenue FOR SELECT
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can insert their own revenue"
  ON revenue FOR INSERT
  WITH CHECK (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can update their own revenue"
  ON revenue FOR UPDATE
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can delete their own revenue"
  ON revenue FOR DELETE
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

-- Service role has full access
CREATE POLICY "Service role has full access to revenue"
  ON revenue FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE revenue IS 'Revenue entries for The Ledger. Automatically synced from paid invoices.';
COMMENT ON COLUMN revenue.invoice_id IS 'Link to invoice if this revenue entry came from an invoice payment';
COMMENT ON COLUMN revenue.category IS 'Revenue category: invoice, service, product, or other';

