-- Create temp_uploads table for temporary file storage
CREATE TABLE IF NOT EXISTS temp_uploads (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    sanitized_filename TEXT,
    temp_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_temp_uploads_filename ON temp_uploads (filename);
CREATE INDEX IF NOT EXISTS idx_temp_uploads_expires_at ON temp_uploads (expires_at);

-- Disable RLS (Row Level Security) to match other tables
ALTER TABLE temp_uploads DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE temp_uploads IS 'Stores temporary file uploads before IPFS processing';
COMMENT ON COLUMN temp_uploads.filename IS 'Sanitized filename for storage';
COMMENT ON COLUMN temp_uploads.original_filename IS 'Original filename from user';
COMMENT ON COLUMN temp_uploads.temp_url IS 'Temporary Supabase storage URL';
COMMENT ON COLUMN temp_uploads.expires_at IS 'When the temporary file expires (24 hours)';
