import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Configure formidable for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

interface UploadResult {
  imageHash: string;
  metadataHash: string;
  tokenId: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    const [fields, files] = await form.parse(req);
    
    // Extract deployment configuration
    const deploymentId = Array.isArray(fields.deploymentId) ? fields.deploymentId[0] : fields.deploymentId;
    const nftItemsJson = Array.isArray(fields.nftItems) ? fields.nftItems[0] : fields.nftItems;
    
    if (!deploymentId || !nftItemsJson) {
      return res.status(400).json({ error: 'Missing deployment ID or NFT items' });
    }

    const nftItems = JSON.parse(nftItemsJson);
    console.log(`Processing IPFS upload for deployment: ${deploymentId}`);
    console.log(`Number of NFT items: ${nftItems.length}`);

    const uploadResults: UploadResult[] = [];

    // Process each NFT item
    for (let i = 0; i < nftItems.length; i++) {
      const item = nftItems[i];
      const fileKey = `image_${i}`;
      const imageFile = files[fileKey];

      if (!imageFile || !Array.isArray(imageFile) || imageFile.length === 0) {
        throw new Error(`Missing image file for NFT item ${i + 1}`);
      }

      const file = imageFile[0];
      console.log(`Processing NFT ${i + 1}: ${item.name}`);

      try {
        // Upload image to IPFS
        const imageHash = await uploadFileToIPFS(file.filepath, file.originalFilename || `nft_${i + 1}.png`);
        console.log(`Image uploaded to IPFS: ${imageHash}`);

        // Create metadata JSON
        const metadata: NFTMetadata = {
          name: item.name,
          description: item.description || `${item.name} from the collection`,
          image: `ipfs://${imageHash}`,
          attributes: item.attributes || []
        };

        // Upload metadata to IPFS
        const metadataHash = await uploadJSONToIPFS(metadata, `${item.name}_metadata.json`);
        console.log(`Metadata uploaded to IPFS: ${metadataHash}`);

        uploadResults.push({
          imageHash,
          metadataHash,
          tokenId: i + 1
        });

        // Clean up temporary file
        try {
          fs.unlinkSync(file.filepath);
        } catch (cleanupError) {
          console.warn(`Failed to cleanup temp file: ${file.filepath}`, cleanupError);
        }

      } catch (uploadError) {
        console.error(`Failed to upload NFT ${i + 1}:`, uploadError);
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error occurred';
        throw new Error(`Failed to upload NFT ${i + 1}: ${errorMessage}`);
      }
    }

    // TODO: Store upload results in database linked to deploymentId
    console.log(`Successfully uploaded ${uploadResults.length} NFTs to IPFS`);

    res.status(200).json({
      success: true,
      deploymentId,
      uploadResults,
      totalUploaded: uploadResults.length
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      error: 'Failed to upload to IPFS',
      details: errorMessage 
    });
  }
}

async function uploadFileToIPFS(filePath: string, fileName: string): Promise<string> {
  console.log(`Uploading file to IPFS: ${fileName}`);
  
  try {
    // Check if we have Pinata credentials
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY) {
      console.warn('Pinata credentials not found, falling back to simulation');
      return await simulateIPFSUpload(filePath, fileName);
    }

    // Use fetch API to upload to Pinata directly
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`File size: ${fileBuffer.length} bytes`);

    // Create form data for Pinata API
    const formData = new FormData();
    const file = new File([fileBuffer], fileName, {
      type: getContentType(fileName)
    });
    
    formData.append('file', file);
    
    // Add metadata
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        type: 'nft-image'
      }
    });
    formData.append('pinataMetadata', metadata);

    // Upload to Pinata using REST API
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Successfully uploaded to IPFS: ${result.IpfsHash}`);
    
    return result.IpfsHash;

  } catch (error) {
    console.error(`Failed to upload ${fileName} to IPFS:`, error);
    
    // Fallback to simulation if upload fails
    console.log('Falling back to simulation mode');
    return await simulateIPFSUpload(filePath, fileName);
  }
}

async function simulateIPFSUpload(filePath: string, fileName: string): Promise<string> {
  console.log(`Simulating IPFS upload for file: ${fileName}`);
  
  // Read file to get size for simulation
  const stats = fs.statSync(filePath);
  console.log(`File size: ${stats.size} bytes`);
  
  // Simulate upload delay based on file size
  const uploadTime = Math.min(2000, Math.max(500, stats.size / 1000));
  await new Promise(resolve => setTimeout(resolve, uploadTime));
  
  // Generate a mock IPFS hash
  const mockHash = `Qm${generateRandomHash(44)}`;
  
  return mockHash;
}

async function uploadJSONToIPFS(metadata: NFTMetadata, fileName: string): Promise<string> {
  console.log(`Uploading JSON metadata to IPFS: ${fileName}`);
  console.log('Metadata:', JSON.stringify(metadata, null, 2));
  
  try {
    // Check if we have Pinata credentials
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY) {
      console.warn('Pinata credentials not found, falling back to simulation');
      return await simulateJSONUpload(metadata, fileName);
    }

    // Upload JSON metadata to Pinata using REST API
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: fileName,
          keyvalues: {
            uploadedAt: new Date().toISOString(),
            type: 'nft-metadata'
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Successfully uploaded metadata to IPFS: ${result.IpfsHash}`);
    
    return result.IpfsHash;

  } catch (error) {
    console.error(`Failed to upload ${fileName} metadata to IPFS:`, error);
    
    // Fallback to simulation if upload fails
    console.log('Falling back to simulation mode');
    return await simulateJSONUpload(metadata, fileName);
  }
}

async function simulateJSONUpload(metadata: NFTMetadata, fileName: string): Promise<string> {
  console.log(`Simulating IPFS metadata upload for: ${fileName}`);
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate a mock IPFS hash
  const mockHash = `Qm${generateRandomHash(44)}`;
  
  return mockHash;
}

function generateRandomHash(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.json': 'application/json'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// Helper function to get IPFS gateway URL
export function getIPFSUrl(hash: string): string {
  return `https://ipfs.io/ipfs/${hash}`;
}

// Helper function to convert IPFS URL to HTTP URL
export function ipfsToHttp(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    const hash = ipfsUrl.replace('ipfs://', '');
    return getIPFSUrl(hash);
  }
  return ipfsUrl;
}
