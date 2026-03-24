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
    console.log(`🔍 Fetching Editions metadata for token ${tokenIdStr} in contract ${contractAddressStr}`);
    
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

    // For Editions contracts, all tokens share the same artwork
    // We need to fetch the artwork metadata from the contract or our storage
    
    let artworkMetadata = {
      name: "Digital Artwork",
      description: "A unique digital artwork edition",
      image: customImageUrl || "https://picsum.photos/400/400?random=" + Math.floor(Math.random() * 10000),
      artist: "Unknown Artist"
    };

    // Map URL slugs to actual contract addresses (for existing contracts)
    const contractMapping: { [key: string]: string } = {
      'plasma-gobs': '0x2930a64a90b47615834399828548c92bde2ca8bc',
      'plasma-gobs-2': '0xbee33a0d3564a19cef3e4027b076fb8b04a04b70'
    };

    // For new contracts, the URL slug should match the contract address stored in the database
    // The deployment flow now stores artwork data with the actual contract address
    const actualContractAddress = contractMapping[contractAddressStr] || contractAddressStr;
    console.log(`🔍 Looking for artwork data with contract address: ${actualContractAddress} (original: ${contractAddressStr})`);

    // Try to fetch artwork metadata from our storage
    try {
        // Check if we have stored artwork metadata for this contract
        try {
          const { supabase } = await import('@/lib/supabase');
          
          // Try to find artwork data using the actual contract address
          let { data: artworkData, error } = await supabase
            .from('editions_artwork')
            .select('artwork_name, artwork_description, artwork_image, artist_name')
            .eq('contract_address', actualContractAddress)
            .single();

        // If not found, log the error for debugging
        if (error) {
          console.log(`❌ No artwork data found for contract: ${contractAddressStr}`);
          console.log(`❌ Error details:`, error);
        }

        if (!error && artworkData) {
          artworkMetadata = {
            name: artworkData.artwork_name || artworkMetadata.name,
            description: artworkData.artwork_description || artworkMetadata.description,
            image: artworkData.artwork_image || artworkMetadata.image,
            artist: artworkData.artist_name || artworkMetadata.artist
          };
          console.log(`✅ Using stored artwork metadata:`, artworkMetadata);
        } else {
          console.log(`❌ No artwork data found for contract: ${contractAddressStr}`);
        }
      } catch (supabaseError) {
        console.log('Supabase retrieval error, checking global cache:', supabaseError);
        // Fallback to global cache
        if ((global as any).editionsArtwork && (global as any).editionsArtwork.has(contractAddressStr)) {
          const storedArtwork = (global as any).editionsArtwork.get(contractAddressStr);
          artworkMetadata = {
            name: storedArtwork.name || artworkMetadata.name,
            description: storedArtwork.description || artworkMetadata.description,
            image: storedArtwork.image || artworkMetadata.image,
            artist: storedArtwork.artist || artworkMetadata.artist
          };
        }
      }
    } catch (storageError) {
      console.log('Could not fetch stored artwork metadata:', storageError);
    }

    // Get stored attributes from the database (if attributes column exists)
    let storedAttributes = [];
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: artworkData, error: attrError } = await supabase
        .from('editions_artwork')
        .select('attributes')
        .eq('contract_address', actualContractAddress)
        .single();
      
      if (!attrError && artworkData && artworkData.attributes) {
        storedAttributes = artworkData.attributes;
        console.log(`✅ Found stored attributes:`, storedAttributes);
      } else {
        console.log('No attributes found or attributes column does not exist yet');
      }
    } catch (attrError) {
      console.log('Could not fetch stored attributes (column may not exist):', attrError);
    }

    // Create metadata for this specific edition
    const metadata = {
      name: `${artworkMetadata.name} #${tokenIdStr}`,
      description: `${artworkMetadata.description} - Edition ${tokenIdStr} of ${artworkMetadata.name}`,
      image: artworkMetadata.image,
      external_url: `https://gen-plasma.com/mint/${contractAddressStr}`,
      attributes: [
        // Add stored custom attributes first
        ...storedAttributes,
        // Then add system attributes
        {
          trait_type: "Edition Number",
          value: tokenIdStr
        },
        {
          trait_type: "Artwork Name",
          value: artworkMetadata.name
        },
        {
          trait_type: "Artist",
          value: artworkMetadata.artist
        },
        {
          trait_type: "Contract Type",
          value: "Editions"
        },
        {
          trait_type: "Contract Address",
          value: contractAddressStr
        }
      ]
    };

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
    console.error('Error fetching editions metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
}
