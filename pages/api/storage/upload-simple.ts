import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📤 Simple upload starting...');

    // Parse the form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📁 File received:', file.originalFilename, file.mimetype, file.size);

    // Read the file
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Generate unique filename
    const timestamp = Date.now();
    const tempFilename = `temp/${timestamp}-${file.originalFilename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nft-temp')
      .upload(tempFilename, fileBuffer, {
        contentType: file.mimetype || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload to storage', details: uploadError });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('nft-temp')
      .getPublicUrl(tempFilename);

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    res.status(200).json({
      success: true,
      tempUrl: urlData.publicUrl,
      filename: tempFilename,
      size: file.size,
      uploadedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Simple upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
}
