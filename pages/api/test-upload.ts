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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper headers for JSON response
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Test upload endpoint called');
    console.log('Request headers:', req.headers);
    console.log('Request method:', req.method);
    
    // Ensure temp directory exists - use /tmp for Vercel serverless
    const tempDir = '/tmp';
    console.log('Temp directory path:', tempDir);
    
    if (!fs.existsSync(tempDir)) {
      try {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('Created temp directory:', tempDir);
      } catch (mkdirError) {
        console.error('Failed to create temp directory:', mkdirError);
        throw new Error(`Failed to create temp directory: ${mkdirError}`);
      }
    } else {
      console.log('Temp directory already exists');
    }

    // Parse the multipart form data
    console.log('Creating formidable instance...');
    const form = formidable({
      uploadDir: tempDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    console.log('Parsing form data...');
    let fields, files;
    try {
      [fields, files] = await form.parse(req);
      console.log('Form parsing completed successfully');
    } catch (parseError) {
      console.error('Form parsing failed:', parseError);
      throw new Error(`Form parsing failed: ${parseError}`);
    }
    
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

    let editionsMetadata;
    try {
      editionsMetadata = JSON.parse(editionsMetadataJson);
      console.log('Parsed metadata:', editionsMetadata);
    } catch (parseError) {
      console.error('Failed to parse metadata JSON:', parseError);
      console.error('Raw metadata string:', editionsMetadataJson);
      return res.status(400).json({ error: 'Invalid metadata JSON format' });
    }

    console.log(`Processing test upload for deployment: ${deploymentId}`);

    // Ensure editionsArtworkFile is an array and take the first element
    const artworkFile = Array.isArray(editionsArtworkFile) ? editionsArtworkFile[0] : editionsArtworkFile;

    console.log('Artwork file details:', {
      filepath: artworkFile.filepath,
      originalFilename: artworkFile.originalFilename,
      size: artworkFile.size,
      mimetype: artworkFile.mimetype
    });

    // Check if file exists
    if (!fs.existsSync(artworkFile.filepath)) {
      throw new Error(`File does not exist: ${artworkFile.filepath}`);
    }

    const stats = fs.statSync(artworkFile.filepath);
    console.log(`File stats: ${stats.size} bytes`);

    // Simulate successful upload
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clean up temp file
    try {
      fs.unlinkSync(artworkFile.filepath);
      console.log('Cleaned up temp file');
    } catch (cleanupError) {
      console.warn(`Failed to cleanup temp file: ${artworkFile.filepath}`, cleanupError);
    }

    console.log('Test upload successful');

    res.status(200).json({
      success: true,
      message: 'Test upload successful',
      deploymentId,
      fileInfo: {
        name: artworkFile.originalFilename,
        size: artworkFile.size,
        type: artworkFile.mimetype
      },
      metadata: editionsMetadata
    });

  } catch (error) {
    console.error('Test upload error:', error);
    console.error('Full error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Ensure we always return JSON with detailed error info
    try {
      res.status(500).json({ 
        error: 'Test upload failed',
        details: errorMessage,
        errorType: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        fullError: error
      });
    } catch (jsonError) {
      console.error('Failed to send JSON error response:', jsonError);
      res.status(500).end('Internal server error');
    }
  }
}
