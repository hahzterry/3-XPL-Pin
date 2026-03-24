import { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';

interface HybridStorageRequest {
  contractAddress: string;
  contractType: 'basic' | 'pro' | 'editions';
  imageData: Buffer | string;
  mimeType: string;
  filename: string;
  metadata: any;
  nftItems?: any[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      contractAddress, 
      contractType, 
      imageData, 
      mimeType, 
      filename, 
      metadata, 
      nftItems 
    }: HybridStorageRequest = req.body;

    if (!contractAddress || !imageData || !mimeType || !filename) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert base64 to buffer if needed
    let buffer: Buffer;
    if (typeof imageData === 'string') {
      buffer = Buffer.from(imageData, 'base64');
    } else {
      buffer = imageData;
    }

    // 1. Store image in Vercel Blob Storage
    const imageBlob = await put(`nft-collections/${contractAddress}/collection-image`, buffer as any, {
      access: 'public',
      contentType: mimeType
    });

    // 2. Store metadata in Vercel KV
    const kvMetadata = {
      contractAddress,
      contractType,
      imageUrl: imageBlob.url,
      filename,
      mimeType,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      ...metadata
    };

    await kv.set(`nft:metadata:${contractAddress}`, kvMetadata);
    await kv.sadd('nft:collections', contractAddress);

    // 3. Store NFT items if provided (for Basic/Pro collections)
    if (nftItems && nftItems.length > 0) {
      // Store individual NFT images in Blob Storage
      const nftImagePromises = nftItems.map(async (item, index) => {
        if (item.imageData) {
          const nftBuffer = Buffer.from(item.imageData, 'base64');
          const nftBlob = await put(`nft-collections/${contractAddress}/nft-${index + 1}`, nftBuffer as any, {
            access: 'public',
            contentType: item.mimeType || 'image/png'
          });
          
          return {
            ...item,
            imageUrl: nftBlob.url,
            tokenId: index + 1
          };
        }
        return item;
      });

      const processedNFTs = await Promise.all(nftImagePromises);
      
      // Store NFT items metadata in KV
      await kv.set(`nft:items:${contractAddress}`, processedNFTs);
    }

    // 4. Store contract-specific data based on type
    if (contractType === 'editions') {
      // For editions, store artwork metadata
      await kv.set(`nft:editions:${contractAddress}`, {
        artworkName: metadata.artworkName,
        artworkDescription: metadata.artworkDescription,
        artistName: metadata.artistName,
        imageUrl: imageBlob.url
      });
    }

    if (contractType === 'pro') {
      // For pro, store advanced features metadata
      await kv.set(`nft:pro:${contractAddress}`, {
        royaltyRecipient: metadata.royaltyRecipient,
        royaltyPercentage: metadata.royaltyPercentage,
        onChainStorage: metadata.onChainStorage || false
      });
    }

    res.status(200).json({
      success: true,
      contractAddress,
      contractType,
      imageUrl: imageBlob.url,
      size: buffer.length,
      nftItemsCount: nftItems?.length || 0
    });

  } catch (error: any) {
    console.error('Hybrid storage error:', error);
    res.status(500).json({ 
      error: 'Storage failed', 
      details: error.message 
    });
  }
}

// Helper function to retrieve all data for a contract
export async function getContractData(contractAddress: string) {
  try {
    const [metadata, nftItems, editionsData, proData] = await Promise.all([
      kv.get(`nft:metadata:${contractAddress}`),
      kv.get(`nft:items:${contractAddress}`),
      kv.get(`nft:editions:${contractAddress}`),
      kv.get(`nft:pro:${contractAddress}`)
    ]);

    return {
      metadata,
      nftItems,
      editionsData,
      proData
    };
  } catch (error) {
    console.error('Error retrieving contract data:', error);
    return null;
  }
}
