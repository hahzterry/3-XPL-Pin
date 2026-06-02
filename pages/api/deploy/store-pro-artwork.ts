import { requireApiKey } from '../_auth'
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!requireApiKey(req, res)) return

  try {
    const { contractAddress, nftItems } = req.body;

    if (!contractAddress || !nftItems || !Array.isArray(nftItems)) {
      return res.status(400).json({ error: 'Missing required fields: contractAddress and nftItems array' });
    }

    console.log('🎨 Storing Pro artwork data for contract:', contractAddress);
    console.log('📦 NFT items to store:', nftItems.length);

    const { supabase } = await import('@/lib/supabase');

    // Prepare artwork data for database insertion
    const artworkData = nftItems.map((item: any, index: number) => ({
      contract_address: contractAddress.toLowerCase(),
      token_id: index + 1, // 1-based token IDs
      name: item.name || `Pro NFT #${index + 1}`,
      description: item.description || `A unique NFT from Pro collection`,
      image_url: item.imageUrl || null,
      ipfs_hash: item.ipfsHash || null,
      attributes: item.attributes || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log('💾 Inserting artwork data:', artworkData.length, 'items');

    // Insert all artwork data
    const { data, error } = await supabase
      .from('pro_artwork')
      .upsert(artworkData, {
        onConflict: 'contract_address,token_id'
      })
      .select();

    if (error) {
      console.error('❌ Error storing Pro artwork:', error);
      return res.status(500).json({ 
        error: 'Failed to store artwork data',
        details: error.message
      });
    }

    console.log('✅ Pro artwork data stored successfully:', data?.length, 'items');

    res.status(200).json({
      success: true,
      message: 'Pro artwork data stored successfully',
      contractAddress,
      itemsStored: data?.length || 0,
      data
    });

  } catch (error: any) {
    console.error('❌ Error in store-pro-artwork:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
