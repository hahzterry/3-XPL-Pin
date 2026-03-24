import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { contractAddress, tokenId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!contractAddress || !tokenId) {
    return res.status(400).json({ error: 'Contract address and token ID are required' });
  }

  // Ensure contractAddress is a string
  const contractAddressStr = Array.isArray(contractAddress) ? contractAddress[0] : contractAddress;
  const tokenIdStr = Array.isArray(tokenId) ? tokenId[0] : tokenId;

  try {
    console.log(`🔍 Fetching Pro metadata for token ${tokenIdStr} in contract ${contractAddressStr}`);
    
    // Check if there's a custom IPFS image for this contract (same as Basic API)
    let customImageUrl = null;
    
    try {
      console.log(`🔍 Looking for IPFS image in collection_images table for contract: ${contractAddressStr.toLowerCase()}`);
      
      const { supabase } = await import('@/lib/supabase');
      
      // First, try to find IPFS images (prioritize IPFS over Supabase)
      const { data: ipfsImages, error: ipfsError } = await supabase
        .from('collection_images')
        .select('*')
        .eq('contract_address', contractAddressStr.toLowerCase())
        .not('ipfs_hash', 'is', null)
        .order('uploaded_at', { ascending: false })
        .limit(1);

      if (!ipfsError && ipfsImages && ipfsImages.length > 0) {
        const ipfsImage = ipfsImages[0];
        customImageUrl = `https://ipfs.io/ipfs/${ipfsImage.ipfs_hash}`;
        console.log(`✅ Found IPFS image: ${customImageUrl}`);
      } else {
        // Fallback to any image if no IPFS image is found
        const { data: anyImages, error: anyError } = await supabase
          .from('collection_images')
          .select('*')
          .eq('contract_address', contractAddressStr.toLowerCase())
          .order('uploaded_at', { ascending: false })
          .limit(1);

        if (!anyError && anyImages && anyImages.length > 0) {
          const anyImage = anyImages[0];
          if (anyImage.supabase_url) {
            customImageUrl = anyImage.supabase_url;
            console.log(`✅ Found Supabase image: ${customImageUrl}`);
          }
        }
      }
    } catch (imageError) {
      console.log('Could not fetch custom image:', imageError);
    }

    // For Pro contracts, we can have on-chain metadata or off-chain metadata
    let metadata = {
      name: `Pro NFT #${tokenIdStr}`,
      description: `Advanced NFT #${tokenIdStr} from Pro collection`,
      image: customImageUrl || "https://picsum.photos/400/400?random=" + Math.floor(Math.random() * 10000),
      external_url: `https://gen-plasma.com/mint/${contractAddressStr}`,
      attributes: [
        {
          trait_type: "Token ID",
          value: tokenIdStr
        },
        {
          trait_type: "Contract Type",
          value: "Pro"
        },
        {
          trait_type: "Contract Address",
          value: contractAddressStr
        }
      ]
    };

    // Try to fetch stored NFT item from pro_artwork table
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Try to get contract mapping from database first
      let actualContractAddress = contractAddressStr;
      
      try {
        const { data: mapping, error: mappingError } = await supabase
          .from('contract_mappings')
          .select('contract_address')
          .eq('url_slug', contractAddressStr.toLowerCase())
          .single();

        if (!mappingError && mapping) {
          actualContractAddress = mapping.contract_address;
          console.log(`✅ Found contract mapping: ${contractAddressStr} -> ${actualContractAddress}`);
        } else {
          // Fallback to hardcoded mappings for existing contracts
          const contractMapping: { [key: string]: string } = {
            'plasma-jiggas': '0x316735c50b9f73457c7f8e94b332fa12c2e73284',
            'test-collection': '0xec9cd6d3680aa7b79595e78d64c13add760ddef4'
          };
          
          if (contractMapping[contractAddressStr]) {
            actualContractAddress = contractMapping[contractAddressStr];
            console.log(`✅ Using hardcoded mapping: ${contractAddressStr} -> ${actualContractAddress}`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Error fetching contract mapping, using original address: ${contractAddressStr}`);
      }
      console.log(`🔍 Looking for Pro artwork data with contract address: ${actualContractAddress} (original: ${contractAddressStr})`);
      
      const { data: artworkData, error: artworkError } = await supabase
        .from('pro_artwork')
        .select('*')
        .eq('contract_address', actualContractAddress.toLowerCase())
        .eq('token_id', parseInt(tokenIdStr))
        .single();

      if (!artworkError && artworkData) {
        console.log(`✅ Found stored artwork for token ${tokenIdStr}:`, artworkData);
        
        // Use the stored artwork data
        metadata = {
          name: artworkData.name || `Pro NFT #${tokenIdStr}`,
          description: artworkData.description || `Advanced NFT #${tokenIdStr} from Pro collection`,
          image: artworkData.ipfs_hash 
            ? `https://ipfs.io/ipfs/${artworkData.ipfs_hash}`
            : artworkData.image_url 
            ? artworkData.image_url
            : customImageUrl 
            ? customImageUrl
            : `https://gen-plasma.com/api/image/${tokenIdStr}`, // Use generated image as fallback
          external_url: `https://gen-plasma.com/mint/${contractAddressStr}`,
          attributes: [
            {
              trait_type: "Token ID",
              value: tokenIdStr
            },
            {
              trait_type: "Contract Type",
              value: "Pro"
            },
            {
              trait_type: "Contract Address",
              value: contractAddressStr
            },
            ...(artworkData.attributes || [])
          ]
        };
      }
    } catch (artworkError) {
      console.log('Could not fetch from pro_artwork table, trying on-chain metadata:', artworkError);
      
      // Fallback to on-chain metadata check
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: onChainData, error } = await supabase
          .from('nft_items')
          .select('attributes')
          .eq('contract_address', contractAddressStr)
          .eq('token_id', parseInt(tokenIdStr))
          .single();

        if (!error && onChainData && onChainData.attributes) {
          // Use the stored attributes
          metadata = {
            ...metadata,
            attributes: onChainData.attributes
          };
        }
      } catch (supabaseError) {
        console.log('Supabase retrieval error, checking global cache:', supabaseError);
        // Fallback to global cache
        if ((global as any).proOnChainMetadata && (global as any).proOnChainMetadata.has(`${contractAddressStr}_${tokenIdStr}`)) {
          const onChainData = (global as any).proOnChainMetadata.get(`${contractAddressStr}_${tokenIdStr}`);
          if (onChainData) {
            const parsedMetadata = JSON.parse(onChainData);
            metadata = {
              ...metadata,
              ...parsedMetadata,
              name: parsedMetadata.name || metadata.name,
              description: parsedMetadata.description || metadata.description,
              image: parsedMetadata.image || metadata.image,
              external_url: metadata.external_url,
              attributes: parsedMetadata.attributes || metadata.attributes
            };
          }
        }
      }
    }

    // Try to fetch collection-level metadata
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: contractData, error } = await supabase
        .from('contracts')
        .select('name, symbol')
        .eq('address', contractAddressStr)
        .single();

      if (!error && contractData) {
        metadata.attributes.push({
          trait_type: "Collection Name",
          value: contractData.name || "Pro Collection"
        });
        metadata.attributes.push({
          trait_type: "Symbol",
          value: contractData.symbol || "PRO"
        });
      }
    } catch (collectionError) {
      console.log('Could not fetch collection metadata:', collectionError);
      // Fallback to global cache
      if ((global as any).proCollectionMetadata && (global as any).proCollectionMetadata.has(contractAddressStr)) {
        const collectionData = (global as any).proCollectionMetadata.get(contractAddressStr);
        if (collectionData) {
          metadata.attributes.push({
            trait_type: "Collection Name",
            value: collectionData.name || "Pro Collection"
          });
          if (collectionData.description) {
            metadata.description = `${collectionData.description} - Token #${tokenIdStr}`;
          }
        }
      }
    }

    // Add cache-busting headers and timestamp to prevent caching issues
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Add timestamp to metadata to prevent caching
    const metadataWithTimestamp = {
      ...metadata,
      "Metadata Updated": new Date().toISOString(),
      "Cache Buster": Math.random().toString(36).substring(7)
    };
    
    res.status(200).json(metadataWithTimestamp);
  } catch (error) {
    console.error('Error fetching pro metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
}
