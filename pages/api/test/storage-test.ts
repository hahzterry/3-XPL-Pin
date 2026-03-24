import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing Supabase storage setup...');

    // Test 0: Check environment variables
    console.log('0. Checking environment variables...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables');
      return res.status(500).json({ 
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      });
    }

    console.log('✅ Environment variables found');

    // Test 1: List buckets
    console.log('1. Testing bucket access...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Bucket access error:', bucketError);
      return res.status(500).json({ error: 'Bucket access failed', details: bucketError });
    }

    console.log('✅ Buckets found:', buckets?.map(b => b.name));

    // Check if nft-temp bucket exists
    const nftTempBucket = buckets?.find(b => b.name === 'nft-temp');
    if (!nftTempBucket) {
      console.error('❌ nft-temp bucket not found');
      console.log('Available buckets:', buckets?.map(b => b.name));
      
      // Continue with other tests even if bucket doesn't exist
      return res.status(200).json({
        success: false,
        message: 'nft-temp bucket not found, but Supabase connection works',
        results: {
          environmentVariables: { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey },
          buckets: buckets?.map(b => b.name),
          nftTempBucket: null,
          error: 'nft-temp bucket not found. Please create it in Supabase dashboard.'
        }
      });
    }

    console.log('✅ nft-temp bucket found:', nftTempBucket);

    // Test 2: Upload a test file
    console.log('2. Testing file upload...');
    const testData = new Blob(['Hello from Gen-Plasma NFT test!'], { type: 'text/plain' });
    const fileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nft-temp')
      .upload(fileName, testData);

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return res.status(500).json({ error: 'Upload failed', details: uploadError });
    }

    console.log('✅ File uploaded:', uploadData);

    // Test 3: Get public URL
    console.log('3. Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('nft-temp')
      .getPublicUrl(fileName);

    console.log('✅ Public URL generated:', urlData.publicUrl);

    // Test 4: List files in bucket
    console.log('4. Testing file listing...');
    const { data: files, error: listError } = await supabase.storage
      .from('nft-temp')
      .list('', { limit: 10 });

    if (listError) {
      console.error('❌ List error:', listError);
      return res.status(500).json({ error: 'List failed', details: listError });
    }

    console.log('✅ Files in bucket:', files?.map(f => f.name));

    // Test 5: Download the test file
    console.log('5. Testing file download...');
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('nft-temp')
      .download(fileName);

    if (downloadError) {
      console.error('❌ Download error:', downloadError);
      return res.status(500).json({ error: 'Download failed', details: downloadError });
    }

    const downloadText = await downloadData.text();
    console.log('✅ File downloaded:', downloadText);

    // Test 6: Clean up test file
    console.log('6. Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('nft-temp')
      .remove([fileName]);

    if (deleteError) {
      console.error('⚠️ Cleanup error:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }

    // All tests passed!
    res.status(200).json({
      success: true,
      message: 'All storage tests passed!',
      results: {
        buckets: buckets?.map(b => b.name),
        nftTempBucket: nftTempBucket,
        uploadedFile: uploadData,
        publicUrl: urlData.publicUrl,
        filesInBucket: files?.map(f => f.name),
        downloadedContent: downloadText,
        cleanupSuccess: !deleteError
      }
    });

  } catch (error: any) {
    console.error('❌ Storage test error:', error);
    res.status(500).json({ 
      error: 'Storage test failed', 
      details: error.message 
    });
  }
}
