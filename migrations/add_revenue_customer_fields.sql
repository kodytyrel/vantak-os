-- Migration: Add customer and product fields to revenue table
-- This allows revenue entries to track customer and product information for orders

-- Add customer and product fields to revenue table
ALTER TABLE revenue 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

-- Create index for product lookups
CREATE INDEX IF NOT EXISTS idx_revenue_product_id ON revenue(product_id);

-- Add comments for documentation
COMMENT ON COLUMN revenue.customer_name IS 'Customer name for direct sales receipts';
COMMENT ON COLUMN revenue.customer_email IS 'Customer email for direct sales receipts';
COMMENT ON COLUMN revenue.product_id IS 'Link to product if this revenue entry came from a product purchase';
COMMENT ON COLUMN revenue.stripe_payment_intent IS 'Stripe Payment Intent ID for transaction reference';

