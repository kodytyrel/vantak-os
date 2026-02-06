-- Add notes column to expenses table for professional record-keeping
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;


