import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress } = req.query;

    if (!contractAddress || typeof contractAddress !== 'string') {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    console.log(`🔍 Checking contract ${contractAddress} in all database tables...`);

    // Check all tables
    const [proResult, basicResult, editionsResult] = await Promise.all([
      supabase
        .from('pro_artwork')
        .select('contract_address')
        .eq('contract_address', contractAddress.toLowerCase()),
      supabase
        .from('basic_artwork')
        .select('contract_address')
        .eq('contract_address', contractAddress.toLowerCase()),
      supabase
        .from('editions_artwork')
        .select('contract_address')
        .eq('contract_address', contractAddress.toLowerCase())
    ]);

    const results = {
      contractAddress: contractAddress.toLowerCase(),
      pro_artwork: {
        found: proResult.data && proResult.data.length > 0,
        count: proResult.data?.length || 0,
        error: proResult.error
      },
      basic_artwork: {
        found: basicResult.data && basicResult.data.length > 0,
        count: basicResult.data?.length || 0,
        error: basicResult.error
      },
      editions_artwork: {
        found: editionsResult.data && editionsResult.data.length > 0,
        count: editionsResult.data?.length || 0,
        error: editionsResult.error
      }
    };

    console.log('📊 Database check results:', results);

    res.status(200).json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('❌ Error checking contract in database:', error);
    res.status(500).json({
      error: 'Failed to check contract in database',
      details: error.message
    });
  }
}
