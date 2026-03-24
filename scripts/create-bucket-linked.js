// Script to create Supabase storage bucket using linked project
// Run with: node scripts/create-bucket-linked.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read project reference from .supabase/project-ref
const projectRefPath = path.join(__dirname, '..', '.supabase', 'project-ref');
let projectRef = 'vlecxgggeatruauimowl'; // fallback

try {
  if (fs.existsSync(projectRefPath)) {
    projectRef = fs.readFileSync(projectRefPath, 'utf8').trim();
    console.log(`📋 Using project reference: ${projectRef}`);
  }
} catch (error) {
  console.log(`⚠️ Could not read project ref, using fallback: ${projectRef}`);
}

const supabaseUrl = `https://${projectRef}.supabase.co`;
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
      
      // Test upload
      console.log('🧪 Testing bucket with a small file...');
      const testContent = 'Hello from linked project!';
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('nft-temp')
        .upload('test.txt', testContent);
      
      if (uploadError) {
        console.error('❌ Test upload failed:', uploadError);
      } else {
        console.log('✅ Test upload successful:', uploadData);
        
        // Clean up test file
        await supabase.storage.from('nft-temp').remove(['test.txt']);
        console.log('🧹 Test file cleaned up');
      }
      
      return;
    }
    
    console.log('🪣 Creating nft-temp bucket...');
    
    // Try to create bucket using the Management API approach
    // This requires the service role key, not the anon key
    console.log('⚠️ Bucket creation requires service role key or manual creation in dashboard');
    console.log('\n📋 Manual steps:');
    console.log('1. Go to Supabase Dashboard → Storage');
    console.log('2. Create bucket named: nft-temp');
    console.log('3. Make it public');
    console.log('4. Set file size limit to 50MB');
    console.log('5. Run this script again to test');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createBucket();
