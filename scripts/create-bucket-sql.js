// Create nft-temp bucket using SQL
// Run with: node scripts/create-bucket-sql.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucketWithSQL() {
  try {
    console.log('🪣 Creating nft-temp bucket using SQL...');
    
    // SQL to create the bucket
    const createBucketSQL = `
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('nft-temp', 'nft-temp', true, 52428800, NULL)
      ON CONFLICT (id) DO NOTHING;
    `;
    
    console.log('Executing SQL:', createBucketSQL);
    
    // Note: RPC calls require service role key, not anon key
    // This will fail with anon key, which is expected
    const { data, error } = await supabase.rpc('exec_sql', { sql: createBucketSQL });
    
    if (error) {
      console.error('❌ SQL execution failed:', error);
      console.log('\n📋 Alternative: Create bucket manually in Supabase Dashboard');
      console.log('1. Go to Supabase Dashboard → Storage');
      console.log('2. Create bucket named: nft-temp');
      console.log('3. Make it public');
      console.log('4. Set file size limit to 50MB');
      return;
    }
    
    console.log('✅ Bucket creation SQL executed successfully');
    
    // Verify bucket was created
    console.log('\n🔍 Verifying bucket creation...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
    } else {
      console.log('📦 Current buckets:', buckets.map(b => b.name));
      
      const nftTempBucket = buckets.find(b => b.name === 'nft-temp');
      if (nftTempBucket) {
        console.log('✅ nft-temp bucket created successfully!');
        console.log('Bucket details:', {
          name: nftTempBucket.name,
          public: nftTempBucket.public,
          file_size_limit: nftTempBucket.file_size_limit
        });
        
        // Test upload
        console.log('\n🧪 Testing bucket with upload...');
        const testContent = 'Test file from SQL creation';
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('nft-temp')
          .upload('sql-test.txt', testContent);
        
        if (uploadError) {
          console.error('❌ Upload test failed:', uploadError);
        } else {
          console.log('✅ Upload test successful!');
          
          // Clean up
          await supabase.storage.from('nft-temp').remove(['sql-test.txt']);
          console.log('🧹 Test file cleaned up');
        }
      } else {
        console.log('❌ nft-temp bucket not found after creation');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n📋 Manual creation required:');
    console.log('1. Go to Supabase Dashboard → Storage');
    console.log('2. Create bucket named: nft-temp');
    console.log('3. Make it public');
    console.log('4. Set file size limit to 50MB');
  }
}

createBucketWithSQL();
