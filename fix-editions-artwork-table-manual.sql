-- Fix editions_artwork table structure
-- Run this in Supabase SQL Editor

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'editions_artwork' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'editions_artwork' 
        AND column_name = 'id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE editions_artwork ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        RAISE NOTICE 'Added id column';
    ELSE
        RAISE NOTICE 'id column already exists';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'editions_artwork' 
        AND column_name = 'created_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE editions_artwork ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'editions_artwork' 
        AND column_name = 'updated_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE editions_artwork ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_editions_artwork_contract_address ON editions_artwork(contract_address);

-- Enable RLS
ALTER TABLE editions_artwork ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "public can read editions_artwork" ON editions_artwork;
DROP POLICY IF EXISTS "anon can insert editions_artwork" ON editions_artwork;
DROP POLICY IF EXISTS "authenticated can insert editions_artwork" ON editions_artwork;
DROP POLICY IF EXISTS "authenticated can update editions_artwork" ON editions_artwork;

-- Create new policies
CREATE POLICY "public can read editions_artwork" ON editions_artwork
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "anon can insert editions_artwork" ON editions_artwork
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "authenticated can insert editions_artwork" ON editions_artwork
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "authenticated can update editions_artwork" ON editions_artwork
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_editions_artwork_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_editions_artwork_updated_at_trigger ON editions_artwork;
CREATE TRIGGER update_editions_artwork_updated_at_trigger
    BEFORE UPDATE ON editions_artwork
    FOR EACH ROW
    EXECUTE FUNCTION update_editions_artwork_updated_at();

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'editions_artwork' 
AND table_schema = 'public'
ORDER BY ordinal_position;
