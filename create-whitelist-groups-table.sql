-- Create whitelist_groups table for persistent whitelist management
CREATE TABLE IF NOT EXISTS whitelist_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_address TEXT NOT NULL,
    group_id TEXT NOT NULL,
    group_title TEXT NOT NULL,
    addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of contract and group_id
    UNIQUE(contract_address, group_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whitelist_groups_contract ON whitelist_groups (contract_address);
CREATE INDEX IF NOT EXISTS idx_whitelist_groups_group_id ON whitelist_groups (group_id);
CREATE INDEX IF NOT EXISTS idx_whitelist_groups_contract_group ON whitelist_groups (contract_address, group_id);

-- Disable RLS (Row Level Security) to allow public access for mint pages
ALTER TABLE whitelist_groups DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE whitelist_groups IS 'Stores whitelist groups and their addresses for contract minting';
COMMENT ON COLUMN whitelist_groups.contract_address IS 'The contract address (lowercase)';
COMMENT ON COLUMN whitelist_groups.group_id IS 'Unique identifier for the whitelist group';
COMMENT ON COLUMN whitelist_groups.group_title IS 'Display name for the whitelist group';
COMMENT ON COLUMN whitelist_groups.addresses IS 'JSON array of whitelisted addresses';
COMMENT ON COLUMN whitelist_groups.created_by IS 'Address of the user who created the group';
