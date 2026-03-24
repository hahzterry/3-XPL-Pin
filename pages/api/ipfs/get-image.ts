import { NextApiRequest, NextApiResponse } from 'next';

// Extend the global namespace to include IPFS storage
declare global {
  var ipfsImages: Map<string, {
    contractAddress: string;
    ipfsHash: string;
    ipfsUrl: string;
    gatewayUrl: string;
    fileSize: number;
    mimeType: string | null;
    originalFilename: string | null;
    uploadedAt: string;
    pricing: {
      tier: string;
      cost: number;
      currency: string;
    };
  }> | undefined;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { contractAddress } = req.query;

  console.log(`IPFS Get Image API called: GET for contract ${contractAddress}`);

  if (!contractAddress || typeof contractAddress !== 'string') {
    return res.status(400).json({ error: 'Contract address is required' });
  }

  try {
    // Check global IPFS cache
    if (!global.ipfsImages || !global.ipfsImages.has(contractAddress)) {
      console.log(`❌ No IPFS image found for contract ${contractAddress}`);
      console.log(`Available IPFS contracts:`, global.ipfsImages ? Array.from(global.ipfsImages.keys()) : []);
      return res.status(404).json({ error: 'IPFS image not found for this contract' });
    }

    const ipfsData = global.ipfsImages.get(contractAddress);
    
    if (!ipfsData) {
      return res.status(404).json({ error: 'IPFS image data not found' });
    }

    console.log(`✅ Retrieved IPFS image for contract ${contractAddress}:`, {
      ipfsHash: ipfsData.ipfsHash,
      ipfsUrl: ipfsData.ipfsUrl,
      gatewayUrl: ipfsData.gatewayUrl,
      fileSize: ipfsData.fileSize,
      tier: ipfsData.pricing.tier
    });

    res.status(200).json(ipfsData);

  } catch (error) {
    console.error('Error retrieving IPFS image:', error);
    res.status(500).json({ error: 'Failed to retrieve IPFS image' });
  }
}
