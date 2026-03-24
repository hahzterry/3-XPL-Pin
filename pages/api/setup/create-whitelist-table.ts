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
    console.log('🔧 Creating whitelist_groups table...');

    // Create whitelist_groups table
    const createWhitelistTableSQL = `
      -- Create whitelist_groups table for persistent whitelist management
      CREATE TABLE IF NOT EXISTS whitelist_groups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          contract_address TEXT NOT NULL,
          group_id TEXT NOT NULL,
          group_title TEXT NOT NULL,
          addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Ensure unique combination of contract and group_id
          UNIQUE(contract_address, group_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_whitelist_groups_contract ON whitelist_groups (contract_address);
      CREATE INDEX IF NOT EXISTS idx_whitelist_groups_group_id ON whitelist_groups (group_id);
      CREATE INDEX IF NOT EXISTS idx_whitelist_groups_contract_group ON whitelist_groups (contract_address, group_id);

      -- Disable RLS (Row Level Security) to allow public access for mint pages
      ALTER TABLE whitelist_groups DISABLE ROW LEVEL SECURITY;

      -- Add comments for documentation
      COMMENT ON TABLE whitelist_groups IS 'Stores whitelist groups and their addresses for contract minting';
      COMMENT ON COLUMN whitelist_groups.contract_address IS 'The contract address (lowercase)';
      COMMENT ON COLUMN whitelist_groups.group_id IS 'Unique identifier for the whitelist group';
      COMMENT ON COLUMN whitelist_groups.group_title IS 'Display name for the whitelist group';
      COMMENT ON COLUMN whitelist_groups.addresses IS 'JSON array of whitelisted addresses';
      COMMENT ON COLUMN whitelist_groups.created_by IS 'Address of the user who created the group';
    `;

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: createWhitelistTableSQL
    });

    if (error) {
      console.error('❌ Error creating whitelist_groups table:', error);
      return res.status(500).json({
        error: 'Failed to create whitelist_groups table',
        details: error.message
      });
    }

    console.log('✅ whitelist_groups table created successfully!');

    res.status(200).json({
      success: true,
      message: 'whitelist_groups table created successfully',
      table: 'whitelist_groups',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error creating whitelist_groups table:', error);
    res.status(500).json({
      error: 'Failed to create whitelist_groups table',
      details: error.message
    });
  }
}
