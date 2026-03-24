import { NextApiRequest, NextApiResponse } from 'next';

// Simple external storage using a public URL approach
// In production, you'd want to use IPFS, AWS S3, or similar
let imageStorage: { [contractAddress: string]: any } = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Store image data
    const { contractAddress, imageData } = req.body;
    
    console.log(`External Storage API called: POST for contract ${contractAddress}`);
    console.log(`Image data size: ${JSON.stringify(imageData).length} characters`);
    
    if (!contractAddress || !imageData) {
      return res.status(400).json({ error: 'Contract address and image data are required' });
    }
    
    // Image data is already compressed in upload API, store directly
    imageStorage[contractAddress] = imageData;
    
    console.log(`✅ Stored image data for contract ${contractAddress}`);
    console.log(`Storage now contains ${Object.keys(imageStorage).length} contracts`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Image data stored successfully',
      contractAddress,
      storedSize: JSON.stringify(imageData).length,
      imageSize: imageData.imageUrl?.length || 0,
      compressionInfo: imageData.compressionRatio ? {
        originalSize: imageData.originalSize,
        compressedSize: imageData.compressedSize,
        compressionRatio: imageData.compressionRatio
      } : null
    });
    
  } else if (req.method === 'GET') {
    // Retrieve image data
    const { contractAddress } = req.query;
    
    console.log(`External Storage API called: GET for contract ${contractAddress}`);
    
    if (!contractAddress || typeof contractAddress !== 'string') {
      return res.status(400).json({ error: 'Contract address is required' });
    }
    
    const imageData = imageStorage[contractAddress];
    
    console.log(`Looking for contract ${contractAddress}, found: ${!!imageData}`);
    console.log(`Available contracts:`, Object.keys(imageStorage));
    
    if (!imageData) {
      return res.status(404).json({ error: 'Image data not found for this contract' });
    }
    
    console.log(`✅ Retrieved image data for contract ${contractAddress}`);
    res.status(200).json(imageData);
    
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
