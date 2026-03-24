import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface TempUploadRequest {
  contractAddress?: string;
  imageData: string; // base64
  mimeType: string;
  filename: string;
  metadata?: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, imageData, mimeType, filename, metadata }: TempUploadRequest = req.body;

    if (!imageData || !mimeType || !filename) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');

    // Generate unique filename for temporary storage
    const tempFilename = `temp/${Date.now()}-${filename}`;

    // Upload to Supabase Storage (temporary)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nft-temp')
      .upload(tempFilename, buffer, {
        contentType: mimeType,
        cacheControl: '3600', // 1 hour cache
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload to temporary storage' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('nft-temp')
      .getPublicUrl(tempFilename);

    // Store temporary upload metadata in database
    const { error: dbError } = await supabase
      .from('temp_uploads')
      .insert({
        filename: tempFilename,
        original_filename: filename,
        mime_type: mimeType,
        file_size: buffer.length,
        temp_url: urlData.publicUrl,
        contract_address: contractAddress || null,
        metadata: metadata || {},
        uploaded_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      return res.status(500).json({ error: 'Failed to store upload metadata' });
    }

    res.status(200).json({
      success: true,
      tempUrl: urlData.publicUrl,
      filename: tempFilename,
      size: buffer.length,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error: any) {
    console.error('Temp upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
}
