-- Add time scheduling fields to whitelist_groups table
ALTER TABLE whitelist_groups 
ADD COLUMN IF NOT EXISTS mint_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mint_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS is_time_scheduled BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN whitelist_groups.mint_start_time IS 'When minting becomes available for this whitelist group';
COMMENT ON COLUMN whitelist_groups.mint_end_time IS 'When minting becomes unavailable for this whitelist group';
COMMENT ON COLUMN whitelist_groups.timezone IS 'Timezone for the scheduled times (e.g., UTC, America/New_York)';
COMMENT ON COLUMN whitelist_groups.is_time_scheduled IS 'Whether this group has time-based scheduling enabled';

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_whitelist_groups_time_schedule 
ON whitelist_groups (is_time_scheduled, mint_start_time, mint_end_time);
