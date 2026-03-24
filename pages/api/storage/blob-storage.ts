import { NextApiRequest, NextApiResponse } from 'next';
import { put, head } from '@vercel/blob';

interface BlobStorageRequest {
  contractAddress: string;
  imageData: Buffer | string;
  mimeType: string;
  filename: string;
  metadata?: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, imageData, mimeType, filename, metadata }: BlobStorageRequest = req.body;

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

    // Upload to Vercel Blob Storage
    const blob = await put(`nft-collections/${contractAddress}/${filename}`, buffer as any, {
      access: 'public',
      contentType: mimeType
    });

    // Store metadata in a separate blob for easy querying
    const metadataBlob = await put(`nft-collections/${contractAddress}/metadata.json`, JSON.stringify({
      contractAddress,
      imageUrl: blob.url,
      filename,
      mimeType,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      ...metadata
    }), {
      access: 'public',
      contentType: 'application/json'
    });

    res.status(200).json({
      success: true,
      imageUrl: blob.url,
      metadataUrl: metadataBlob.url,
      contractAddress,
      size: buffer.length
    });

  } catch (error: any) {
    console.error('Blob storage error:', error);
    res.status(500).json({ 
      error: 'Storage failed', 
      details: error.message 
    });
  }
}

// Helper function to check if blob exists
export async function checkBlobExists(url: string): Promise<boolean> {
  try {
    await head(url);
    return true;
  } catch {
    return false;
  }
}
