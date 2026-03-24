import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const contractAddress = Array.isArray(fields.contractAddress) ? fields.contractAddress[0] : fields.contractAddress;
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    if (!imageFile) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Validate file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (imageFile.size > maxSize) {
      return res.status(413).json({ 
        error: 'File too large', 
        details: `File size is ${Math.round(imageFile.size / 1024 / 1024)}MB, maximum allowed is 50MB`,
        maxSize: '50MB',
        fileSize: `${Math.round(imageFile.size / 1024 / 1024)}MB`
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype || '')) {
      return res.status(400).json({ 
        error: 'Invalid file type', 
        details: 'Only JPEG, PNG, GIF, and WebP are allowed.',
        allowedTypes: allowedTypes,
        receivedType: imageFile.mimetype
      });
    }

    // Read the uploaded image
    const imageBuffer = fs.readFileSync(imageFile.filepath);
    console.log(`Mint banner processing: Original size ${imageBuffer.length} bytes`);
    
    // Generate unique filename for Supabase storage
    const timestamp = Date.now();
    const filename = `mint-banners/${contractAddress.toLowerCase()}/${timestamp}-${imageFile.originalFilename}`;
    
    // Upload to Supabase Storage
    console.log(`📤 Uploading mint banner to Supabase Storage: ${filename}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nft-temp')
      .upload(filename, imageBuffer, {
        contentType: imageFile.mimetype || 'application/octet-stream',
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
      .getPublicUrl(filename);
    
    const bannerUrl = urlData.publicUrl;
    console.log(`✅ Mint banner upload successful: ${bannerUrl}`);
    
    // Store metadata in Supabase database
    console.log('📤 Storing mint banner metadata in Supabase database...');
    try {
      const { data: insertData, error: dbError } = await supabase
        .from('mint_banners')
        .insert({
          contract_address: contractAddress.toLowerCase(),
          banner_url: bannerUrl,
          file_size: imageFile.size,
          mime_type: imageFile.mimetype || 'application/octet-stream',
          uploaded_at: new Date().toISOString()
        })
        .select();

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        console.error('❌ Error details:', dbError.message, dbError.details, dbError.hint);
        // Don't fail the upload if database insert fails
        console.log('⚠️ Continuing without database metadata...');
      } else {
        console.log('✅ Database insert successful - mint banner stored');
        console.log('✅ Insert result:', insertData);
      }
    } catch (dbErr) {
      console.error('❌ Database error:', dbErr);
      console.log('⚠️ Continuing without database metadata...');
    }
    
    console.log(`✅ Mint banner uploaded for contract ${contractAddress}`);
    console.log(`File: ${imageFile.originalFilename}, Size: ${imageFile.size} bytes`);
    console.log(`Banner URL: ${bannerUrl}`);

    // Clean up the temporary file
    if (imageFile.filepath && fs.existsSync(imageFile.filepath)) {
      fs.unlinkSync(imageFile.filepath);
    }

    res.status(200).json({
      success: true,
      bannerUrl: bannerUrl,
      contractAddress: contractAddress,
      message: 'Mint banner uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Error uploading mint banner:', error);
    res.status(500).json({ 
      error: 'Failed to upload mint banner',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
