import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

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
    console.log('🧪 Simple upload test starting...');
    
    // Test 1: Check environment variables
    console.log('1. Testing environment variables...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables');
      return res.status(500).json({ 
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }
    console.log('✅ Environment variables OK');

    // Test 2: Test Supabase connection
    console.log('2. Testing Supabase connection...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Supabase connection failed:', bucketError);
      return res.status(500).json({ 
        error: 'Supabase connection failed', 
        details: bucketError 
      });
    }
    console.log('✅ Supabase connection OK, buckets:', buckets?.map(b => b.name));

    // Test 3: Check if nft-temp bucket exists
    console.log('3. Checking nft-temp bucket...');
    const nftTempBucket = buckets?.find(b => b.name === 'nft-temp');
    if (!nftTempBucket) {
      console.error('❌ nft-temp bucket not found');
      return res.status(500).json({ 
        error: 'nft-temp bucket not found',
        availableBuckets: buckets?.map(b => b.name)
      });
    }
    console.log('✅ nft-temp bucket found:', nftTempBucket);

    // Test 4: Test simple file upload
    console.log('4. Testing simple file upload...');
    const testData = Buffer.from('Hello World Test File');
    const testFilename = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nft-temp')
      .upload(testFilename, testData, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Simple upload failed:', uploadError);
      return res.status(500).json({ 
        error: 'Simple upload failed', 
        details: uploadError 
      });
    }
    console.log('✅ Simple upload successful:', uploadData);

    // Test 5: Get public URL
    console.log('5. Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('nft-temp')
      .getPublicUrl(testFilename);
    console.log('✅ Public URL generated:', urlData.publicUrl);

    // Test 6: Clean up test file
    console.log('6. Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('nft-temp')
      .remove([testFilename]);
    
    if (deleteError) {
      console.error('⚠️ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }

    // All tests passed
    res.status(200).json({
      success: true,
      message: 'All tests passed!',
      results: {
        environmentVariables: { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey },
        supabaseConnection: 'OK',
        buckets: buckets?.map(b => b.name),
        nftTempBucket: nftTempBucket,
        simpleUpload: 'OK',
        publicUrl: urlData.publicUrl,
        cleanup: deleteError ? 'Failed' : 'OK'
      }
    });

  } catch (error: any) {
    console.error('❌ Simple upload test error:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      details: error.message,
      stack: error.stack
    });
  }
}
