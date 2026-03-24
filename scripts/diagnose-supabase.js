// Comprehensive Supabase Storage Diagnosis
// Run with: node scripts/diagnose-supabase.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Storage Diagnosis');
console.log('============================');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseStorage() {
  try {
    // 1. Test basic connection
    console.log('1️⃣ Testing basic connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth status:', user ? 'Connected' : 'Anonymous');
    if (authError) console.log('Auth error:', authError.message);
    
    // 2. List all buckets
    console.log('\n2️⃣ Listing all buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      console.log('Error details:', {
        message: listError.message,
        status: listError.status,
        statusText: listError.statusText
      });
      return;
    }
    
    console.log('✅ Buckets found:', buckets.length);
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public}, size limit: ${bucket.file_size_limit})`);
    });
    
    // 3. Check for nft-temp specifically
    console.log('\n3️⃣ Checking for nft-temp bucket...');
    const nftTempBucket = buckets.find(b => b.name === 'nft-temp');
    
    if (nftTempBucket) {
      console.log('✅ nft-temp bucket found!');
      console.log('Bucket details:', {
        name: nftTempBucket.name,
        public: nftTempBucket.public,
        file_size_limit: nftTempBucket.file_size_limit,
        allowed_mime_types: nftTempBucket.allowed_mime_types,
        created_at: nftTempBucket.created_at,
        updated_at: nftTempBucket.updated_at
      });
      
      // 4. Test file listing in nft-temp bucket
      console.log('\n4️⃣ Testing file listing in nft-temp bucket...');
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
      
      // 5. Test upload
      console.log('\n5️⃣ Testing file upload...');
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
        
        // 6. Test download
        console.log('\n6️⃣ Testing file download...');
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from('nft-temp')
          .download(testFileName);
        
        if (downloadError) {
          console.error('❌ Download test failed:', downloadError);
        } else {
          console.log('✅ Download test successful!');
          console.log('Downloaded content length:', downloadData.size);
        }
        
        // 7. Clean up test file
        console.log('\n7️⃣ Cleaning up test file...');
        const { error: deleteError } = await supabase.storage
          .from('nft-temp')
          .remove([testFileName]);
        
        if (deleteError) {
          console.error('❌ Cleanup failed:', deleteError);
        } else {
          console.log('✅ Test file cleaned up');
        }
      }
      
    } else {
      console.log('❌ nft-temp bucket not found!');
      console.log('\n📋 Troubleshooting steps:');
      console.log('1. Go to Supabase Dashboard → Storage');
      console.log('2. Check if bucket exists with exact name: nft-temp');
      console.log('3. If not, create it with:');
      console.log('   - Name: nft-temp');
      console.log('   - Public: enabled');
      console.log('   - File size limit: 50MB');
      console.log('4. Make sure you are in the correct project');
      console.log('5. Check bucket permissions and RLS policies');
    }
    
    // 8. Check RLS policies (if possible)
    console.log('\n8️⃣ Checking storage policies...');
    try {
      const { data: policies, error: policyError } = await supabase
        .from('storage.objects')
        .select('*')
        .limit(1);
      
      if (policyError) {
        console.log('⚠️ Could not check policies (this is normal for anon key)');
      } else {
        console.log('✅ Storage objects accessible');
      }
    } catch (error) {
      console.log('⚠️ Policy check not available with anon key');
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
}

// Run the diagnosis
diagnoseStorage();
