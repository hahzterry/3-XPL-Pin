// Test direct bucket access without listing
// Run with: node scripts/test-bucket-direct.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectBucketAccess() {
  try {
    console.log('🔍 Testing direct bucket access...');
    
    // Test 1: List files in nft-temp bucket directly
    console.log('\n1️⃣ Testing file listing in nft-temp bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('nft-temp')
      .list();
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError);
    } else {
      console.log('✅ Files in bucket:', files.length);
      files.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'unknown size'})`);
      });
    }
    
    // Test 2: Try to access the known file
    console.log('\n2️⃣ Testing access to known file...');
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('nft-temp')
      .download('1000001036.png');
    
    if (downloadError) {
      console.error('❌ Error downloading file:', downloadError);
    } else {
      console.log('✅ File download successful!');
      console.log('File size:', downloadData.size, 'bytes');
    }
    
    // Test 3: Get public URL
    console.log('\n3️⃣ Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('nft-temp')
      .getPublicUrl('1000001036.png');
    
    console.log('✅ Public URL:', urlData.publicUrl);
    
    // Test 4: Try upload to verify write permissions
    console.log('\n4️⃣ Testing upload permissions...');
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nft-temp')
      .upload(testFileName, testContent);
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
    } else {
      console.log('✅ Upload test successful!');
      console.log('Upload result:', uploadData);
      
      // Clean up
      await supabase.storage.from('nft-temp').remove([testFileName]);
      console.log('🧹 Test file cleaned up');
    }
    
    // Test 5: Check bucket info via different method
    console.log('\n5️⃣ Testing bucket info...');
    try {
      const { data: bucketInfo, error: bucketError } = await supabase.storage.getBucket('nft-temp');
      
      if (bucketError) {
        console.error('❌ Error getting bucket info:', bucketError);
      } else {
        console.log('✅ Bucket info:', bucketInfo);
      }
    } catch (error) {
      console.log('⚠️ Bucket info not available:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectBucketAccess();
