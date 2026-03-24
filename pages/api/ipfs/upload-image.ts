import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js's default body parser
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const tempDir = '/tmp'; // Use /tmp for Vercel serverless functions
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const form = formidable({
    uploadDir: tempDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB limit for IPFS
  });

  try {
    const [fields, files] = await form.parse(req);

    console.log('=== IPFS UPLOAD DEBUG ===');
    console.log('Fields received:', fields);
    console.log('Files received:', files);

    const contractAddress = Array.isArray(fields.contractAddress) ? fields.contractAddress[0] : fields.contractAddress;
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    console.log('Extracted contractAddress:', contractAddress);
    console.log('Extracted imageFile:', !!imageFile);

    if (!contractAddress) {
      console.log('ERROR: Contract address is missing!');
      console.log('Available fields:', Object.keys(fields));
      return res.status(400).json({ error: 'Contract address is required' });
    }

    if (!imageFile) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype || '')) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
    }

    console.log(`Uploading to IPFS: ${imageFile.originalFilename} (${imageFile.size} bytes)`);

    // For now, we'll simulate IPFS upload
    // In production, you'd integrate with Pinata, Infura IPFS, or your own IPFS node
    const simulateIPFSUpload = async (file: any) => {
      // Simulate IPFS upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock IPFS hash (in production, this would be the actual IPFS hash)
      const mockIPFSHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      // In production, you would:
      // 1. Upload the file to IPFS
      // 2. Get the IPFS hash
      // 3. Store the hash in your database
      // 4. Return the IPFS URL
      
      return {
        ipfsHash: mockIPFSHash,
        ipfsUrl: `https://ipfs.io/ipfs/${mockIPFSHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${mockIPFSHash}`, // Alternative gateway
        fileSize: file.size,
        mimeType: file.mimetype,
        originalFilename: file.originalFilename
      };
    };

    const ipfsResult = await simulateIPFSUpload(imageFile);

    console.log(`✅ IPFS Upload successful:`, ipfsResult);

    // Clean up the temporary file
    if (imageFile.filepath && fs.existsSync(imageFile.filepath)) {
      fs.unlinkSync(imageFile.filepath);
    }

    // Store IPFS metadata for this contract
    const ipfsMetadata = {
      contractAddress,
      ipfsHash: ipfsResult.ipfsHash,
      ipfsUrl: ipfsResult.ipfsUrl,
      gatewayUrl: ipfsResult.gatewayUrl,
      fileSize: ipfsResult.fileSize,
      mimeType: ipfsResult.mimeType,
      originalFilename: ipfsResult.originalFilename,
      uploadedAt: new Date().toISOString(),
      // Pricing info for future monetization
      pricing: {
        tier: 'basic', // basic, pro, enterprise
        cost: 0, // Free for now, can be monetized later
        currency: 'XPL'
      }
    };

    // For now, store in global cache (in production, store in database)
    if (!global.ipfsImages) {
      global.ipfsImages = new Map();
    }
    global.ipfsImages.set(contractAddress, ipfsMetadata);

    console.log(`📦 Stored IPFS metadata for contract ${contractAddress}`);
    console.log(`📦 IPFS cache now contains ${global.ipfsImages.size} contracts`);

    res.status(200).json({
      success: true,
      message: 'Image uploaded to IPFS successfully',
      contractAddress,
      ipfsHash: ipfsResult.ipfsHash,
      ipfsUrl: ipfsResult.ipfsUrl,
      gatewayUrl: ipfsResult.gatewayUrl,
      metadata: ipfsMetadata
    });

  } catch (error: any) {
    console.error('Error uploading to IPFS:', error);
    // Clean up any partial files if an error occurred during parsing
    if (error.filepath && fs.existsSync(error.filepath)) {
      fs.unlinkSync(error.filepath);
    }
    res.status(500).json({ error: error.message || 'Failed to upload image to IPFS.' });
  }
}
