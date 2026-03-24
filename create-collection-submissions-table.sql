-- Create table for collection verification submissions
CREATE TABLE IF NOT EXISTS collection_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_address TEXT NOT NULL,
    collection_name TEXT NOT NULL,
    creator_name TEXT NOT NULL,
    website_url TEXT,
    description TEXT NOT NULL,
    submitter_address TEXT NOT NULL,
    
    -- Collection details
    symbol TEXT,
    total_supply INTEGER,
    mint_price TEXT,
    
    -- Social links (optional)
    x_profile TEXT,
    discord TEXT,
    
    -- Submission status
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'denied'
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique submissions per contract
    UNIQUE(contract_address)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_status ON collection_submissions (status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter ON collection_submissions (submitter_address);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON collection_submissions (submitted_at DESC);

-- Disable RLS for admin access
ALTER TABLE collection_submissions DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE collection_submissions IS 'Stores collection verification submissions for admin review';
COMMENT ON COLUMN collection_submissions.status IS 'Submission status: pending, approved, or denied';
COMMENT ON COLUMN collection_submissions.reviewed_by IS 'Admin wallet address who reviewed the submission';
COMMENT ON COLUMN collection_submissions.review_notes IS 'Admin notes about approval/denial reason';

