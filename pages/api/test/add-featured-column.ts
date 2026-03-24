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
    console.log('🔧 Adding featured column to contracts table...');

    // Try to add the featured column using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE contracts
        ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
        
        CREATE INDEX IF NOT EXISTS idx_contracts_featured ON contracts (featured);
      `
    });

    if (error) {
      console.error('Error adding featured column:', error);
      
      // If exec_sql doesn't exist, try a different approach
      if (error.message.includes('exec_sql')) {
        return res.status(500).json({
          error: 'exec_sql function not available',
          message: 'Please add the featured column manually in Supabase dashboard',
          sql: `
            ALTER TABLE contracts
            ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
            
            CREATE INDEX IF NOT EXISTS idx_contracts_featured ON contracts (featured);
          `
        });
      }
      
      return res.status(500).json({
        error: 'Failed to add featured column',
        details: error.message
      });
    }

    console.log('✅ Featured column added successfully');

    res.status(200).json({
      success: true,
      message: 'Featured column added to contracts table successfully',
      data
    });

  } catch (error) {
    console.error('❌ Error adding featured column:', error);
    res.status(500).json({
      error: 'Failed to add featured column',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
