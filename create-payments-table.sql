-- Create payments table for tracking verified deployment payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id TEXT NOT NULL,
    user_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    transaction_hash TEXT NOT NULL UNIQUE,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    block_number TEXT,
    confirmations INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique transaction hash (prevent reuse)
    CONSTRAINT unique_transaction_hash UNIQUE (transaction_hash)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_address ON payments (user_address);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_hash ON payments (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payments_deployment_id ON payments (deployment_id);
CREATE INDEX IF NOT EXISTS idx_payments_verified_at ON payments (verified_at);

-- Disable RLS to allow API access
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Tracks verified deployment payments to prevent fraud and duplicate usage';
COMMENT ON COLUMN payments.deployment_id IS 'Unique deployment ID for tracking';
COMMENT ON COLUMN payments.user_address IS 'Address that made the payment';
COMMENT ON COLUMN payments.amount IS 'Payment amount in XPL';
COMMENT ON COLUMN payments.transaction_hash IS 'Blockchain transaction hash (unique, cannot be reused)';
COMMENT ON COLUMN payments.verified_at IS 'When the payment was verified';
COMMENT ON COLUMN payments.block_number IS 'Block number where transaction was mined';
COMMENT ON COLUMN payments.confirmations IS 'Number of confirmations at verification time';
