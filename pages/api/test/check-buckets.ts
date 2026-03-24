import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Checking Supabase buckets...');
    
    // Test environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0
    });

    // List all buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
      return res.status(500).json({ 
        error: 'Failed to list buckets', 
        details: bucketError 
      });
    }

    console.log('✅ Buckets found:', buckets?.map(b => b.name));

    // Check if nft-temp exists
    const nftTempBucket = buckets?.find(b => b.name === 'nft-temp');
    
    // Try to create the bucket if it doesn't exist
    if (!nftTempBucket) {
      console.log('🪣 nft-temp bucket not found, attempting to create...');
      
      try {
        // Try to create the bucket using SQL
        const { error: createError } = await supabase.rpc('create_bucket', {
          bucket_name: 'nft-temp',
          is_public: true
        });

        if (createError) {
          console.log('❌ RPC create failed, trying direct SQL...');
          
          // Try direct SQL insert
          const { error: sqlError } = await supabase
            .from('storage.buckets')
            .insert({
              id: 'nft-temp',
              name: 'nft-temp',
              public: true,
              file_size_limit: 52428800, // 50MB
              allowed_mime_types: null
            });

          if (sqlError) {
            console.error('❌ SQL create failed:', sqlError);
            return res.status(500).json({
              error: 'Failed to create nft-temp bucket',
              details: sqlError,
              suggestion: 'Please create the bucket manually in Supabase dashboard'
            });
          }
        }

        console.log('✅ nft-temp bucket created successfully');
        
        // List buckets again to verify
        const { data: newBuckets } = await supabase.storage.listBuckets();
        console.log('✅ Updated buckets:', newBuckets?.map(b => b.name));

      } catch (createError: any) {
        console.error('❌ Bucket creation failed:', createError);
        return res.status(500).json({
          error: 'Failed to create nft-temp bucket',
          details: createError.message,
          suggestion: 'Please create the bucket manually in Supabase dashboard: Storage → Create bucket → nft-temp (public)'
        });
      }
    }

    // Final bucket list
    const { data: finalBuckets } = await supabase.storage.listBuckets();
    const finalNftTempBucket = finalBuckets?.find(b => b.name === 'nft-temp');

    res.status(200).json({
      success: true,
      message: nftTempBucket ? 'nft-temp bucket already exists' : 'nft-temp bucket created successfully',
      results: {
        environmentVariables: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        },
        initialBuckets: buckets?.map(b => b.name) || [],
        finalBuckets: finalBuckets?.map(b => b.name) || [],
        nftTempBucket: finalNftTempBucket,
        bucketCreated: !nftTempBucket && !!finalNftTempBucket
      }
    });

  } catch (error: any) {
    console.error('❌ Bucket check error:', error);
    res.status(500).json({ 
      error: 'Bucket check failed', 
      details: error.message 
    });
  }
}
