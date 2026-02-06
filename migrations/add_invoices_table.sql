-- Migration: Create invoices table for Invoice Engine
-- This table stores invoices that can be paid via Stripe Checkout

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., VTK-1001
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  line_items JSONB NOT NULL DEFAULT '[]', -- Array of {description, quantity, price, total}
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_checkout_session_id VARCHAR(255), -- Stripe Checkout session ID
  stripe_payment_intent_id VARCHAR(255), -- Stripe Payment Intent ID (when paid)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Tenants can only see their own invoices
CREATE POLICY "Tenants can view their own invoices"
  ON invoices FOR SELECT
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can insert their own invoices"
  ON invoices FOR INSERT
  WITH CHECK (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can update their own invoices"
  ON invoices FOR UPDATE
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can delete their own invoices"
  ON invoices FOR DELETE
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

-- Service role has full access
CREATE POLICY "Service role has full access to invoices"
  ON invoices FOR ALL
  USING (auth.role() = 'service_role');

-- Create a function to generate invoice numbers (VTK-XXXX format)
CREATE OR REPLACE FUNCTION generate_invoice_number(p_tenant_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_prefix VARCHAR(10) := 'VTK-';
  v_next_number INTEGER;
BEGIN
  -- Get the highest invoice number for this tenant
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO v_next_number
  FROM invoices
  WHERE tenant_id = p_tenant_id
    AND invoice_number ~ ('^' || v_prefix || '[0-9]+$');
  
  -- Return formatted invoice number (e.g., VTK-1001)
  RETURN v_prefix || LPAD(v_next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE invoices IS 'Invoices that can be paid via Stripe Checkout. Automatically synced to revenue in The Ledger when paid.';
COMMENT ON COLUMN invoices.line_items IS 'JSONB array of invoice line items: [{"description": "...", "quantity": 1, "price": 100.00, "total": 100.00}]';
COMMENT ON COLUMN invoices.invoice_number IS 'Auto-generated invoice number (VTK-XXXX format)';
COMMENT ON FUNCTION generate_invoice_number(UUID) IS 'Generates sequential invoice numbers for a tenant (VTK-1001, VTK-1002, etc.)';

