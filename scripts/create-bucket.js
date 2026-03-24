// Script to create Supabase storage bucket
// Run with: node scripts/create-bucket.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vlecxgggeatruauimowl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsZWN4Z2dnZWF0cnVhdWltb3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDE2NzcsImV4cCI6MjA3NTAxNzY3N30.DyspuTsZ6pyQpLY5bX6kQtIaFUi_7mzOvu_a08sqaAM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  try {
    console.log('🔍 Checking existing buckets...');
    
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    console.log('📦 Existing buckets:', buckets.map(b => b.name));
    
    // Check if nft-temp exists
    const nftTempBucket = buckets.find(b => b.name === 'nft-temp');
    
    if (nftTempBucket) {
      console.log('✅ nft-temp bucket already exists!');
      console.log('Bucket details:', nftTempBucket);
      return;
    }
    
    console.log('🪣 Creating nft-temp bucket...');
    
    // Try to create bucket using SQL
    const { data: createData, error: createError } = await supabase.rpc('create_bucket', {
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
        console.log('\n📋 Manual steps:');
        console.log('1. Go to Supabase Dashboard → Storage');
        console.log('2. Create bucket named: nft-temp');
        console.log('3. Make it public');
        console.log('4. Set file size limit to 50MB');
        return;
      }
    }
    
    console.log('✅ nft-temp bucket created successfully!');
    
    // Verify bucket was created
    const { data: newBuckets } = await supabase.storage.listBuckets();
    const newBucket = newBuckets.find(b => b.name === 'nft-temp');
    
    if (newBucket) {
      console.log('✅ Bucket verified:', newBucket);
    } else {
      console.log('⚠️ Bucket created but not found in list');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createBucket();
