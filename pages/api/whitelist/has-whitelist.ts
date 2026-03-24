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

    console.log(`🔍 Checking if contract ${contractAddress} has whitelist groups`);

    // Check if this contract has any whitelist groups
    const { data: groups, error } = await supabase
      .from('whitelist_groups')
      .select('id')
      .eq('contract_address', contractAddress.toLowerCase())
      .limit(1);

    if (error) {
      console.error('❌ Error checking whitelist groups:', error);
      return res.status(500).json({
        error: 'Failed to check whitelist groups',
        details: error.message
      });
    }

    const hasWhitelist = groups && groups.length > 0;

    console.log(`✅ Contract ${contractAddress} has whitelist: ${hasWhitelist}`);

    res.status(200).json({
      success: true,
      contractAddress,
      hasWhitelist,
      whitelistCount: groups?.length || 0
    });

  } catch (error) {
    console.error('❌ Error checking whitelist status:', error);
    res.status(500).json({
      error: 'Failed to check whitelist status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
