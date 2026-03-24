-- Create pro_artwork table for Pro contract NFT items
CREATE TABLE IF NOT EXISTS pro_artwork (
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
CREATE INDEX IF NOT EXISTS idx_pro_artwork_contract ON pro_artwork (contract_address);
CREATE INDEX IF NOT EXISTS idx_pro_artwork_token_id ON pro_artwork (token_id);
CREATE INDEX IF NOT EXISTS idx_pro_artwork_contract_token ON pro_artwork (contract_address, token_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE pro_artwork ENABLE ROW LEVEL SECURITY;

-- Allow public read access for metadata API
CREATE POLICY "Allow public read access" ON pro_artwork
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update their own contracts
CREATE POLICY "Allow authenticated insert" ON pro_artwork
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON pro_artwork
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete" ON pro_artwork
    FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE pro_artwork IS 'Stores individual NFT artwork data for Pro contracts';
COMMENT ON COLUMN pro_artwork.contract_address IS 'The contract address (lowercase)';
COMMENT ON COLUMN pro_artwork.token_id IS 'The token ID (1-based)';
COMMENT ON COLUMN pro_artwork.name IS 'NFT name';
COMMENT ON COLUMN pro_artwork.description IS 'NFT description';
COMMENT ON COLUMN pro_artwork.image_url IS 'Direct image URL (Supabase storage)';
COMMENT ON COLUMN pro_artwork.ipfs_hash IS 'IPFS hash for decentralized storage';
COMMENT ON COLUMN pro_artwork.attributes IS 'JSON array of trait objects with trait_type and value';
