-- Create editions_artwork table for storing Editions contract artwork metadata
CREATE TABLE IF NOT EXISTS editions_artwork (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_address TEXT NOT NULL UNIQUE,
    artwork_name TEXT NOT NULL,
    artwork_description TEXT NOT NULL,
    artwork_image TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on contract_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_editions_artwork_contract_address ON editions_artwork(contract_address);

-- Enable RLS (Row Level Security)
ALTER TABLE editions_artwork ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for editions_artwork table

-- Allow anonymous users to read artwork data (for metadata API)
DROP POLICY IF EXISTS "public can read editions_artwork" ON editions_artwork;
CREATE POLICY "public can read editions_artwork" ON editions_artwork
    FOR SELECT TO anon, authenticated
    USING (true);

-- Allow authenticated users to insert artwork data
DROP POLICY IF EXISTS "authenticated can insert editions_artwork" ON editions_artwork;
CREATE POLICY "authenticated can insert editions_artwork" ON editions_artwork
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update artwork data
DROP POLICY IF EXISTS "authenticated can update editions_artwork" ON editions_artwork;
CREATE POLICY "authenticated can update editions_artwork" ON editions_artwork
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow anonymous users to insert artwork data (for deployment API)
DROP POLICY IF EXISTS "anon can insert editions_artwork" ON editions_artwork;
CREATE POLICY "anon can insert editions_artwork" ON editions_artwork
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_editions_artwork_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_editions_artwork_updated_at_trigger ON editions_artwork;
CREATE TRIGGER update_editions_artwork_updated_at_trigger
    BEFORE UPDATE ON editions_artwork
    FOR EACH ROW
    EXECUTE FUNCTION update_editions_artwork_updated_at();
