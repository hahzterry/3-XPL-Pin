import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== COLLECTION IMAGE UPLOAD API ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tempDir = '/tmp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const form = formidable({
      uploadDir: tempDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
    });

    let fields, files;
    try {
      [fields, files] = await form.parse(req);
    } catch (parseError: any) {
      console.error('❌ Formidable parsing error:', parseError);
      if (parseError.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          error: 'File too large', 
          details: 'Maximum file size is 50MB',
          maxSize: '50MB'
        });
      }
      return res.status(400).json({ 
        error: 'Failed to parse form data', 
        details: parseError.message 
      });
    }

    console.log('=== FORM PARSING DEBUG ===');
    console.log('Fields received:', fields);
    console.log('Files received:', files);
    console.log('contractAddress field:', fields.contractAddress);
    console.log('contractAddress type:', typeof fields.contractAddress);
    console.log('contractAddress isArray:', Array.isArray(fields.contractAddress));

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

    // Validate file size (additional check)
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
    console.log(`Image processing: Original size ${imageBuffer.length} bytes`);
    
    // Generate unique filename for Supabase storage
    const timestamp = Date.now();
    const filename = `collection/${contractAddress}/${timestamp}-${imageFile.originalFilename}`;
    
    // Upload to Supabase Storage
    console.log(`📤 Uploading to Supabase Storage: ${filename}`);
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
    
    const finalImageUrl = urlData.publicUrl;
    console.log(`✅ Upload successful: ${finalImageUrl}`);
    
    // Store metadata in Supabase database (permanent storage, no transaction needed)
    console.log('📤 Storing collection image metadata in Supabase database...');
    console.log('📤 Insert data:', {
      contract_address: contractAddress,
      image_url: finalImageUrl,
      file_size: imageFile.size,
      mime_type: imageFile.mimetype || 'application/octet-stream',
      uploaded_at: new Date().toISOString()
    });
    
    try {
      const { data: insertData, error: dbError } = await supabase
        .from('collection_images')
        .insert({
          contract_address: contractAddress.toLowerCase(),
          image_url: finalImageUrl, // Supabase URL for permanent storage
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
        console.log('✅ Database insert successful - collection image stored permanently');
        console.log('✅ Insert result:', insertData);
      }
    } catch (dbErr) {
      console.error('❌ Database error:', dbErr);
      console.log('⚠️ Continuing without database metadata...');
    }
    
    console.log(`✅ Collection image uploaded for contract ${contractAddress}`);
    console.log(`File: ${imageFile.originalFilename}, Size: ${imageFile.size} bytes`);
    console.log(`Supabase URL: ${finalImageUrl}`);

    // Clean up the temporary file
    if (imageFile.filepath && fs.existsSync(imageFile.filepath)) {
      fs.unlinkSync(imageFile.filepath);
    }

    res.status(200).json({
      success: true,
      imageUrl: finalImageUrl, // Return Supabase URL for permanent storage
      contractAddress: contractAddress,
      message: 'Collection image uploaded successfully to Supabase (permanent storage)'
    });

  } catch (error) {
    console.error('❌ Error uploading collection image:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Ensure we always return JSON
    try {
      res.status(500).json({ 
        error: 'Failed to upload collection image',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } catch (jsonError) {
      console.error('❌ Failed to send JSON response:', jsonError);
      // Last resort - send plain text
      res.status(500).end('Internal server error');
    }
  }
}
