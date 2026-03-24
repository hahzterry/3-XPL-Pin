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
    const { contractAddress } = req.query;

    if (!contractAddress || typeof contractAddress !== 'string') {
      return res.status(400).json({ error: 'Missing contractAddress' });
    }

    console.log(`🔍 Getting featured status for contract ${contractAddress}`);

    // Get featured status from database
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('featured, name')
      .eq('contract_address', contractAddress.toLowerCase())
      .single();

    if (error) {
      console.log(`Contract ${contractAddress} not found in database, returning default status`);
      // Return default status for contracts not in database
      return res.status(200).json({
        success: true,
        contractAddress,
        featured: false,
        name: 'Unknown Collection'
      });
    }

    console.log(`✅ Contract ${contract.name} featured status: ${contract.featured}`);

    res.status(200).json({
      success: true,
      contractAddress,
      featured: contract.featured || false,
      name: contract.name
    });

  } catch (error) {
    console.error('❌ Error getting featured status:', error);
    res.status(500).json({
      error: 'Failed to get featured status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
