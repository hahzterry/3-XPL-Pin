import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { generateMerkleTree, formatAddressesForMerkle, getMerkleTreeStats } from '@/lib/merkleTree';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, groupId } = req.body;

    if (!contractAddress || !groupId) {
      return res.status(400).json({ 
        error: 'Contract address and group ID are required' 
      });
    }

    console.log(`🌳 Generating Merkle root for group ${groupId} in contract ${contractAddress}`);

    // Get whitelist group from database
    const { data: group, error } = await supabase
      .from('whitelist_groups')
      .select('*')
      .eq('contract_address', contractAddress.toLowerCase())
      .eq('group_id', groupId)
      .single();

    if (error || !group) {
      return res.status(404).json({
        error: 'Whitelist group not found',
        details: error?.message
      });
    }

    // Get addresses from the group
    const addresses = group.addresses || [];
    
    if (addresses.length === 0) {
      return res.status(400).json({
        error: 'Cannot generate Merkle root for empty whitelist'
      });
    }

    // Format and validate addresses
    const formattedAddresses = formatAddressesForMerkle(addresses);
    
    if (formattedAddresses.length === 0) {
      return res.status(400).json({
        error: 'No valid addresses found in whitelist'
      });
    }

    // Generate Merkle tree
    const { root } = generateMerkleTree(formattedAddresses);
    const stats = getMerkleTreeStats(formattedAddresses);

    // Store Merkle root in database (not yet activated on-chain)
    const { error: updateError } = await supabase
      .from('whitelist_groups')
      .update({
        merkle_root: root,
        updated_at: new Date().toISOString()
      })
      .eq('contract_address', contractAddress.toLowerCase())
      .eq('group_id', groupId);

    if (updateError) {
      console.error('❌ Error saving Merkle root:', updateError);
      return res.status(500).json({
        error: 'Failed to save Merkle root',
        details: updateError.message
      });
    }

    console.log(`✅ Merkle root generated and saved: ${root}`);

    res.status(200).json({
      success: true,
      merkleRoot: root,
      stats: {
        totalAddresses: stats.totalAddresses,
        treeDepth: stats.treeDepth,
        groupTitle: group.group_title
      },
      message: 'Merkle root generated successfully'
    });

  } catch (error) {
    console.error('❌ Error generating Merkle root:', error);
    res.status(500).json({
      error: 'Failed to generate Merkle root',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
