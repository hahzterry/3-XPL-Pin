-- Add featured field to contracts table for admin curation
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Create an index on the featured field for efficient querying
CREATE INDEX IF NOT EXISTS idx_contracts_featured ON contracts (featured);

-- Add a comment to explain the field
COMMENT ON COLUMN contracts.featured IS 'Set to true by admin to feature this collection on the explore page';
