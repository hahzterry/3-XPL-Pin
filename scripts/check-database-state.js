// Check current database state
// Run with: node scripts/check-database-state.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking database state...');
    
    // Check if tables exist
    const tables = [
      'contracts',
      'collection_images', 
      'nft_items',
      'editions_artwork',
      'pro_features',
      'temp_uploads',
      'ipfs_uploads'
    ];
    
    console.log('\n📋 Checking tables:');
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists (${data.length} records)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // Check storage buckets
    console.log('\n📦 Checking storage buckets:');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Error listing buckets:', bucketError.message);
    } else {
      console.log(`✅ Buckets found: ${buckets.length}`);
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (public: ${bucket.public})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabaseState();
