-- Create the nft-temp storage bucket
-- Run this in your Supabase SQL Editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nft-temp',
  'nft-temp',
  true,
  52428800, -- 50MB in bytes
  null -- Allow all MIME types
);

-- Create RLS policy for public access (read-only)
CREATE POLICY "Public can view nft-temp files" ON storage.objects
FOR SELECT USING (bucket_id = 'nft-temp');

-- Create RLS policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload to nft-temp" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'nft-temp');

-- Create RLS policy for authenticated users to delete (for cleanup)
CREATE POLICY "Authenticated users can delete from nft-temp" ON storage.objects
FOR DELETE USING (bucket_id = 'nft-temp');
