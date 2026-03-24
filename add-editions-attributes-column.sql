-- Add attributes column to editions_artwork table
ALTER TABLE editions_artwork 
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '[]'::jsonb;

-- Create index on attributes for faster queries
CREATE INDEX IF NOT EXISTS idx_editions_artwork_attributes ON editions_artwork USING GIN (attributes);

-- Update existing records to have empty attributes array
UPDATE editions_artwork 
SET attributes = '[]'::jsonb 
WHERE attributes IS NULL;
