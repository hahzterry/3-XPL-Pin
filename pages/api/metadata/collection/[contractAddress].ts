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
    // Try to get the stored collection image for this contract
    let collectionImage = `https://picsum.photos/400/400?random=${contractAddress.slice(-4)}`; // Fallback placeholder
    
    // First, try Supabase storage (new system)
    try {
      console.log(`🔍 Looking for image in Supabase for collection: ${contractAddress}`);
      
      const { data: imageData, error } = await supabase
        .from('collection_images')
        .select('image_url, uploaded_at, file_size')
        .eq('contract_address', contractAddress.toLowerCase())
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single();

      console.log(`🔍 Supabase query result for ${contractAddress}:`, { imageData, error });

      if (!error && imageData && imageData.image_url) {
        collectionImage = imageData.image_url;
        console.log(`✅ Using Supabase collection image for ${contractAddress}: ${imageData.image_url}`);
        console.log(`📅 Uploaded at: ${imageData.uploaded_at}, Size: ${imageData.file_size} bytes`);
      } else {
        console.log(`❌ No image found in Supabase for collection ${contractAddress}`);
        console.log(`🔍 Error details:`, error);
        console.log(`🔍 Data received:`, imageData);
        
        // Fallback to legacy systems
        try {
          // Try to get image from IPFS (legacy)
          console.log(`🌐 Trying IPFS as fallback for collection: ${contractAddress}`);
          
          const host = req.headers.host || 'gen-plasma.com';
          const protocol = req.headers['x-forwarded-proto'] || 'https';
          const baseUrl = `${protocol}://${host}`;
          
          const ipfsResponse = await fetch(`${baseUrl}/api/ipfs/get-image?contractAddress=${contractAddress}`);
          
          if (ipfsResponse.ok) {
            const ipfsData = await ipfsResponse.json();
            if (ipfsData && (ipfsData.gatewayUrl || ipfsData.ipfsUrl)) {
              collectionImage = ipfsData.gatewayUrl || ipfsData.ipfsUrl;
              console.log(`✅ Using image from IPFS fallback for collection ${contractAddress}`);
            }
          } else {
            // Try global cache as final fallback
            if (global.collectionImages && global.collectionImages.has(contractAddress)) {
              const storageData = global.collectionImages.get(contractAddress);
              if (storageData && (storageData.gatewayUrl || storageData.imageUrl)) {
                collectionImage = storageData.gatewayUrl || storageData.imageUrl;
                console.log(`✅ Using stored image from global cache fallback for collection ${contractAddress}`);
              }
            } else {
              console.log(`❌ No stored image found anywhere, using placeholder`);
            }
          }
        } catch (legacyError) {
          console.log('❌ Legacy storage systems failed:', legacyError);
        }
      }
    } catch (supabaseError) {
      console.log('❌ Supabase retrieval error:', supabaseError);
    }

    const metadata = {
      name: "Collection Metadata",
      description: "This is a placeholder metadata for the collection",
      image: collectionImage, // Use the actual stored image
      external_url: `https://gen-plasma.com/mint/${contractAddress}`,
      attributes: [
        {
          trait_type: "Contract Address",
          value: contractAddress
        },
        {
          trait_type: "Type",
          value: "NFT Collection"
        }
      ]
    };

    res.status(200).json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
}
