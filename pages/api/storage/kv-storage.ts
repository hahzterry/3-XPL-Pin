import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

interface KVStorageRequest {
  contractAddress: string;
  data: any;
  type: 'metadata' | 'image' | 'collection';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Store data
    const { contractAddress, data, type }: KVStorageRequest = req.body;

    if (!contractAddress || !data || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const key = `nft:${type}:${contractAddress}`;
      await kv.set(key, data);
      
      // Also store in a collection index for easy querying
      await kv.sadd('nft:collections', contractAddress);
      
      res.status(200).json({
        success: true,
        key,
        contractAddress,
        type
      });

    } catch (error: any) {
      console.error('KV storage error:', error);
      res.status(500).json({ 
        error: 'Storage failed', 
        details: error.message 
      });
    }

  } else if (req.method === 'GET') {
    // Retrieve data
    const { contractAddress, type } = req.query;

    if (!contractAddress || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const key = `nft:${type}:${contractAddress}`;
      const data = await kv.get(key);
      
      if (!data) {
        return res.status(404).json({ error: 'Data not found' });
      }

      res.status(200).json({
        success: true,
        data,
        contractAddress,
        type
      });

    } catch (error: any) {
      console.error('KV retrieval error:', error);
      res.status(500).json({ 
        error: 'Retrieval failed', 
        details: error.message 
      });
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Helper functions
export async function storeNFTMetadata(contractAddress: string, metadata: any) {
  const key = `nft:metadata:${contractAddress}`;
  await kv.set(key, metadata);
  await kv.sadd('nft:collections', contractAddress);
}

export async function getNFTMetadata(contractAddress: string) {
  const key = `nft:metadata:${contractAddress}`;
  return await kv.get(key);
}

export async function getAllCollections() {
  return await kv.smembers('nft:collections');
}
