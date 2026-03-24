import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Fixing editions_artwork table structure...');

    const { supabase } = await import('@/lib/supabase');

    // Add missing columns if they don't exist
    const alterTableSQL = `
      -- Add updated_at column if it doesn't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'editions_artwork' AND column_name = 'updated_at') THEN
          ALTER TABLE editions_artwork ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
      END $$;

      -- Add created_at column if it doesn't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'editions_artwork' AND column_name = 'created_at') THEN
          ALTER TABLE editions_artwork ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
      END $$;

      -- Add id column if it doesn't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'editions_artwork' AND column_name = 'id') THEN
          ALTER TABLE editions_artwork ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        END IF;
      END $$;

      -- Create index if it doesn't exist
      CREATE INDEX IF NOT EXISTS idx_editions_artwork_contract_address ON editions_artwork(contract_address);

      -- Enable RLS
      ALTER TABLE editions_artwork ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies and recreate them
      DROP POLICY IF EXISTS "public can read editions_artwork" ON editions_artwork;
      DROP POLICY IF EXISTS "anon can insert editions_artwork" ON editions_artwork;
      DROP POLICY IF EXISTS "authenticated can insert editions_artwork" ON editions_artwork;
      DROP POLICY IF EXISTS "authenticated can update editions_artwork" ON editions_artwork;

      -- Create new policies
      CREATE POLICY "public can read editions_artwork" ON editions_artwork
        FOR SELECT TO anon, authenticated
        USING (true);

      CREATE POLICY "anon can insert editions_artwork" ON editions_artwork
        FOR INSERT TO anon
        WITH CHECK (true);

      CREATE POLICY "authenticated can insert editions_artwork" ON editions_artwork
        FOR INSERT TO authenticated
        WITH CHECK (true);

      CREATE POLICY "authenticated can update editions_artwork" ON editions_artwork
        FOR UPDATE TO authenticated
        USING (true)
        WITH CHECK (true);

      -- Create trigger function if it doesn't exist
      CREATE OR REPLACE FUNCTION update_editions_artwork_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger if it doesn't exist
      DROP TRIGGER IF EXISTS update_editions_artwork_updated_at_trigger ON editions_artwork;
      CREATE TRIGGER update_editions_artwork_updated_at_trigger
        BEFORE UPDATE ON editions_artwork
        FOR EACH ROW
        EXECUTE FUNCTION update_editions_artwork_updated_at();
    `;

    // Execute the SQL using a direct query (since RPC might not work)
    const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterTableSQL });
    
    if (alterError) {
      console.log('❌ Failed to alter table via RPC:', alterError.message);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to alter table structure',
        details: alterError.message,
        instructions: 'Please run the complete SQL script manually in Supabase SQL Editor. The table exists but has incomplete structure.'
      });
    }

    console.log('✅ Table structure fixed successfully');

    // Test the table by trying to insert a test record
    const { data: testData, error: testError } = await supabase
      .from('editions_artwork')
      .insert({
        contract_address: 'test-contract-address',
        artwork_name: 'Test Artwork',
        artwork_description: 'Test Description',
        artwork_image: 'https://example.com/test.jpg',
        artist_name: 'Test Artist'
      })
      .select();

    if (testError) {
      console.log('❌ Test insert failed:', testError.message);
      return res.status(500).json({
        success: false,
        error: 'Table structure fixed but test insert failed',
        details: testError.message
      });
    }

    // Clean up test record
    await supabase
      .from('editions_artwork')
      .delete()
      .eq('contract_address', 'test-contract-address');

    console.log('✅ Table is working correctly');

    res.status(200).json({
      success: true,
      message: 'editions_artwork table structure fixed successfully',
      tableWorking: true
    });

  } catch (error: any) {
    console.error('Fix editions_artwork table error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix table structure',
      details: error.message
    });
  }
}
