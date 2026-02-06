-- Migration: Update Vault Storage Bucket RLS Policy
-- This ensures only the owner can access their folder in the vault bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own vault files" ON storage.objects;
DROP POLICY IF EXISTS "Users can write their own vault files" ON storage.objects;

-- Create secure RLS policy for vault bucket
-- Policy: Only allow access if bucket is 'vault' AND user's UUID matches the folder name
CREATE POLICY "Users can read their own vault files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vault' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can write their own vault files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vault' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own vault files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vault' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own vault files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vault' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add comments for documentation
COMMENT ON POLICY "Users can read their own vault files" ON storage.objects IS 'Secure RLS policy for vault bucket: Users can only read files from their own folder (UUID matches folder name)';
COMMENT ON POLICY "Users can write their own vault files" ON storage.objects IS 'Secure RLS policy for vault bucket: Users can only write files to their own folder (UUID matches folder name)';
COMMENT ON POLICY "Users can update their own vault files" ON storage.objects IS 'Secure RLS policy for vault bucket: Users can only update files in their own folder (UUID matches folder name)';
COMMENT ON POLICY "Users can delete their own vault files" ON storage.objects IS 'Secure RLS policy for vault bucket: Users can only delete files from their own folder (UUID matches folder name)';

