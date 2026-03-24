import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Debug: Starting upload debug...');
    console.log('🔍 Debug: Request body keys:', Object.keys(req.body));
    console.log('🔍 Debug: Request body:', JSON.stringify(req.body, null, 2));

    const { imageData, mimeType, filename } = req.body;

    if (!imageData) {
      console.log('❌ Debug: No imageData provided');
      return res.status(400).json({ error: 'No imageData provided' });
    }

    if (!mimeType) {
      console.log('❌ Debug: No mimeType provided');
      return res.status(400).json({ error: 'No mimeType provided' });
    }

    if (!filename) {
      console.log('❌ Debug: No filename provided');
      return res.status(400).json({ error: 'No filename provided' });
    }

    console.log('✅ Debug: All required fields present');
    console.log('🔍 Debug: ImageData length:', imageData.length);
    console.log('🔍 Debug: MimeType:', mimeType);
    console.log('🔍 Debug: Filename:', filename);

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');
    console.log('✅ Debug: Buffer created, size:', buffer.length);

    // Generate unique filename
    const tempFilename = `debug/${Date.now()}-${filename}`;
    console.log('🔍 Debug: Temp filename:', tempFilename);

    // Test Supabase connection
    console.log('🔍 Debug: Testing Supabase connection...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Debug: Bucket list error:', bucketError);
      return res.status(500).json({ error: 'Supabase connection failed', details: bucketError });
    }

    console.log('✅ Debug: Supabase connected, buckets:', buckets?.map(b => b.name));

    // Upload to Supabase Storage
    console.log('🔍 Debug: Starting upload to Supabase...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nft-temp')
      .upload(tempFilename, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Debug: Upload error:', uploadError);
      return res.status(500).json({ error: 'Upload failed', details: uploadError });
    }

    console.log('✅ Debug: Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('nft-temp')
      .getPublicUrl(tempFilename);

    console.log('✅ Debug: Public URL generated:', urlData.publicUrl);

    // List files in bucket to verify
    const { data: files, error: listError } = await supabase.storage
      .from('nft-temp')
      .list('', { limit: 10 });

    if (listError) {
      console.error('❌ Debug: List error:', listError);
    } else {
      console.log('✅ Debug: Files in bucket:', files?.map(f => f.name));
    }

    res.status(200).json({
      success: true,
      message: 'Debug upload successful',
      debug: {
        imageDataLength: imageData.length,
        bufferSize: buffer.length,
        mimeType,
        filename,
        tempFilename,
        uploadData,
        publicUrl: urlData.publicUrl,
        filesInBucket: files?.map(f => f.name)
      }
    });

  } catch (error: any) {
    console.error('❌ Debug: Unexpected error:', error);
    res.status(500).json({ 
      error: 'Debug upload failed', 
      details: error.message,
      stack: error.stack
    });
  }
}
