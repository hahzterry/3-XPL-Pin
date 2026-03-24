import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractAddress } = req.query;

  if (!contractAddress || typeof contractAddress !== 'string') {
    return res.status(400).json({ error: 'Contract address is required' });
  }

  try {
    console.log(`🔍 Checking metadata images for contract: ${contractAddress}`);
    
    // Check all images in collection_images table for this contract
    const { data: allImages, error } = await supabase
      .from('collection_images')
      .select('*')
      .eq('contract_address', contractAddress.toLowerCase())
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('❌ Error querying collection_images:', error);
      return res.status(500).json({ 
        error: 'Database query failed', 
        details: error.message 
      });
    }

    console.log(`✅ Found ${allImages?.length || 0} images in collection_images table`);
    
    // Also check mint_banners table for comparison
    const { data: mintBanners, error: bannerError } = await supabase
      .from('mint_banners')
      .select('*')
      .eq('contract_address', contractAddress.toLowerCase())
      .order('uploaded_at', { ascending: false });

    console.log(`✅ Found ${mintBanners?.length || 0} banners in mint_banners table`);

    return res.status(200).json({
      contractAddress,
      collectionImages: allImages || [],
      mintBanners: mintBanners || [],
      totalCollectionImages: allImages?.length || 0,
      totalMintBanners: mintBanners?.length || 0,
      message: 'Database check complete'
    });

  } catch (error) {
    console.error('❌ Error checking metadata images:', error);
    res.status(500).json({ 
      error: 'Failed to check metadata images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
