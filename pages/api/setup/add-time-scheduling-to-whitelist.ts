import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Adding time scheduling fields to whitelist_groups table...');

    // Add time scheduling fields to whitelist_groups table
    const addTimeSchedulingSQL = `
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
    `;

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: addTimeSchedulingSQL
    });

    if (error) {
      console.error('❌ Error adding time scheduling fields:', error);
      return res.status(500).json({
        error: 'Failed to add time scheduling fields',
        details: error.message
      });
    }

    console.log('✅ Time scheduling fields added successfully!');

    res.status(200).json({
      success: true,
      message: 'Time scheduling fields added to whitelist_groups table successfully',
      table: 'whitelist_groups',
      newFields: ['mint_start_time', 'mint_end_time', 'timezone', 'is_time_scheduled'],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error adding time scheduling fields:', error);
    res.status(500).json({
      error: 'Failed to add time scheduling fields',
      details: error.message
    });
  }
}
