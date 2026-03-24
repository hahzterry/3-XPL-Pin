import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const storageDir = '/tmp/collection-images';
  
  // Ensure storage directory exists
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  
  if (req.method === 'POST') {
    // Store image data
    const { contractAddress, imageData } = req.body;
    
    console.log(`Store Image File API called: POST for contract ${contractAddress}`);
    
    if (!contractAddress || !imageData) {
      return res.status(400).json({ error: 'Contract address and image data are required' });
    }
    
    try {
      const filePath = path.join(storageDir, `${contractAddress}.json`);
      fs.writeFileSync(filePath, JSON.stringify(imageData, null, 2));
      
      console.log(`✅ Stored image data to file: ${filePath}`);
      
      res.status(200).json({ 
        success: true, 
        message: 'Image data stored to file successfully',
        contractAddress 
      });
    } catch (error) {
      console.error('Error writing file:', error);
      res.status(500).json({ error: 'Failed to store image data to file' });
    }
    
  } else if (req.method === 'GET') {
    // Retrieve image data
    const { contractAddress } = req.query;
    
    console.log(`Store Image File API called: GET for contract ${contractAddress}`);
    
    if (!contractAddress || typeof contractAddress !== 'string') {
      return res.status(400).json({ error: 'Contract address is required' });
    }
    
    try {
      const filePath = path.join(storageDir, `${contractAddress}.json`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return res.status(404).json({ error: 'Image data file not found for this contract' });
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const imageData = JSON.parse(fileContent);
      
      console.log(`✅ Retrieved image data from file: ${filePath}`);
      console.log(`File size: ${fileContent.length} characters`);
      
      res.status(200).json(imageData);
      
    } catch (error) {
      console.error('Error reading file:', error);
      res.status(500).json({ error: 'Failed to read image data file' });
    }
    
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
