import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, groupId } = req.query;

    if (!contractAddress || !groupId) {
      return res.status(400).json({ 
        error: 'Contract address and group ID are required' 
      });
    }

    console.log(`🗑️ Deleting whitelist group: ${groupId} for contract ${contractAddress}`);

    // Delete whitelist group
    const { error } = await supabase
      .from('whitelist_groups')
      .delete()
      .eq('contract_address', contractAddress.toString().toLowerCase())
      .eq('group_id', groupId.toString());

    if (error) {
      console.error('❌ Error deleting whitelist group:', error);
      return res.status(500).json({
        error: 'Failed to delete whitelist group',
        details: error.message
      });
    }

    console.log(`✅ Whitelist group deleted successfully`);

    res.status(200).json({
      success: true,
      contractAddress,
      groupId,
      message: 'Whitelist group deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting whitelist group:', error);
    res.status(500).json({
      error: 'Failed to delete whitelist group',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
