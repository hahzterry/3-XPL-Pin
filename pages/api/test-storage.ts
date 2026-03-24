import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const storageDir = '/tmp/collection-images';
    
    // Check if storage directory exists
    const dirExists = fs.existsSync(storageDir);
    
    let files: string[] = [];
    let fileContents: any[] = [];
    
    if (dirExists) {
      files = fs.readdirSync(storageDir);
      
      // Read contents of each file
      files.forEach(file => {
        try {
          const filePath = path.join(storageDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(content);
          fileContents.push({
            filename: file,
            contractAddress: parsed.contractAddress,
            hasImageUrl: !!parsed.imageUrl,
            imageUrlLength: parsed.imageUrl?.length,
            uploadedAt: parsed.uploadedAt,
            originalFilename: parsed.originalFilename,
            mimeType: parsed.mimeType,
            size: parsed.size
          });
        } catch (error) {
          fileContents.push({
            filename: file,
            error: 'Failed to parse file'
          });
        }
      });
    }
    
    res.status(200).json({
      storageDir,
      dirExists,
      files,
      fileContents,
      totalFiles: files.length
    });
    
  } catch (error) {
    console.error('Error checking storage:', error);
    res.status(500).json({ 
      error: 'Failed to check storage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
