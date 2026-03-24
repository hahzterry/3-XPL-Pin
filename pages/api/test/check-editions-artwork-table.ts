import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Checking editions_artwork table status...');

    const { supabase } = await import('@/lib/supabase');

    // Try to query the editions_artwork table
    const { data, error } = await supabase
      .from('editions_artwork')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Table does not exist or has issues:', error.message);
      
      // Try to create the table
      console.log('🔧 Attempting to create editions_artwork table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS editions_artwork (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          contract_address TEXT NOT NULL UNIQUE,
          artwork_name TEXT NOT NULL,
          artwork_description TEXT NOT NULL,
          artwork_image TEXT NOT NULL,
          artist_name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_editions_artwork_contract_address ON editions_artwork(contract_address);
        
        ALTER TABLE editions_artwork ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "public can read editions_artwork" ON editions_artwork;
        CREATE POLICY "public can read editions_artwork" ON editions_artwork
          FOR SELECT TO anon, authenticated
          USING (true);
        
        DROP POLICY IF EXISTS "anon can insert editions_artwork" ON editions_artwork;
        CREATE POLICY "anon can insert editions_artwork" ON editions_artwork
          FOR INSERT TO anon
          WITH CHECK (true);
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.log('❌ Failed to create table via RPC:', createError.message);
        return res.status(500).json({
          success: false,
          error: 'Table does not exist and could not be created automatically',
          details: error.message,
          createError: createError.message,
          instructions: 'Please run the SQL script manually in Supabase SQL Editor'
        });
      } else {
        console.log('✅ Table created successfully via RPC');
        return res.status(200).json({
          success: true,
          message: 'editions_artwork table created successfully',
          tableExists: true
        });
      }
    } else {
      console.log('✅ editions_artwork table exists and is accessible');
      return res.status(200).json({
        success: true,
        message: 'editions_artwork table exists and is accessible',
        tableExists: true,
        recordCount: data?.length || 0
      });
    }

  } catch (error: any) {
    console.error('Check editions_artwork table error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check editions_artwork table',
      details: error.message
    });
  }
}
