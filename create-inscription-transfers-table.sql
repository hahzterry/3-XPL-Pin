-- Create inscription_transfers table for tracking ownership
-- Compatible with Ethscriptions ESIP-1 transfer protocol
-- Designed for future wrapped inscription compatibility

CREATE TABLE IF NOT EXISTS inscription_transfers (
  id SERIAL PRIMARY KEY,
  inscription_tx_hash TEXT NOT NULL REFERENCES inscriptions(transaction_hash) ON DELETE CASCADE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  transfer_tx_hash TEXT UNIQUE NOT NULL,
  block_number BIGINT,
  is_wrapped BOOLEAN DEFAULT FALSE, -- Future: track if inscription is wrapped as NFT
  wrapped_token_id BIGINT, -- Future: NFT token ID if wrapped
  wrapped_contract_address TEXT, -- Future: wrapper contract address
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_inscription_tx_hash ON inscription_transfers(inscription_tx_hash);
CREATE INDEX IF NOT EXISTS idx_to_address ON inscription_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_from_address ON inscription_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_transfer_tx_hash ON inscription_transfers(transfer_tx_hash);
CREATE INDEX IF NOT EXISTS idx_created_at ON inscription_transfers(created_at DESC);

-- Enable Row Level Security
ALTER TABLE inscription_transfers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read transfers (public ownership data)
CREATE POLICY "Allow public read access to transfers" 
  ON inscription_transfers 
  FOR SELECT 
  USING (true);

-- Policy: Only service can insert transfers (via API)
CREATE POLICY "Allow service to insert transfers" 
  ON inscription_transfers 
  FOR INSERT 
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE inscription_transfers IS 'Tracks inscription ownership transfers compatible with Ethscriptions ESIP-1 protocol. Designed for future wrapped NFT compatibility.';

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_inscription_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inscription_transfers_updated_at
  BEFORE UPDATE ON inscription_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_inscription_transfers_updated_at();

