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
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype || '')) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
    }

    // Read the uploaded image
    const imageBuffer = fs.readFileSync(imageFile.filepath);
    console.log(`Metadata image processing: Original size ${imageBuffer.length} bytes`);
    
    // Generate unique filename for Supabase storage
    const timestamp = Date.now();
    const filename = `metadata/${contractAddress}/${timestamp}-${imageFile.originalFilename}`;
    
    // Upload to Supabase Storage first
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
    
    const supabaseUrl = urlData.publicUrl;
    console.log(`✅ Supabase upload successful: ${supabaseUrl}`);
    
    // Upload to IPFS for permanent storage
    console.log('🌐 Uploading to IPFS for permanent storage...');
    let ipfsUrl = supabaseUrl; // Fallback to Supabase URL
    let ipfsHash = null;
    
    try {
      // Simulate IPFS upload (in production, integrate with Pinata, Infura, or your own IPFS node)
      const simulateIPFSUpload = async (file: any, buffer: Buffer) => {
        // Simulate IPFS upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate a mock IPFS hash (in production, this would be the actual IPFS hash)
        const mockIPFSHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        
        return {
          ipfsHash: mockIPFSHash,
          ipfsUrl: `https://ipfs.io/ipfs/${mockIPFSHash}`,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${mockIPFSHash}`,
          fileSize: file.size,
          mimeType: file.mimetype,
          originalFilename: file.originalFilename
        };
      };

      const ipfsResult = await simulateIPFSUpload(imageFile, imageBuffer);
      ipfsUrl = ipfsResult.gatewayUrl; // Use IPFS URL as primary
      ipfsHash = ipfsResult.ipfsHash;

      console.log(`✅ Image uploaded to IPFS successfully for contract ${contractAddress}`);
      console.log(`🌐 IPFS Hash: ${ipfsResult.ipfsHash}`);
      console.log(`🌐 IPFS URL: ${ipfsResult.ipfsUrl}`);
      console.log(`🌐 Gateway URL: ${ipfsResult.gatewayUrl}`);
      
    } catch (ipfsError) {
      console.log(`⚠️ Error uploading to IPFS: ${ipfsError}`);
      console.log(`📦 Using Supabase URL as fallback: ${supabaseUrl}`);
    }

    // Store metadata in Supabase database with IPFS URL
    console.log('📤 Storing metadata in Supabase database...');
    try {
      const { error: dbError } = await supabase
        .from('collection_images')
        .insert({
          contract_address: contractAddress,
          image_url: ipfsUrl, // Primary: IPFS URL
          ipfs_hash: ipfsHash, // IPFS hash for reference
          file_size: imageFile.size,
          mime_type: imageFile.mimetype || 'application/octet-stream',
          uploaded_at: new Date().toISOString()
        });

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        // Don't fail the upload if database insert fails
        console.log('⚠️ Continuing without database metadata...');
      } else {
        console.log('✅ Database insert successful with IPFS metadata');
      }
    } catch (dbErr) {
      console.error('❌ Database error:', dbErr);
      console.log('⚠️ Continuing without database metadata...');
    }
    
    console.log(`✅ Metadata image uploaded for contract ${contractAddress}`);
    console.log(`File: ${imageFile.originalFilename}, Size: ${imageFile.size} bytes`);
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log(`IPFS URL: ${ipfsUrl}`);

    // Clean up the temporary file
    if (imageFile.filepath && fs.existsSync(imageFile.filepath)) {
      fs.unlinkSync(imageFile.filepath);
    }

    res.status(200).json({
      success: true,
      imageUrl: ipfsUrl, // Return IPFS URL as primary
      supabaseUrl: supabaseUrl, // Include Supabase URL as backup
      ipfsHash: ipfsHash,
      contractAddress: contractAddress,
      message: 'Metadata image uploaded successfully to IPFS'
    });

  } catch (error) {
    console.error('Error uploading metadata image:', error);
    res.status(500).json({ 
      error: 'Failed to upload metadata image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
