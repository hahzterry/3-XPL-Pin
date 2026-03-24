import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Set a higher limit for large image uploads
    },
  },
};

interface PreDeploymentUploadRequest {
  contractType: 'basic' | 'pro' | 'editions';
  contractName: string;
  tempUploadIds: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 Pre-deployment IPFS API called with method:', req.method);
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Request headers:', req.headers);
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractType, contractName, tempUploadIds }: PreDeploymentUploadRequest = req.body;

    if (!contractType || !contractName || !tempUploadIds || tempUploadIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Uploading ${tempUploadIds.length} files to IPFS for pre-deployment: ${contractName}`);
    console.log('Temp upload IDs:', tempUploadIds);

    // First, let's check if the temp_uploads table exists and has any records
    console.log('🔍 Checking temp_uploads table...');
    const { data: allTempUploads, error: checkError } = await supabase
      .from('temp_uploads')
      .select('id, filename, uploaded_at')
      .limit(5);
      
    console.log('All temp uploads (first 5):', allTempUploads);
    console.log('Check error:', checkError);

    // Get temporary uploads
    console.log('🔍 Fetching specific temp uploads...');
    const { data: tempUploads, error: fetchError } = await supabase
      .from('temp_uploads')
      .select('*')
      .in('id', tempUploadIds);
      
    console.log('Fetched temp uploads:', tempUploads);
    console.log('Fetch error:', fetchError);

    if (fetchError) {
      console.error('❌ Error fetching temp uploads:', fetchError);
      return res.status(500).json({ 
        error: 'Failed to fetch temporary uploads', 
        details: fetchError.message,
        tempUploadIds: tempUploadIds,
        allTempUploads: allTempUploads
      });
    }

    if (!tempUploads || tempUploads.length === 0) {
      console.log('⚠️ No temp uploads found in database, trying fallback approach...');
      
      // Fallback: Try to get files directly from storage using common patterns
      const fallbackFilenames = tempUploadIds.map(id => `temp/${id}-*.webp`).concat(
        tempUploadIds.map(id => `temp/${id}-*.png`),
        tempUploadIds.map(id => `temp/${id}-*.jpg`)
      );
      
      console.log('🔍 Trying fallback filenames:', fallbackFilenames);
      
      // For now, return a more informative error
      return res.status(404).json({ 
        error: 'No temporary uploads found in database',
        tempUploadIds: tempUploadIds,
        allTempUploads: allTempUploads,
        suggestion: 'Check if temp_uploads table exists and has proper RLS policies'
      });
    }

    const ipfsResults = [];

    // Upload each temporary file to IPFS
    for (const tempUpload of tempUploads) {
      try {
        console.log(`Uploading ${tempUpload.original_filename} to IPFS`);

        // Download from Supabase temporary storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('nft-temp')
          .download(tempUpload.filename);

        if (downloadError) {
          console.error('Error downloading from Supabase:', downloadError);
          continue;
        }

        // Convert to buffer
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload directly to IPFS using Pinata API
        const formData = new FormData();
        const blob = new Blob([buffer], { type: tempUpload.mime_type });
        formData.append('file', blob, tempUpload.original_filename);

        const pinataMetadata = JSON.stringify({
          name: tempUpload.original_filename,
          keyvalues: {
            contractType: contractType,
            contractName: contractName
          }
        });
        formData.append('pinataMetadata', pinataMetadata);

        const pinataOptions = JSON.stringify({
          cidVersion: 0,
        });
        formData.append('pinataOptions', pinataOptions);

        const ipfsResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_JWT}`
          },
          body: formData
        });

        if (!ipfsResponse.ok) {
          const errorData = await ipfsResponse.json();
          console.error('IPFS upload failed:', errorData);
          continue;
        }

        const ipfsResult = await ipfsResponse.json();
        
        // Format the result to match expected structure
        const formattedResult = {
          ipfsHash: ipfsResult.IpfsHash,
          ipfsUrl: `https://ipfs.io/ipfs/${ipfsResult.IpfsHash}`,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsResult.IpfsHash}`
        };

        // Store in ipfs_uploads table (without contract_address for now)
        await supabase
          .from('ipfs_uploads')
          .insert({
            contract_address: null, // Will be updated after deployment
            original_filename: tempUpload.original_filename,
            ipfs_hash: formattedResult.ipfsHash,
            ipfs_url: formattedResult.ipfsUrl,
            gateway_url: formattedResult.gatewayUrl,
            file_size: tempUpload.file_size,
            mime_type: tempUpload.mime_type,
            uploaded_at: new Date().toISOString()
          });

        // Delete from temporary storage
        await supabase.storage
          .from('nft-temp')
          .remove([tempUpload.filename]);

        // Delete from temp_uploads table
        await supabase
          .from('temp_uploads')
          .delete()
          .eq('id', tempUpload.id);

        ipfsResults.push({
          originalFilename: tempUpload.original_filename,
          ipfsHash: formattedResult.ipfsHash,
          ipfsUrl: formattedResult.ipfsUrl,
          gatewayUrl: formattedResult.gatewayUrl
        });

        console.log(`✅ Successfully uploaded ${tempUpload.original_filename} to IPFS`);

      } catch (uploadError) {
        console.error('Error uploading to IPFS:', uploadError);
        continue;
      }
    }

    res.status(200).json({
      success: true,
      contractType,
      contractName,
      uploadedCount: ipfsResults.length,
      ipfsResults
    });

  } catch (error: any) {
    console.error('Pre-deployment IPFS upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload to IPFS',
      details: error.message 
    });
  }
}
