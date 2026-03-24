// Test image upload to nft-temp bucket
// Run with: node scripts/test-image-upload.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageUpload() {
  try {
    console.log('🖼️ Testing image upload to nft-temp bucket...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x1D, 0x01, 0x02, 0x00, 0xFD, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Compressed data
      0xE2, 0x21, 0xBC, 0x33, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    const testFileName = `test-image-${Date.now()}.png`;
    
    console.log('📤 Uploading test image...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nft-temp')
      .upload(testFileName, testImageData, {
        contentType: 'image/png'
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
    } else {
      console.log('✅ Upload successful!');
      console.log('Upload result:', uploadData);
      
      // Test public URL
      const { data: urlData } = supabase.storage
        .from('nft-temp')
        .getPublicUrl(testFileName);
      
      console.log('🔗 Public URL:', urlData.publicUrl);
      
      // Clean up
      console.log('🧹 Cleaning up test file...');
      const { error: deleteError } = await supabase.storage
        .from('nft-temp')
        .remove([testFileName]);
      
      if (deleteError) {
        console.error('❌ Cleanup failed:', deleteError);
      } else {
        console.log('✅ Test file cleaned up');
      }
    }
    
    // List current files
    console.log('\n📁 Current files in bucket:');
    const { data: files, error: filesError } = await supabase.storage
      .from('nft-temp')
      .list();
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError);
    } else {
      console.log(`✅ Files in bucket: ${files.length}`);
      files.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'unknown size'} bytes)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImageUpload();
