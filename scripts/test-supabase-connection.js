// Test Supabase connection and bucket access
// Run with: node scripts/test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n📦 Testing bucket listing...');
    
    // Test bucket listing
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    console.log('✅ Buckets found:', buckets.map(b => b.name));
    
    // Check for nft-temp bucket
    const nftTempBucket = buckets.find(b => b.name === 'nft-temp');
    
    if (nftTempBucket) {
      console.log('✅ nft-temp bucket exists!');
      console.log('Bucket details:', {
        name: nftTempBucket.name,
        public: nftTempBucket.public,
        file_size_limit: nftTempBucket.file_size_limit,
        allowed_mime_types: nftTempBucket.allowed_mime_types
      });
      
      // Test file listing in bucket
      console.log('\n📁 Testing file listing in nft-temp bucket...');
      const { data: files, error: filesError } = await supabase.storage
        .from('nft-temp')
        .list();
      
      if (filesError) {
        console.error('❌ Error listing files:', filesError);
      } else {
        console.log('✅ Files in bucket:', files.map(f => f.name));
      }
      
      // Test upload
      console.log('\n🧪 Testing file upload...');
      const testContent = 'Test file from connection test';
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('nft-temp')
        .upload('connection-test.txt', testContent);
      
      if (uploadError) {
        console.error('❌ Upload test failed:', uploadError);
      } else {
        console.log('✅ Upload test successful:', uploadData);
        
        // Clean up
        await supabase.storage.from('nft-temp').remove(['connection-test.txt']);
        console.log('🧹 Test file cleaned up');
      }
      
    } else {
      console.log('❌ nft-temp bucket not found!');
      console.log('Available buckets:', buckets.map(b => b.name));
      console.log('\n📋 To create the bucket:');
      console.log('1. Go to Supabase Dashboard → Storage');
      console.log('2. Create bucket named: nft-temp');
      console.log('3. Make it public');
      console.log('4. Set file size limit to 50MB');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

// Run the test
testConnection();
