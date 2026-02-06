-- Create expenses table for Business Suite (Elite Tier)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'gas', 'supplies', 'rent', 'utilities', 'meals', 'other'
  description TEXT,
  image_url TEXT, -- URL to receipt image stored in Supabase Storage
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mileage_logs table for Business Suite (Elite Tier)
CREATE TABLE IF NOT EXISTS mileage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  purpose VARCHAR(255) NOT NULL, -- 'client_visit', 'supply_run', 'meeting', 'other'
  start_location TEXT,
  end_location TEXT,
  start_miles DECIMAL(10, 2),
  end_miles DECIMAL(10, 2),
  total_miles DECIMAL(10, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN end_miles IS NOT NULL AND start_miles IS NOT NULL 
      THEN end_miles - start_miles 
      ELSE NULL 
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_tenant_id ON mileage_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_date ON mileage_logs(date);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Tenants can only see their own data
CREATE POLICY "Tenants can view their own expenses"
  ON expenses FOR SELECT
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can update their own expenses"
  ON expenses FOR UPDATE
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can delete their own expenses"
  ON expenses FOR DELETE
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can view their own mileage logs"
  ON mileage_logs FOR SELECT
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can insert their own mileage logs"
  ON mileage_logs FOR INSERT
  WITH CHECK (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can update their own mileage logs"
  ON mileage_logs FOR UPDATE
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

CREATE POLICY "Tenants can delete their own mileage logs"
  ON mileage_logs FOR DELETE
  USING (tenant_id = (SELECT id FROM tenants WHERE id = (SELECT current_setting('app.tenant_id', true)::uuid)));

-- Service role has full access
CREATE POLICY "Service role has full access to expenses"
  ON expenses FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to mileage_logs"
  ON mileage_logs FOR ALL
  USING (auth.role() = 'service_role');


