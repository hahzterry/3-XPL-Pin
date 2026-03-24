-- Safe Supabase Schema Update
-- This script only creates missing tables and columns, without dropping existing ones

-- Create contracts table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    contract_type TEXT NOT NULL CHECK (contract_type IN ('basic', 'pro', 'editions')),
    max_supply INTEGER NOT NULL,
    mint_price TEXT NOT NULL,
    base_token_uri TEXT NOT NULL,
    deployed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deployer_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on contracts table
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for contracts table
DROP POLICY IF EXISTS "Allow public read access" ON public.contracts;
CREATE POLICY "Allow public read access" ON public.contracts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.contracts;
CREATE POLICY "Allow insert for authenticated users" ON public.contracts
    FOR INSERT WITH CHECK (true);

-- Create collection_images table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.collection_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_address TEXT NOT NULL,
    image_url TEXT NOT NULL,
    ipfs_hash TEXT,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on collection_images table
ALTER TABLE public.collection_images ENABLE ROW LEVEL SECURITY;

-- Create policies for collection_images table
DROP POLICY IF EXISTS "Allow public read access" ON public.collection_images;
CREATE POLICY "Allow public read access" ON public.collection_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.collection_images;
CREATE POLICY "Allow insert for authenticated users" ON public.collection_images
    FOR INSERT WITH CHECK (true);

-- Create nft_items table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nft_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_address TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    attributes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on nft_items table
ALTER TABLE public.nft_items ENABLE ROW LEVEL SECURITY;

-- Create policies for nft_items table
DROP POLICY IF EXISTS "Allow public read access" ON public.nft_items;
CREATE POLICY "Allow public read access" ON public.nft_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.nft_items;
CREATE POLICY "Allow insert for authenticated users" ON public.nft_items
    FOR INSERT WITH CHECK (true);

-- Create editions_artwork table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.editions_artwork (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_address TEXT NOT NULL,
    artwork_name TEXT NOT NULL,
    artwork_description TEXT NOT NULL,
    artwork_image TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on editions_artwork table
ALTER TABLE public.editions_artwork ENABLE ROW LEVEL SECURITY;

-- Create policies for editions_artwork table
DROP POLICY IF EXISTS "Allow public read access" ON public.editions_artwork;
CREATE POLICY "Allow public read access" ON public.editions_artwork
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.editions_artwork;
CREATE POLICY "Allow insert for authenticated users" ON public.editions_artwork
    FOR INSERT WITH CHECK (true);

-- Create pro_features table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pro_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_address TEXT NOT NULL,
    royalty_recipient TEXT,
    royalty_percentage INTEGER NOT NULL DEFAULT 0,
    on_chain_storage BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on pro_features table
ALTER TABLE public.pro_features ENABLE ROW LEVEL SECURITY;

-- Create policies for pro_features table
DROP POLICY IF EXISTS "Allow public read access" ON public.pro_features;
CREATE POLICY "Allow public read access" ON public.pro_features
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.pro_features;
CREATE POLICY "Allow insert for authenticated users" ON public.pro_features
    FOR INSERT WITH CHECK (true);

-- Create temp_uploads table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.temp_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on temp_uploads table
ALTER TABLE public.temp_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for temp_uploads table
DROP POLICY IF EXISTS "Allow public read access" ON public.temp_uploads;
CREATE POLICY "Allow public read access" ON public.temp_uploads
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.temp_uploads;
CREATE POLICY "Allow insert for authenticated users" ON public.temp_uploads
    FOR INSERT WITH CHECK (true);

-- Create ipfs_uploads table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ipfs_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    temp_upload_id UUID REFERENCES public.temp_uploads(id),
    ipfs_hash TEXT NOT NULL,
    ipfs_url TEXT NOT NULL,
    migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ipfs_uploads table
ALTER TABLE public.ipfs_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for ipfs_uploads table
DROP POLICY IF EXISTS "Allow public read access" ON public.ipfs_uploads;
CREATE POLICY "Allow public read access" ON public.ipfs_uploads
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.ipfs_uploads;
CREATE POLICY "Allow insert for authenticated users" ON public.ipfs_uploads
    FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_address ON public.contracts(address);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON public.contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_collection_images_contract ON public.collection_images(contract_address);
CREATE INDEX IF NOT EXISTS idx_nft_items_contract ON public.nft_items(contract_address);
CREATE INDEX IF NOT EXISTS idx_editions_artwork_contract ON public.editions_artwork(contract_address);
CREATE INDEX IF NOT EXISTS idx_pro_features_contract ON public.pro_features(contract_address);
CREATE INDEX IF NOT EXISTS idx_temp_uploads_filename ON public.temp_uploads(filename);
CREATE INDEX IF NOT EXISTS idx_ipfs_uploads_hash ON public.ipfs_uploads(ipfs_hash);

-- Create storage bucket for temporary uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('nft-temp', 'nft-temp', true, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for nft-temp bucket
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'nft-temp');

DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
CREATE POLICY "Allow public downloads" ON storage.objects
    FOR SELECT USING (bucket_id = 'nft-temp');

DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;
CREATE POLICY "Allow public deletes" ON storage.objects
    FOR DELETE USING (bucket_id = 'nft-temp');
