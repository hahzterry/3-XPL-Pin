import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractAddress, tokenId } = req.query;

  if (!contractAddress || typeof contractAddress !== 'string') {
    return res.status(400).json({ error: 'Contract address is required' });
  }

  if (!tokenId || typeof tokenId !== 'string') {
    return res.status(400).json({ error: 'Token ID is required' });
  }

  try {
    console.log(`🔍 Fetching Basic metadata for token ${tokenId} in contract ${contractAddress}`);
    
    // Try to fetch stored NFT item from basic_artwork table
    let storedArtwork = null;
    try {
      // Try to get contract mapping from database first
      let actualContractAddress = contractAddress;
      
      try {
        const { data: mapping, error: mappingError } = await supabase
          .from('contract_mappings')
          .select('contract_address')
          .eq('url_slug', contractAddress.toLowerCase())
          .single();

        if (!mappingError && mapping) {
          actualContractAddress = mapping.contract_address;
          console.log(`✅ Found contract mapping: ${contractAddress} -> ${actualContractAddress}`);
        }
      } catch (error) {
        console.log(`⚠️ Error fetching contract mapping, using original address: ${contractAddress}`);
      }
      console.log(`🔍 Looking for Basic artwork data with contract address: ${actualContractAddress} (original: ${contractAddress})`);
      
      const { data: artworkData, error: artworkError } = await supabase
        .from('basic_artwork')
        .select('*')
        .eq('contract_address', actualContractAddress.toLowerCase())
        .eq('token_id', parseInt(tokenId))
        .single();

      if (!artworkError && artworkData) {
        storedArtwork = artworkData;
        console.log(`✅ Found stored artwork for token ${tokenId}:`, storedArtwork);
      }
    } catch (artworkError) {
      console.log('Could not fetch stored artwork:', artworkError);
    }
    
    // Check if there's a custom IPFS image for this contract
    let customImageUrl = null;
    
    try {
      console.log(`🔍 Looking for IPFS image in collection_images table for contract: ${contractAddress.toLowerCase()}`);
      
      // First, try to find IPFS images (prioritize IPFS over Supabase)
      // Try both lowercase and original case
      let ipfsData = null;
      let error = null;
      
      // Try lowercase first
      const { data: ipfsDataLower, error: errorLower } = await supabase
        .from('collection_images')
        .select('image_url, ipfs_hash, uploaded_at')
        .eq('contract_address', contractAddress.toLowerCase())
        .not('ipfs_hash', 'is', null) // Only get records with IPFS hash
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single();

      if (!errorLower && ipfsDataLower) {
        ipfsData = ipfsDataLower;
        error = null;
        console.log(`✅ Found IPFS image with lowercase address`);
      } else {
        // Try original case
        console.log(`🔍 No IPFS image found with lowercase, trying original case...`);
        const { data: ipfsDataOriginal, error: errorOriginal } = await supabase
          .from('collection_images')
          .select('image_url, ipfs_hash, uploaded_at')
          .eq('contract_address', contractAddress)
          .not('ipfs_hash', 'is', null) // Only get records with IPFS hash
          .order('uploaded_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!errorOriginal && ipfsDataOriginal) {
          ipfsData = ipfsDataOriginal;
          error = null;
          console.log(`✅ Found IPFS image with original case address`);
        } else {
          error = errorOriginal || errorLower;
          console.log(`❌ No IPFS image found with either case`);
        }
      }

      // If no IPFS image found, try any image (fallback)
      let fallbackData = null;
      if (error || !ipfsData) {
        console.log(`🔍 No IPFS image found, trying any image...`);
        const { data: anyImageData, error: anyImageError } = await supabase
          .from('collection_images')
          .select('image_url, ipfs_hash, uploaded_at')
          .eq('contract_address', contractAddress.toLowerCase())
          .order('uploaded_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!anyImageError && anyImageData) {
          fallbackData = anyImageData;
          console.log(`📦 Found fallback image: ${anyImageData.image_url}`);
        }
      }

      console.log(`🔍 Database query result:`, { ipfsData, error });

      if (!error && ipfsData && ipfsData.image_url) {
        customImageUrl = ipfsData.image_url;
        console.log(`✅ Found custom IPFS image: ${customImageUrl}`);
        console.log(`📅 Uploaded at: ${ipfsData.uploaded_at}`);
        console.log(`🌐 IPFS Hash: ${ipfsData.ipfs_hash}`);
      } else if (fallbackData && fallbackData.image_url) {
        customImageUrl = fallbackData.image_url;
        console.log(`📦 Using fallback image: ${customImageUrl}`);
        console.log(`📅 Uploaded at: ${fallbackData.uploaded_at}`);
        console.log(`🌐 IPFS Hash: ${fallbackData.ipfs_hash || 'None'}`);
      } else {
        console.log(`ℹ️ No custom image found, using placeholder`);
        console.log(`🔍 IPFS Error details:`, error);
        console.log(`🔍 IPFS Data received:`, ipfsData);
        console.log(`🔍 Fallback Data:`, fallbackData);
      }
    } catch (ipfsError) {
      console.log(`⚠️ Error checking for IPFS image:`, ipfsError);
    }

    // Generate metadata with stored artwork data if available
    const timestamp = new Date().toISOString();
    
    // Use stored artwork data if available, otherwise use defaults
    const metadata = {
      name: storedArtwork?.name || `Basic NFT #${tokenId}`,
      description: storedArtwork?.description || `NFT #${tokenId} from Basic collection`,
      image: storedArtwork?.ipfs_hash 
        ? `https://ipfs.io/ipfs/${storedArtwork.ipfs_hash}`
        : storedArtwork?.image_url 
        ? storedArtwork.image_url
        : customImageUrl 
        ? customImageUrl
        : `https://gen-plasma.com/api/image/${tokenId}`, // Use generated image as fallback
      external_url: `https://gen-plasma.com/mint/${contractAddress}`,
      attributes: [
        {
          trait_type: "Token ID",
          value: tokenId
        },
        {
          trait_type: "Contract Type",
          value: "Basic"
        },
        {
          trait_type: "Contract Address",
          value: contractAddress
        },
        ...(storedArtwork?.attributes || [])
      ],
      "Metadata Updated": timestamp,
      "Cache Buster": Math.random().toString(36).substring(7)
    };

    console.log(`📄 Generated metadata for token ${tokenId}:`, {
      name: metadata.name,
      image: metadata.image,
      hasCustomImage: !!customImageUrl
    });

    // Set headers for proper NFT metadata serving with cache busting
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Prevent caching
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json(metadata);

  } catch (error) {
    console.error('❌ Error generating metadata:', error);
    res.status(500).json({ 
      error: 'Failed to generate metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
