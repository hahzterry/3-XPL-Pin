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
    console.log('🔧 Disabling RLS for basic_artwork and pro_artwork tables...');

    const disableRLSSQL = `
      -- Disable RLS for basic_artwork and pro_artwork tables
      -- This matches the setup used for editions_artwork table
      ALTER TABLE basic_artwork DISABLE ROW LEVEL SECURITY;
      ALTER TABLE pro_artwork DISABLE ROW LEVEL SECURITY;
    `;

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: disableRLSSQL
    });

    if (error) {
      console.error('❌ Error disabling RLS:', error);
      return res.status(500).json({
        error: 'Failed to disable RLS',
        details: error.message
      });
    }

    console.log('✅ RLS disabled successfully!');

    res.status(200).json({
      success: true,
      message: 'RLS disabled successfully for basic_artwork and pro_artwork tables',
      tablesUpdated: ['basic_artwork', 'pro_artwork'],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error disabling RLS:', error);
    res.status(500).json({
      error: 'Failed to disable RLS',
      details: error.message
    });
  }
}
