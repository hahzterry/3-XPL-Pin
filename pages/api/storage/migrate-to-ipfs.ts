import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface MigrateRequest {
  contractAddress: string;
  contractType: 'basic' | 'pro' | 'editions';
  tempUploadIds?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, contractType, tempUploadIds }: MigrateRequest = req.body;

    if (!contractAddress || !contractType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Migrating temporary uploads to IPFS for contract ${contractAddress}`);

    // Get temporary uploads for this contract
    const { data: tempUploads, error: fetchError } = await supabase
      .from('temp_uploads')
      .select('*')
      .eq('contract_address', contractAddress)
      .in('id', tempUploadIds || []);

    if (fetchError) {
      console.error('Error fetching temp uploads:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch temporary uploads' });
    }

    if (!tempUploads || tempUploads.length === 0) {
      return res.status(404).json({ error: 'No temporary uploads found' });
    }

    const ipfsResults = [];

    // Migrate each temporary upload to IPFS
    for (const tempUpload of tempUploads) {
      try {
        console.log(`Migrating ${tempUpload.original_filename} to IPFS`);

        // Download from Supabase temporary storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('nft-temp')
          .download(tempUpload.filename);

        if (downloadError) {
          console.error('Error downloading from temp storage:', downloadError);
          continue;
        }

        // Convert to buffer
        const buffer = Buffer.from(await fileData.arrayBuffer());

        // Upload to IPFS
        const ipfsResponse = await fetch('/api/ipfs/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress,
            imageData: buffer.toString('base64'),
            mimeType: tempUpload.mime_type,
            filename: tempUpload.original_filename
          })
        });

        if (!ipfsResponse.ok) {
          console.error('IPFS upload failed for:', tempUpload.original_filename);
          continue;
        }

        const ipfsResult = await ipfsResponse.json();
        
        // Store IPFS result in database
        await supabase
          .from('ipfs_uploads')
          .insert({
            contract_address: contractAddress,
            original_filename: tempUpload.original_filename,
            ipfs_hash: ipfsResult.ipfsHash,
            ipfs_url: ipfsResult.ipfsUrl,
            gateway_url: ipfsResult.gatewayUrl,
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
          ipfsHash: ipfsResult.ipfsHash,
          ipfsUrl: ipfsResult.ipfsUrl,
          gatewayUrl: ipfsResult.gatewayUrl
        });

        console.log(`✅ Successfully migrated ${tempUpload.original_filename} to IPFS`);

      } catch (migrationError) {
        console.error('Error migrating to IPFS:', migrationError);
        continue;
      }
    }

    res.status(200).json({
      success: true,
      contractAddress,
      contractType,
      migratedCount: ipfsResults.length,
      ipfsResults
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message 
    });
  }
}
