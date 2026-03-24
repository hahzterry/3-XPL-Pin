-- Fix contract_address column to be NOT NULL
-- Run this in Supabase SQL Editor

-- Make contract_address NOT NULL
ALTER TABLE editions_artwork ALTER COLUMN contract_address SET NOT NULL;

-- Add unique constraint if it doesn't exist
ALTER TABLE editions_artwork ADD CONSTRAINT editions_artwork_contract_address_unique UNIQUE (contract_address);

-- Verify the fix
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'editions_artwork' 
AND table_schema = 'public'
ORDER BY ordinal_position;
