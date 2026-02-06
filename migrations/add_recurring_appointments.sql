-- Add recurring appointment fields to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS recurring_pattern VARCHAR(50) CHECK (recurring_pattern IN ('weekly', 'biweekly', 'monthly'));

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS recurring_end_date DATE;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS parent_appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS recurring_group_id UUID;

-- Create index for faster queries on recurring appointments
CREATE INDEX IF NOT EXISTS idx_appointments_recurring_group ON appointments(recurring_group_id);
CREATE INDEX IF NOT EXISTS idx_appointments_parent ON appointments(parent_appointment_id);

