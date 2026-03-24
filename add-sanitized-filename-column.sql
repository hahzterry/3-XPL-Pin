-- Add missing sanitized_filename column to temp_uploads table
ALTER TABLE temp_uploads 
ADD COLUMN IF NOT EXISTS sanitized_filename TEXT;

-- Add comment for documentation
COMMENT ON COLUMN temp_uploads.sanitized_filename IS 'Sanitized filename for storage (cleaned of special characters)';
