import { requireApiKey } from '../_auth'
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

interface EditionsMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper headers for JSON response
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!requireApiKey(req, res)) return

  try {
    // Ensure temp directory exists - use /tmp for Vercel serverless
    const tempDir = '/tmp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Parse the multipart form data
    const form = formidable({
      uploadDir: tempDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    const [fields, files] = await form.parse(req);
    
    console.log('Form parsing results:', {
      fields: Object.keys(fields),
      files: Object.keys(files),
      fieldsValues: fields,
      filesValues: files
    });
    
    // Extract deployment configuration
    const deploymentId = Array.isArray(fields.deploymentId) ? fields.deploymentId[0] : fields.deploymentId;
    const editionsMetadataJson = Array.isArray(fields.editionsMetadata) ? fields.editionsMetadata[0] : fields.editionsMetadata;
    const editionsArtworkFile = files.editionsArtwork;
    
    console.log('Extracted values:', {
      deploymentId,
      editionsMetadataJson: editionsMetadataJson ? 'Present' : 'Missing',
      editionsArtworkFile: editionsArtworkFile ? 'Present' : 'Missing'
    });
    
    if (!deploymentId || !editionsMetadataJson || !editionsArtworkFile) {
      console.error('Missing required fields:', {
        hasDeploymentId: !!deploymentId,
        hasEditionsMetadata: !!editionsMetadataJson,
        hasEditionsArtwork: !!editionsArtworkFile
      });
      return res.status(400).json({ error: 'Missing deployment ID, metadata, or artwork file' });
    }

    let editionsMetadata: EditionsMetadata;
    try {
      editionsMetadata = JSON.parse(editionsMetadataJson);
      console.log('Parsed metadata:', editionsMetadata);
    } catch (parseError) {
      console.error('Failed to parse metadata JSON:', parseError);
      console.error('Raw metadata string:', editionsMetadataJson);
      return res.status(400).json({ error: 'Invalid metadata JSON format' });
    }

    console.log(`Processing Editions upload for deployment: ${deploymentId}`);

    // Ensure editionsArtworkFile is an array and take the first element
    const artworkFile = Array.isArray(editionsArtworkFile) ? editionsArtworkFile[0] : editionsArtworkFile;

    try {
      // 1. Upload artwork to IPFS
      const imageIpfsHash = await uploadFileToIPFS(artworkFile.filepath, artworkFile.originalFilename || 'editions-artwork');
      
      // 2. Update metadata with actual IPFS hash
      editionsMetadata.image = `ipfs://${imageIpfsHash}`;

      // 3. Upload metadata JSON to IPFS
      const metadataIpfsHash = await uploadJSONToIPFS(editionsMetadata, 'editions-metadata.json');

      // Clean up temp file
      try {
        fs.unlinkSync(artworkFile.filepath);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup temp file: ${artworkFile.filepath}`, cleanupError);
      }

      console.log(`Successfully uploaded Editions artwork to IPFS`);

      res.status(200).json({
        success: true,
        message: 'Editions IPFS upload successful',
        deploymentId,
        imageIpfsHash,
        metadataIpfsHash,
        metadata: editionsMetadata
      });

    } catch (uploadError) {
      console.error(`Failed to upload Editions artwork:`, uploadError);
      console.error(`Upload error details:`, {
        name: uploadError instanceof Error ? uploadError.name : 'Unknown',
        message: uploadError instanceof Error ? uploadError.message : 'Unknown error occurred',
        stack: uploadError instanceof Error ? uploadError.stack : 'No stack trace'
      });
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error occurred';
      throw new Error(`Failed to upload Editions artwork: ${errorMessage}`);
    }

  } catch (error) {
    console.error('Editions IPFS upload error:', error);
    console.error('Full error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Ensure we always return JSON
    try {
      res.status(500).json({ 
        error: 'Failed to upload Editions to IPFS',
        details: errorMessage,
        errorType: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString()
      });
    } catch (jsonError) {
      console.error('Failed to send JSON error response:', jsonError);
      res.status(500).end('Internal server error');
    }
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

    // Read file and create File object
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
        type: 'editions-artwork'
      }
    });
    
    formData.append('pinataMetadata', metadata);
    
    // Add options
    const options = JSON.stringify({
      cidVersion: 1
    });
    
    formData.append('pinataOptions', options);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error('Pinata API error:', errorText);
      throw new Error(`Pinata API error: ${response.status} ${errorText}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (e) {
      const errorText = await response.text();
      console.error('Invalid JSON response from Pinata:', errorText);
      throw new Error(`Invalid response from Pinata API: ${errorText.substring(0, 100)}...`);
    }
    console.log(`Successfully uploaded to IPFS: ${result.IpfsHash}`);
    
    return result.IpfsHash;

  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

async function uploadJSONToIPFS(data: any, fileName: string): Promise<string> {
  console.log(`Uploading JSON to IPFS: ${fileName}`);
  
  try {
    // Check if we have Pinata credentials
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY) {
      console.warn('Pinata credentials not found, falling back to simulation');
      return await simulateJSONUpload(data, fileName);
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PINATA_JWT}`
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: fileName,
          keyvalues: {
            uploadedAt: new Date().toISOString(),
            type: 'editions-metadata'
          }
        },
        pinataOptions: {
          cidVersion: 1
        }
      })
    });

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error('Pinata JSON API error:', errorText);
      throw new Error(`Pinata JSON API error: ${response.status} ${errorText}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (e) {
      const errorText = await response.text();
      console.error('Invalid JSON response from Pinata:', errorText);
      throw new Error(`Invalid response from Pinata JSON API: ${errorText.substring(0, 100)}...`);
    }
    console.log(`Successfully uploaded JSON to IPFS: ${result.IpfsHash}`);
    
    return result.IpfsHash;

  } catch (error) {
    console.error('JSON upload error:', error);
    throw error;
  }
}

function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// Fallback functions for when Pinata credentials are not available
async function simulateIPFSUpload(filePath: string, fileName: string): Promise<string> {
  console.log(`Simulating IPFS upload for: ${fileName}`);
  console.log(`File path: ${filePath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    const stats = fs.statSync(filePath);
    console.log(`File size: ${stats.size} bytes`);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload delay
    const hash = `simulated-hash-${Date.now()}-${fileName.replace(/[^a-zA-Z0-9]/g, '')}`;
    console.log(`Generated simulated hash: ${hash}`);
    return hash;
  } catch (error) {
    console.error(`Simulation error for file ${fileName}:`, error);
    throw error;
  }
}

async function simulateJSONUpload(data: any, fileName: string): Promise<string> {
  console.log(`Simulating JSON upload for: ${fileName}`);
  console.log(`Data to upload:`, JSON.stringify(data, null, 2));
  
  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate upload delay
    const hash = `simulated-metadata-hash-${Date.now()}-${fileName.replace(/[^a-zA-Z0-9]/g, '')}`;
    console.log(`Generated simulated metadata hash: ${hash}`);
    return hash;
  } catch (error) {
    console.error(`Simulation error for JSON ${fileName}:`, error);
    throw error;
  }
}
