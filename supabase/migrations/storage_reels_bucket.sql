-- SQL Migration: Setup Storage for Video Reels
-- This script creates the 'reels' bucket if it doesn't exist and sets up RLS policies.

-- 1. Create the 'reels' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'reels', 'reels', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'reels'
);

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Cleanup existing policies
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Anon Insert" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- 4. Create Public Select policy (Anyone can view videos)
CREATE POLICY "Public Select" ON storage.objects
FOR SELECT USING (bucket_id = 'reels');

-- 5. Create Anon Insert policy (Anyone can upload to 'reels')
-- This is necessary since the backend uses a publishable/anon key.
CREATE POLICY "Anon Insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'reels');

-- 6. Create Anon Update policy (Optional, but sometimes needed for multipart uploads)
DROP POLICY IF EXISTS "Anon Update" ON storage.objects;
CREATE POLICY "Anon Update" ON storage.objects
FOR UPDATE USING (bucket_id = 'reels');

-- 7. Create Anon Delete policy (Optional, for cleanup if needed by backend)
DROP POLICY IF EXISTS "Anon Delete" ON storage.objects;
CREATE POLICY "Anon Delete" ON storage.objects
FOR DELETE USING (bucket_id = 'reels');
