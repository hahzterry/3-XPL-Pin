-- Create mint_page_settings table for storing custom page descriptions, backgrounds, and social links
CREATE TABLE IF NOT EXISTS mint_page_settings (
    id BIGSERIAL PRIMARY KEY,
    contract_address TEXT NOT NULL UNIQUE,
    page_description TEXT DEFAULT '',
    page_background TEXT DEFAULT 'gradient-purple-blue',
    website_url TEXT DEFAULT NULL,
    x_profile_url TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mint_page_settings_contract_address ON mint_page_settings(contract_address);

-- Enable RLS (Row Level Security)
ALTER TABLE mint_page_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for reading settings)
CREATE POLICY "public can read mint_page_settings" ON mint_page_settings
    FOR SELECT TO anon
    USING (true);

-- Create policies for authenticated users (for updating settings)
CREATE POLICY "authenticated can update mint_page_settings" ON mint_page_settings
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for inserting new settings
CREATE POLICY "authenticated can insert mint_page_settings" ON mint_page_settings
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Create policies for anonymous users to insert/update (for admin controls)
CREATE POLICY "anon can manage mint_page_settings" ON mint_page_settings
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for mint_page_settings
DROP TRIGGER IF EXISTS update_mint_page_settings_updated_at ON mint_page_settings;
CREATE TRIGGER update_mint_page_settings_updated_at
    BEFORE UPDATE ON mint_page_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
