import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { generateMerkleProof, formatAddressesForMerkle } from '@/lib/merkleTree';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, groupId, address } = req.query;

    if (!contractAddress || !groupId || !address) {
      return res.status(400).json({ 
        error: 'Contract address, group ID, and address are required' 
      });
    }

    console.log(`🔐 Generating Merkle proof for ${address} in group ${groupId}`);

    // Get whitelist group from database
    const { data: group, error } = await supabase
      .from('whitelist_groups')
      .select('*')
      .eq('contract_address', contractAddress.toString().toLowerCase())
      .eq('group_id', groupId.toString())
      .single();

    if (error || !group) {
      return res.status(404).json({
        error: 'Whitelist group not found',
        details: error?.message
      });
    }

    // Check if group is activated on-chain
    if (!group.is_activated_onchain || !group.merkle_root) {
      return res.status(400).json({
        error: 'Whitelist group is not activated on-chain yet'
      });
    }

    // Get addresses from the group
    const addresses = group.addresses || [];
    const formattedAddresses = formatAddressesForMerkle(addresses);

    // Check if user address is in the whitelist
    const userAddress = address.toString().toLowerCase();
    if (!formattedAddresses.includes(userAddress)) {
      return res.status(403).json({
        error: 'Address not in whitelist',
        message: 'Your address is not whitelisted for this group'
      });
    }

    // Generate Merkle proof for the address
    const proof = generateMerkleProof(userAddress, formattedAddresses);

    console.log(`✅ Merkle proof generated for ${address}`);

    res.status(200).json({
      success: true,
      proof,
      merkleRoot: group.merkle_root,
      groupTitle: group.group_title,
      message: 'Merkle proof generated successfully'
    });

  } catch (error) {
    console.error('❌ Error generating Merkle proof:', error);
    res.status(500).json({
      error: 'Failed to generate Merkle proof',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
