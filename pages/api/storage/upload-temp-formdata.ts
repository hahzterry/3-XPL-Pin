import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📤 Uploading file via FormData...');
    console.log('📤 Request headers:', req.headers);
    console.log('📤 Request method:', req.method);

    // Parse the form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
    });

    console.log('📤 Parsing form data...');
    const [fields, files] = await form.parse(req);
    
    console.log('📤 Fields received:', Object.keys(fields));
    console.log('📤 Files received:', Object.keys(files));
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const contractAddress = Array.isArray(fields.contractAddress) ? fields.contractAddress[0] : fields.contractAddress?.[0];
    const metadata = Array.isArray(fields.metadata) ? JSON.parse(fields.metadata[0]) : JSON.parse(fields.metadata?.[0] || '{}');

    if (!file) {
      console.error('❌ No file provided in request');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📁 File received:', file.originalFilename, file.mimetype, file.size);

    // Read the file
    console.log('📤 Reading file from:', file.filepath);
    const fileBuffer = fs.readFileSync(file.filepath);
    console.log('📤 File buffer size:', fileBuffer.length);
    
    // Sanitize filename to remove special characters and spaces
    const sanitizeFilename = (filename: string) => {
      return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    };

    const sanitizedFilename = sanitizeFilename(file.originalFilename || 'upload');
    const tempFilename = `temp/${Date.now()}-${sanitizedFilename}`;
    console.log('📤 Original filename:', file.originalFilename);
    console.log('📤 Sanitized filename:', sanitizedFilename);
    console.log('📤 Temp filename:', tempFilename);

    // Upload to Supabase Storage
    console.log('📤 Uploading to Supabase...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nft-temp')
      .upload(tempFilename, fileBuffer, {
        contentType: file.mimetype || 'application/octet-stream',
        cacheControl: '3600', // 1 hour cache
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload to temporary storage', details: uploadError });
    }

    console.log('✅ Supabase upload successful:', uploadData);

    // Get public URL
    console.log('📤 Getting public URL...');
    const { data: urlData } = supabase.storage
      .from('nft-temp')
      .getPublicUrl(tempFilename);
    console.log('📤 Public URL:', urlData.publicUrl);

    // Store temporary upload metadata in database
    console.log('📤 Storing metadata in database...');
    let tempUploadId = null;
    try {
      const { data: insertData, error: dbError } = await supabase
        .from('temp_uploads')
        .insert({
          filename: tempFilename,
          original_filename: file.originalFilename || 'unknown',
          sanitized_filename: sanitizedFilename,
          temp_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.mimetype || 'application/octet-stream',
          uploaded_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        // Don't fail the upload if database insert fails
        console.log('⚠️ Continuing without database metadata...');
      } else {
        tempUploadId = insertData.id;
        console.log('✅ Database insert successful, ID:', tempUploadId);
      }
    } catch (dbErr) {
      console.error('❌ Database error:', dbErr);
      console.log('⚠️ Continuing without database metadata...');
    }

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    res.status(200).json({
      success: true,
      tempUrl: urlData.publicUrl,
      filename: tempFilename,
      size: file.size,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      tempUploadId: tempUploadId
    });

  } catch (error: any) {
    console.error('FormData upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
}
