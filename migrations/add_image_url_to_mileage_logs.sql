-- Add image_url column to mileage_logs table for photo uploads
ALTER TABLE mileage_logs ADD COLUMN IF NOT EXISTS image_url TEXT;


