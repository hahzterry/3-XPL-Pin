-- Create the nft-temp storage bucket
-- Run this in your Supabase SQL Editor

-- First, create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nft-temp',
  'nft-temp',
  true,
  52428800, -- 50MB in bytes
  null -- Allow all MIME types
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket (without IF NOT EXISTS)
-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Public can view nft-temp files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to nft-temp" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from nft-temp" ON storage.objects;

-- Create the policies
CREATE POLICY "Public can view nft-temp files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'nft-temp');

CREATE POLICY "Authenticated users can upload to nft-temp" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'nft-temp');

CREATE POLICY "Authenticated users can delete from nft-temp" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'nft-temp');

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE name = 'nft-temp';
