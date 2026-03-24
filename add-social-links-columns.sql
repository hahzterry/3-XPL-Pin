-- Add social links columns to existing mint_page_settings table
-- This script can be run safely even if columns already exist

-- Add website_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mint_page_settings' 
        AND column_name = 'website_url'
    ) THEN
        ALTER TABLE mint_page_settings ADD COLUMN website_url TEXT DEFAULT NULL;
    END IF;
END $$;

-- Add x_profile_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mint_page_settings' 
        AND column_name = 'x_profile_url'
    ) THEN
        ALTER TABLE mint_page_settings ADD COLUMN x_profile_url TEXT DEFAULT NULL;
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'mint_page_settings' 
AND column_name IN ('website_url', 'x_profile_url')
ORDER BY column_name;
