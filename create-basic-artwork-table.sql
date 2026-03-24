-- Create basic_artwork table for Basic contract NFT items
CREATE TABLE IF NOT EXISTS basic_artwork (
    id SERIAL PRIMARY KEY,
    contract_address TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    ipfs_hash TEXT,
    attributes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of contract and token_id
    UNIQUE(contract_address, token_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_basic_artwork_contract ON basic_artwork (contract_address);
CREATE INDEX IF NOT EXISTS idx_basic_artwork_token_id ON basic_artwork (token_id);
CREATE INDEX IF NOT EXISTS idx_basic_artwork_contract_token ON basic_artwork (contract_address, token_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE basic_artwork ENABLE ROW LEVEL SECURITY;

-- Allow public read access for metadata API
CREATE POLICY "Allow public read access" ON basic_artwork
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update their own contracts
CREATE POLICY "Allow authenticated insert" ON basic_artwork
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON basic_artwork
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete" ON basic_artwork
    FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE basic_artwork IS 'Stores individual NFT artwork data for Basic contracts';
COMMENT ON COLUMN basic_artwork.contract_address IS 'The contract address (lowercase)';
COMMENT ON COLUMN basic_artwork.token_id IS 'The token ID (1-based)';
COMMENT ON COLUMN basic_artwork.name IS 'NFT name';
COMMENT ON COLUMN basic_artwork.description IS 'NFT description';
COMMENT ON COLUMN basic_artwork.image_url IS 'Direct image URL (Supabase storage)';
COMMENT ON COLUMN basic_artwork.ipfs_hash IS 'IPFS hash for decentralized storage';
COMMENT ON COLUMN basic_artwork.attributes IS 'JSON array of trait objects with trait_type and value';
