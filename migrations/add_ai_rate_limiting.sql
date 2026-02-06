-- Migration: Add AI Usage Rate Limiting
-- Creates table to track AI chat usage per tenant per day

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, usage_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_tenant_date ON ai_usage_logs(tenant_id, usage_date);

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_ai_usage(tenant_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  INSERT INTO ai_usage_logs (tenant_id, usage_date, usage_count)
  VALUES (tenant_uuid, CURRENT_DATE, 1)
  ON CONFLICT (tenant_id, usage_date)
  DO UPDATE SET 
    usage_count = ai_usage_logs.usage_count + 1,
    updated_at = NOW()
  RETURNING usage_count INTO current_count;
  
  RETURN current_count;
END;
$$ LANGUAGE plpgsql;

