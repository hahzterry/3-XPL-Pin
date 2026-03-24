-- Add Merkle root fields to whitelist_groups table
ALTER TABLE whitelist_groups 
ADD COLUMN IF NOT EXISTS merkle_root TEXT,
ADD COLUMN IF NOT EXISTS is_activated_onchain BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS activated_by TEXT;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_whitelist_groups_merkle_root 
ON whitelist_groups (merkle_root);

CREATE INDEX IF NOT EXISTS idx_whitelist_groups_activated 
ON whitelist_groups (is_activated_onchain);

-- Add comments for documentation
COMMENT ON COLUMN whitelist_groups.merkle_root IS 'Merkle tree root hash stored on-chain for verification';
COMMENT ON COLUMN whitelist_groups.is_activated_onchain IS 'Whether this group has been activated on the smart contract';
COMMENT ON COLUMN whitelist_groups.activated_at IS 'Timestamp when the group was activated on-chain';
COMMENT ON COLUMN whitelist_groups.activated_by IS 'Address that activated the group on-chain';
