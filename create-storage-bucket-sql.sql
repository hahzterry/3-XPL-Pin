-- Create nft-temp storage bucket via SQL
-- Run this in your Supabase SQL Editor

-- First, check if storage.buckets table exists
SELECT * FROM storage.buckets LIMIT 1;

-- If the above works, create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nft-temp',
  'nft-temp',
  true,
  52428800, -- 50MB in bytes
  null -- Allow all MIME types
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY IF NOT EXISTS "Public can view nft-temp files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'nft-temp');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload to nft-temp" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'nft-temp');

CREATE POLICY IF NOT EXISTS "Authenticated users can delete from nft-temp" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'nft-temp');

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE name = 'nft-temp';
