import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🪣 Creating nft-temp bucket...');

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return res.status(500).json({ error: 'Failed to list buckets', details: listError });
    }

    const existingBucket = buckets?.find(b => b.name === 'nft-temp');
    if (existingBucket) {
      console.log('✅ nft-temp bucket already exists');
      return res.status(200).json({
        success: true,
        message: 'nft-temp bucket already exists',
        bucket: existingBucket
      });
    }

    // Create the bucket using SQL (since Supabase JS doesn't have createBucket method)
    const { data: createData, error: createError } = await supabase.rpc('create_storage_bucket', {
      bucket_name: 'nft-temp',
      is_public: true,
      file_size_limit: 52428800, // 50MB
      allowed_mime_types: null
    });

    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      
      // Try alternative method - direct SQL
      const { error: sqlError } = await supabase
        .from('storage.buckets')
        .insert({
          id: 'nft-temp',
          name: 'nft-temp',
          public: true,
          file_size_limit: 52428800,
          allowed_mime_types: null
        });

      if (sqlError) {
        console.error('❌ SQL insert error:', sqlError);
        return res.status(500).json({ 
          error: 'Failed to create bucket', 
          details: sqlError,
          suggestion: 'Please create the bucket manually in Supabase dashboard'
        });
      }
    }

    // Verify bucket was created
    const { data: newBuckets, error: verifyError } = await supabase.storage.listBuckets();
    
    if (verifyError) {
      console.error('❌ Error verifying bucket creation:', verifyError);
      return res.status(500).json({ error: 'Failed to verify bucket creation', details: verifyError });
    }

    const newBucket = newBuckets?.find(b => b.name === 'nft-temp');
    if (!newBucket) {
      console.error('❌ Bucket not found after creation');
      return res.status(500).json({ 
        error: 'Bucket not found after creation',
        suggestion: 'Please create the bucket manually in Supabase dashboard'
      });
    }

    console.log('✅ nft-temp bucket created successfully');

    res.status(200).json({
      success: true,
      message: 'nft-temp bucket created successfully',
      bucket: newBucket
    });

  } catch (error: any) {
    console.error('❌ Bucket creation error:', error);
    res.status(500).json({ 
      error: 'Bucket creation failed', 
      details: error.message,
      suggestion: 'Please create the bucket manually in Supabase dashboard: Storage → Create bucket → nft-temp'
    });
  }
}
