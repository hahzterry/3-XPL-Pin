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
    console.log('🔍 Checking database schema for contracts table...');

    // Try to query the contracts table to see what columns exist
    const { data: contracts, error: queryError } = await supabase
      .from('contracts')
      .select('*')
      .limit(1);

    if (queryError) {
      console.error('Error querying contracts table:', queryError);
      return res.status(500).json({ 
        error: 'Database query failed',
        details: queryError.message 
      });
    }

    // Try to insert a test record to see if featured column exists
    const testContract = {
      contract_address: '0x0000000000000000000000000000000000000000',
      name: 'Test Contract',
      symbol: 'TEST',
      contract_type: 'basic',
      max_supply: 1000,
      mint_price: 0.1,
      deployer: '0x0000000000000000000000000000000000000000',
      deployed_at: new Date().toISOString(),
      featured: false
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('contracts')
      .insert(testContract)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting test contract:', insertError);
      
      // Check if it's a column error
      if (insertError.message.includes('featured')) {
        return res.status(200).json({
          success: false,
          message: 'Featured column does not exist in contracts table',
          error: insertError.message,
          recommendation: 'Run the database migration to add the featured column'
        });
      }
      
      return res.status(500).json({
        error: 'Failed to insert test contract',
        details: insertError.message
      });
    }

    // Clean up test record
    await supabase
      .from('contracts')
      .delete()
      .eq('contract_address', '0x0000000000000000000000000000000000000000');

    console.log('✅ Database schema check successful - featured column exists');

    res.status(200).json({
      success: true,
      message: 'Database schema is correct - featured column exists',
      testInsert: insertResult
    });

  } catch (error) {
    console.error('❌ Error checking database schema:', error);
    res.status(500).json({
      error: 'Failed to check database schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
