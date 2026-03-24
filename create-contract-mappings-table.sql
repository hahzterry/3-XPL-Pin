-- Create contract_mappings table for automatic URL slug to contract address mapping
CREATE TABLE IF NOT EXISTS contract_mappings (
    id SERIAL PRIMARY KEY,
    url_slug TEXT UNIQUE NOT NULL,
    contract_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_mappings_url_slug ON contract_mappings (url_slug);
CREATE INDEX IF NOT EXISTS idx_contract_mappings_contract_address ON contract_mappings (contract_address);

-- Disable RLS (Row Level Security) to match other tables
ALTER TABLE contract_mappings DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE contract_mappings IS 'Maps URL slugs to actual contract addresses for metadata APIs';
COMMENT ON COLUMN contract_mappings.url_slug IS 'URL slug used in mint page URLs (e.g., test-collection)';
COMMENT ON COLUMN contract_mappings.contract_address IS 'Actual contract address on blockchain';
