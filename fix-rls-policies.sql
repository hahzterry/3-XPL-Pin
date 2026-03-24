-- Fix RLS policies for editions_artwork table
-- Run this in Supabase SQL Editor

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'editions_artwork';

-- Drop all existing policies
DROP POLICY IF EXISTS "public can read editions_artwork" ON editions_artwork;
DROP POLICY IF EXISTS "anon can insert editions_artwork" ON editions_artwork;
DROP POLICY IF EXISTS "authenticated can insert editions_artwork" ON editions_artwork;
DROP POLICY IF EXISTS "authenticated can update editions_artwork" ON editions_artwork;

-- Create new, more permissive policies
-- Allow anyone to read artwork data
CREATE POLICY "Allow public read access" ON editions_artwork
    FOR SELECT 
    TO anon, authenticated
    USING (true);

-- Allow anyone to insert artwork data
CREATE POLICY "Allow public insert access" ON editions_artwork
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Allow anyone to update artwork data
CREATE POLICY "Allow public update access" ON editions_artwork
    FOR UPDATE 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'editions_artwork';