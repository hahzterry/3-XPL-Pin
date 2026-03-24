import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabase } = await import('@/lib/supabase');
    
    console.log('🔄 Running Editions attributes migration...');
    
    // Add attributes column
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE editions_artwork 
        ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '[]'::jsonb;
      `
    });
    
    if (addColumnError) {
      console.error('❌ Error adding attributes column:', addColumnError);
      return res.status(500).json({ 
        error: 'Failed to add attributes column',
        details: addColumnError.message 
      });
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
      return res.status(500).json({ 
        error: 'Failed to create index',
        details: indexError.message 
      });
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
      return res.status(500).json({ 
        error: 'Failed to update existing records',
        details: updateError.message 
      });
    }
    
    console.log('✅ Updated existing records');
    
    res.status(200).json({
      success: true,
      message: 'Editions attributes migration completed successfully!',
      steps: [
        'Added attributes column (JSONB)',
        'Created GIN index for attributes',
        'Updated existing records with empty attributes array'
      ]
    });
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}
