import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { contractAddress, tokenId } = req.query;

  if (!contractAddress || typeof contractAddress !== 'string') {
    return res.status(400).json({ error: 'Contract address is required' });
  }

  if (!tokenId || typeof tokenId !== 'string') {
    return res.status(400).json({ error: 'Token ID is required' });
  }

  try {
    // Try to get the stored collection image for this contract
    let collectionImage = `https://picsum.photos/400/400?random=${contractAddress.slice(-4)}`; // Fallback placeholder
    
        try {
          // Try to get image from IPFS first (decentralized, permanent storage)
          console.log(`🌐 Looking for image in IPFS for contract: ${contractAddress}`);
          
          const host = req.headers.host || 'gen-plasma.com';
          const protocol = req.headers['x-forwarded-proto'] || 'https';
          const baseUrl = `${protocol}://${host}`;
          
          const ipfsResponse = await fetch(`${baseUrl}/api/ipfs/get-image?contractAddress=${contractAddress}`);
          
          console.log(`IPFS API response status: ${ipfsResponse.status}`);
          
          if (ipfsResponse.ok) {
            const ipfsData = await ipfsResponse.json();
            if (ipfsData) {
              console.log(`IPFS data found:`, {
                contractAddress: ipfsData.contractAddress,
                ipfsHash: ipfsData.ipfsHash,
                hasGatewayUrl: !!ipfsData.gatewayUrl,
                hasIpfsUrl: !!ipfsData.ipfsUrl,
                uploadedAt: ipfsData.uploadedAt,
                pricing: ipfsData.pricing
              });
              
              if (ipfsData.gatewayUrl || ipfsData.ipfsUrl) {
                collectionImage = ipfsData.gatewayUrl || ipfsData.ipfsUrl;
                console.log(`✅ Using image from IPFS for contract ${contractAddress}`);
                console.log(`🌐 IPFS Hash: ${ipfsData.ipfsHash}`);
                console.log(`🌐 Gateway URL: ${ipfsData.gatewayUrl}`);
                if (ipfsData.pricing) {
                  console.log(`💰 Pricing Tier: ${ipfsData.pricing.tier} (${ipfsData.pricing.cost} ${ipfsData.pricing.currency})`);
                }
              }
            }
          } else {
            console.log(`❌ No IPFS image found for contract ${contractAddress}`);
            
            // Try external storage as fallback
            console.log(`Trying external storage API as fallback...`);
            const externalStorageResponse = await fetch(`${baseUrl}/api/store-image-external?contractAddress=${contractAddress}`);
            
            if (externalStorageResponse.ok) {
              const storageData = await externalStorageResponse.json();
              if (storageData && storageData.imageUrl) {
                collectionImage = storageData.imageUrl;
                console.log(`✅ Using stored image from external storage API for contract ${contractAddress}`);
                if (storageData.compressionRatio) {
                  console.log(`📦 Image was compressed to ${storageData.compressionRatio}% of original size`);
                }
              }
            } else {
              console.log(`❌ No stored image found in external storage API either`);
              
              // Try global cache as final fallback
              if (global.collectionImages && global.collectionImages.has(contractAddress)) {
                const storageData = global.collectionImages.get(contractAddress);
                if (storageData && (storageData.gatewayUrl || storageData.imageUrl)) {
                  collectionImage = storageData.gatewayUrl || storageData.imageUrl;
                  console.log(`✅ Using stored image from global cache fallback for contract ${contractAddress}`);
                  if (storageData.ipfsHash) {
                    console.log(`🌐 IPFS Hash: ${storageData.ipfsHash}`);
                  }
                }
              } else {
                console.log(`❌ No stored image found anywhere, using placeholder`);
              }
            }
          }
        } catch (storageError) {
          console.log('❌ Could not read stored collection image from any storage:', storageError);
          
          // Final fallback: Check global cache
          if (global.collectionImages && global.collectionImages.has(contractAddress)) {
            const storageData = global.collectionImages.get(contractAddress);
            if (storageData && (storageData.gatewayUrl || storageData.imageUrl)) {
              collectionImage = storageData.gatewayUrl || storageData.imageUrl;
              console.log(`✅ Using stored image from global cache fallback for contract ${contractAddress}`);
            }
          }
        }

    const metadata = {
      name: `Token #${tokenId}`,
      description: `NFT #${tokenId} from collection ${contractAddress}`,
      image: collectionImage, // Use the actual collection image
      external_url: `https://gen-plasma.com/mint/${contractAddress}`,
      attributes: [
        {
          trait_type: "Token ID",
          value: tokenId
        },
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
