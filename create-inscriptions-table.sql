-- Create inscriptions table for storing on-chain inscriptions
CREATE TABLE IF NOT EXISTS public.inscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_hash TEXT NOT NULL UNIQUE,
    block_number BIGINT,
    from_address TEXT NOT NULL,
    to_address TEXT,
    data_uri TEXT NOT NULL,
    protocol TEXT, -- 'text', 'erc20', 'nft', 'custom', etc.
    operation TEXT, -- 'deploy', 'mint', 'transfer', etc.
    parsed_data JSONB, -- Parsed inscription data if JSON
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inscriptions_tx_hash ON public.inscriptions (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_inscriptions_from_address ON public.inscriptions (from_address);
CREATE INDEX IF NOT EXISTS idx_inscriptions_protocol ON public.inscriptions (protocol);
CREATE INDEX IF NOT EXISTS idx_inscriptions_block_number ON public.inscriptions (block_number);
CREATE INDEX IF NOT EXISTS idx_inscriptions_created_at ON public.inscriptions (created_at DESC);

-- Disable RLS for public access (inscriptions are public data)
ALTER TABLE public.inscriptions DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.inscriptions IS 'Stores on-chain inscriptions created by users on Plasma network';
COMMENT ON COLUMN public.inscriptions.transaction_hash IS 'Blockchain transaction hash containing the inscription';
COMMENT ON COLUMN public.inscriptions.block_number IS 'Block number where inscription was created';
COMMENT ON COLUMN public.inscriptions.from_address IS 'Address that created the inscription';
COMMENT ON COLUMN public.inscriptions.to_address IS 'Recipient address (usually same as from for inscriptions)';
COMMENT ON COLUMN public.inscriptions.data_uri IS 'The actual inscription data URI';
COMMENT ON COLUMN public.inscriptions.protocol IS 'Protocol type if detected (text, erc20, nft, custom)';
COMMENT ON COLUMN public.inscriptions.operation IS 'Operation type if protocol-based (deploy, mint, transfer)';
COMMENT ON COLUMN public.inscriptions.parsed_data IS 'Parsed JSON data if inscription is JSON-based';
COMMENT ON COLUMN public.inscriptions.is_valid IS 'Whether the inscription is valid according to protocol rules';

