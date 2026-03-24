// Test script to verify Supabase storage is working
// Run this in your browser console or as a Node.js script

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Test 1: List buckets
async function testBuckets() {
  const { data, error } = await supabase.storage.listBuckets()
  console.log('Buckets:', data)
  console.log('Error:', error)
}

// Test 2: Upload a test file
async function testUpload() {
  const testData = new Blob(['Hello World'], { type: 'text/plain' })
  const fileName = `test-${Date.now()}.txt`
  
  const { data, error } = await supabase.storage
    .from('nft-temp')
    .upload(fileName, testData)
  
  console.log('Upload result:', data)
  console.log('Upload error:', error)
  
  if (data) {
    // Test 3: Get public URL
    const { data: urlData } = supabase.storage
      .from('nft-temp')
      .getPublicUrl(fileName)
    
    console.log('Public URL:', urlData.publicUrl)
  }
}

// Run tests
testBuckets().then(() => testUpload())
