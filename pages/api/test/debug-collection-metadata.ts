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
    console.log(`🔍 Debugging collection metadata for: ${contractAddress}`);
    
    // Check what the collection metadata API would find (trying lowercase)
    const { data: imageData, error } = await supabase
      .from('collection_images')
      .select('image_url, uploaded_at, file_size')
      .eq('contract_address', contractAddress.toLowerCase())
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    console.log(`🔍 Supabase query result for ${contractAddress.toLowerCase()}:`, { imageData, error });

    let collectionImage = `https://picsum.photos/400/400?random=${contractAddress.slice(-4)}`; // Fallback placeholder

    if (!error && imageData && imageData.image_url) {
      collectionImage = imageData.image_url;
      console.log(`✅ Found image: ${collectionImage}`);
    } else {
      console.log(`❌ No image found with lowercase. Error:`, error);
      console.log(`❌ Data:`, imageData);
      
      // Try with original case as fallback
      const { data: imageDataOriginal, error: errorOriginal } = await supabase
        .from('collection_images')
        .select('image_url, uploaded_at, file_size')
        .eq('contract_address', contractAddress)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single();
        
      console.log(`🔍 Trying original case ${contractAddress}:`, { imageDataOriginal, errorOriginal });
      
      if (!errorOriginal && imageDataOriginal && imageDataOriginal.image_url) {
        collectionImage = imageDataOriginal.image_url;
        console.log(`✅ Found image with original case: ${collectionImage}`);
      }
    }

    // Also check all images for this contract
    const { data: allImages, error: allError } = await supabase
      .from('collection_images')
      .select('*')
      .eq('contract_address', contractAddress)
      .order('uploaded_at', { ascending: false });

    console.log(`🔍 All images for ${contractAddress}:`, { allImages, allError });

    return res.status(200).json({
      contractAddress,
      foundImage: collectionImage,
      queryResult: { imageData, error },
      allImages: allImages || [],
      isUsingPlaceholder: collectionImage.includes('picsum.photos'),
      message: error ? `Error: ${error.message}` : 'Query successful'
    });

  } catch (error) {
    console.error('❌ Error debugging collection metadata:', error);
    res.status(500).json({ 
      error: 'Failed to debug collection metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
