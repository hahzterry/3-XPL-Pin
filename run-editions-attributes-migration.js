// Simple script to run the Editions attributes migration
// This adds the attributes column to the editions_artwork table

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔄 Running Editions attributes migration...');
  
  try {
    // Add attributes column
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE editions_artwork 
        ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '[]'::jsonb;
      `
    });
    
    if (addColumnError) {
      console.error('❌ Error adding attributes column:', addColumnError);
      return;
    }
    
    console.log('✅ Added attributes column');
    
    // Create index
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_editions_artwork_attributes 
        ON editions_artwork USING GIN (attributes);
      `
    });
    
    if (indexError) {
      console.error('❌ Error creating index:', indexError);
      return;
    }
    
    console.log('✅ Created attributes index');
    
    // Update existing records
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE editions_artwork 
        SET attributes = '[]'::jsonb 
        WHERE attributes IS NULL;
      `
    });
    
    if (updateError) {
      console.error('❌ Error updating existing records:', updateError);
      return;
    }
    
    console.log('✅ Updated existing records');
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
