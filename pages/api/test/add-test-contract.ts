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
    console.log('🔧 Adding test contract to database...');

    // Add the specific contract that was being tested
    const testContract = {
      contract_address: '0xcb30486f9ec7fc30a6eaeae00c374a78acf7f5b3',
      name: 'Plasma Lilshid',
      symbol: 'LILSHID',
      contract_type: 'editions',
      max_supply: 1000,
      mint_price: 0.01,
      deployer: '0x0aB705B9734CB776A8F5b18c9036c14C6828933F',
      deployed_at: new Date().toISOString(),
      featured: true // Make it featured so it shows with a star
    };

    const { data, error } = await supabase
      .from('contracts')
      .upsert(testContract, { onConflict: 'contract_address' })
      .select()
      .single();

    if (error) {
      console.error('Error adding test contract:', error);
      return res.status(500).json({
        error: 'Failed to add test contract',
        details: error.message
      });
    }

    console.log('✅ Test contract added successfully');

    res.status(200).json({
      success: true,
      message: 'Test contract added to database',
      contract: data
    });

  } catch (error) {
    console.error('❌ Error adding test contract:', error);
    res.status(500).json({
      error: 'Failed to add test contract',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
