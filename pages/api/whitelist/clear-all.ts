import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress } = req.query;

    if (!contractAddress) {
      return res.status(400).json({ 
        error: 'Contract address is required' 
      });
    }

    console.log(`🗑️ Clearing all whitelist groups for contract ${contractAddress}`);

    // Delete all whitelist groups for this contract
    const { error } = await supabase
      .from('whitelist_groups')
      .delete()
      .eq('contract_address', contractAddress.toString().toLowerCase());

    if (error) {
      console.error('❌ Error clearing whitelist groups:', error);
      return res.status(500).json({
        error: 'Failed to clear whitelist groups',
        details: error.message
      });
    }

    console.log(`✅ All whitelist groups cleared successfully`);

    res.status(200).json({
      success: true,
      contractAddress,
      message: 'All whitelist groups cleared successfully'
    });

  } catch (error) {
    console.error('❌ Error clearing whitelist groups:', error);
    res.status(500).json({
      error: 'Failed to clear whitelist groups',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
