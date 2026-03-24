-- Create mint_banners table for storing mint page banner images
CREATE TABLE IF NOT EXISTS mint_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT NOT NULL,
  banner_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mint_banners_contract ON mint_banners(contract_address);
CREATE INDEX IF NOT EXISTS idx_mint_banners_uploaded ON mint_banners(uploaded_at);

-- Enable Row Level Security
ALTER TABLE mint_banners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow public read and insert access)
DROP POLICY IF EXISTS "public can read mint_banners" ON mint_banners;
DROP POLICY IF EXISTS "public can insert mint_banners" ON mint_banners;

CREATE POLICY "public can read mint_banners" ON mint_banners FOR SELECT TO anon USING (true);
CREATE POLICY "public can insert mint_banners" ON mint_banners FOR INSERT TO anon WITH CHECK (true);

-- Verify the table was created
SELECT 'mint_banners table created successfully' as status;
