import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, groupId, activatedBy, transactionHash } = req.body;

    if (!contractAddress || !groupId || !activatedBy) {
      return res.status(400).json({ 
        error: 'Contract address, group ID, and activatedBy are required' 
      });
    }

    console.log(`✅ Marking group ${groupId} as activated on-chain`);

    // Update group to mark as activated
    const { error: updateError } = await supabase
      .from('whitelist_groups')
      .update({
        is_activated_onchain: true,
        activated_at: new Date().toISOString(),
        activated_by: activatedBy.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('contract_address', contractAddress.toLowerCase())
      .eq('group_id', groupId);

    if (updateError) {
      console.error('❌ Error activating group:', updateError);
      return res.status(500).json({
        error: 'Failed to activate group',
        details: updateError.message
      });
    }

    console.log(`✅ Group ${groupId} activated on-chain successfully`);

    res.status(200).json({
      success: true,
      contractAddress,
      groupId,
      transactionHash,
      activatedAt: new Date().toISOString(),
      message: 'Group activated on-chain successfully'
    });

  } catch (error) {
    console.error('❌ Error activating group on-chain:', error);
    res.status(500).json({
      error: 'Failed to activate group on-chain',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
