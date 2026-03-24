-- Supabase Database Schema for NFT Collections
-- Run this in your Supabase SQL Editor

-- Create contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('basic', 'pro', 'editions')),
  max_supply INTEGER NOT NULL,
  mint_price DECIMAL NOT NULL,
  base_token_uri TEXT NOT NULL,
  deployed_at TIMESTAMP DEFAULT NOW(),
  deployer_address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create collection_images table
CREATE TABLE collection_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT REFERENCES contracts(address) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  ipfs_hash TEXT,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create nft_items table (for Basic/Pro collections)
CREATE TABLE nft_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT REFERENCES contracts(address) ON DELETE CASCADE,
  token_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  ipfs_hash TEXT,
  attributes JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contract_address, token_id)
);

-- Create editions_artwork table (for Editions collections)
CREATE TABLE editions_artwork (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT REFERENCES contracts(address) ON DELETE CASCADE,
  artwork_name TEXT NOT NULL,
  artwork_description TEXT NOT NULL,
  artwork_image TEXT NOT NULL,
  artwork_ipfs_hash TEXT,
  artist_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create pro_features table (for Pro collections)
CREATE TABLE pro_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT REFERENCES contracts(address) ON DELETE CASCADE,
  royalty_recipient TEXT,
  royalty_percentage INTEGER DEFAULT 0,
  on_chain_storage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create temporary uploads table (for interface uploads)
CREATE TABLE temp_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  temp_url TEXT NOT NULL,
  contract_address TEXT,
  metadata JSONB,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Create IPFS uploads table (for permanent storage)
CREATE TABLE ipfs_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT REFERENCES contracts(address) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  ipfs_hash TEXT NOT NULL,
  ipfs_url TEXT NOT NULL,
  gateway_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE editions_artwork ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipfs_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow public read access)
CREATE POLICY "public can read contracts" ON contracts FOR SELECT TO anon USING (true);
CREATE POLICY "public can read collection_images" ON collection_images FOR SELECT TO anon USING (true);
CREATE POLICY "public can read nft_items" ON nft_items FOR SELECT TO anon USING (true);
CREATE POLICY "public can read editions_artwork" ON editions_artwork FOR SELECT TO anon USING (true);
CREATE POLICY "public can read pro_features" ON pro_features FOR SELECT TO anon USING (true);
CREATE POLICY "public can read ipfs_uploads" ON ipfs_uploads FOR SELECT TO anon USING (true);

-- Create indexes for performance
CREATE INDEX idx_contracts_address ON contracts(address);
CREATE INDEX idx_contracts_type ON contracts(contract_type);
CREATE INDEX idx_nft_items_contract ON nft_items(contract_address);
CREATE INDEX idx_editions_artwork_contract ON editions_artwork(contract_address);
CREATE INDEX idx_pro_features_contract ON pro_features(contract_address);
CREATE INDEX idx_temp_uploads_contract ON temp_uploads(contract_address);
CREATE INDEX idx_ipfs_uploads_contract ON ipfs_uploads(contract_address);
CREATE INDEX idx_temp_uploads_expires ON temp_uploads(expires_at);

-- Create function to clean up expired temporary uploads
CREATE OR REPLACE FUNCTION cleanup_expired_temp_uploads()
RETURNS void AS $$
BEGIN
  -- Delete expired temporary uploads
  DELETE FROM temp_uploads 
  WHERE expires_at < NOW();
  
  -- Log cleanup
  RAISE NOTICE 'Cleaned up expired temporary uploads';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired uploads (runs daily)
-- Note: This requires pg_cron extension, which may not be available on all Supabase plans
-- You can run this manually or set up a cron job
-- SELECT cron.schedule('cleanup-temp-uploads', '0 2 * * *', 'SELECT cleanup_expired_temp_uploads();');
