import { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory storage for demo purposes
// In production, you'd want to use a proper database
let imageStorage: { [contractAddress: string]: any } = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`Storage API called: ${req.method} ${req.url}`);
  console.log(`Query params:`, req.query);
  console.log(`Body keys:`, Object.keys(req.body || {}));
  
  if (req.method === 'POST') {
    // Store image data
    const { contractAddress, imageData } = req.body;
    
    console.log(`POST request - contractAddress: ${contractAddress}, hasImageData: ${!!imageData}`);
    
    if (!contractAddress || !imageData) {
      console.log(`Missing data - contractAddress: ${!!contractAddress}, imageData: ${!!imageData}`);
      return res.status(400).json({ error: 'Contract address and image data are required' });
    }
    
    imageStorage[contractAddress] = imageData;
    
    console.log(`✅ Stored image data for contract ${contractAddress}`);
    console.log(`Storage now contains ${Object.keys(imageStorage).length} contracts`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Image data stored successfully',
      contractAddress 
    });
    
  } else if (req.method === 'GET') {
    // Retrieve image data
    const { contractAddress } = req.query;
    
    console.log(`GET request - contractAddress: ${contractAddress}`);
    
    if (!contractAddress || typeof contractAddress !== 'string') {
      console.log(`Invalid contractAddress: ${contractAddress} (type: ${typeof contractAddress})`);
      return res.status(400).json({ error: 'Contract address is required' });
    }
    
    const imageData = imageStorage[contractAddress];
    
    console.log(`Looking for contract ${contractAddress}, found: ${!!imageData}`);
    console.log(`Available contracts:`, Object.keys(imageStorage));
    
    if (!imageData) {
      return res.status(404).json({ error: 'Image data not found for this contract' });
    }
    
    res.status(200).json(imageData);
    
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
