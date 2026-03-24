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
    console.log(`🔍 Fetching mint banner for contract: ${contractAddress}`);
    
    // Get the most recent mint banner for this contract
    const { data: bannerData, error } = await supabase
      .from('mint_banners')
      .select('banner_url, uploaded_at, file_size')
      .eq('contract_address', contractAddress.toLowerCase())
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    console.log(`🔍 Mint banner query result for ${contractAddress}:`, { bannerData, error });

    if (!error && bannerData && bannerData.banner_url) {
      console.log(`✅ Found mint banner: ${bannerData.banner_url}`);
      return res.status(200).json({
        success: true,
        bannerUrl: bannerData.banner_url,
        uploadedAt: bannerData.uploaded_at,
        fileSize: bannerData.file_size
      });
    } else {
      console.log(`❌ No mint banner found for contract ${contractAddress}`);
      return res.status(404).json({
        success: false,
        message: 'No mint banner found for this contract'
      });
    }

  } catch (error) {
    console.error('❌ Error fetching mint banner:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mint banner',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
