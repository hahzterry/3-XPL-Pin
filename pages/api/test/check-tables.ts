import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Checking what tables exist in the database...');

    // Try to query different possible table names
    const tableNames = ['contracts', 'deployed_contracts', 'nft_contracts', 'collections'];
    const results: any = {};

    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error) {
          results[tableName] = {
            exists: true,
            columns: data && data.length > 0 ? Object.keys(data[0]) : [],
            sampleData: data
          };
          console.log(`✅ Table '${tableName}' exists with columns:`, Object.keys(data[0] || {}));
        } else {
          results[tableName] = {
            exists: false,
            error: error.message
          };
          console.log(`❌ Table '${tableName}' does not exist:`, error.message);
        }
      } catch (err) {
        results[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }

    // Also try to get table info using information_schema if possible
    try {
      const { data: tableInfo, error: tableInfoError } = await supabase
        .rpc('exec_sql', {
          sql_query: `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%contract%'
            ORDER BY table_name, ordinal_position;
          `
        });

      if (!tableInfoError && tableInfo) {
        results.tableInfo = tableInfo;
      }
    } catch (err) {
      console.log('Could not get table info from information_schema');
    }

    res.status(200).json({
      success: true,
      message: 'Database table check completed',
      results
    });

  } catch (error) {
    console.error('❌ Error checking tables:', error);
    res.status(500).json({
      error: 'Failed to check tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
