import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Creating database tables for Basic and Pro contracts...');

    // Create basic_artwork table
    const createBasicTableSQL = `
      -- Create basic_artwork table for Basic contract NFT items
      CREATE TABLE IF NOT EXISTS basic_artwork (
          id SERIAL PRIMARY KEY,
          contract_address TEXT NOT NULL,
          token_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          ipfs_hash TEXT,
          attributes JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Ensure unique combination of contract and token_id
          UNIQUE(contract_address, token_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_basic_artwork_contract ON basic_artwork (contract_address);
      CREATE INDEX IF NOT EXISTS idx_basic_artwork_token_id ON basic_artwork (token_id);
      CREATE INDEX IF NOT EXISTS idx_basic_artwork_contract_token ON basic_artwork (contract_address, token_id);

      -- Disable RLS (Row Level Security) to match editions_artwork table setup
      ALTER TABLE basic_artwork DISABLE ROW LEVEL SECURITY;
    `;

    // Create pro_artwork table
    const createProTableSQL = `
      -- Create pro_artwork table for Pro contract NFT items
      CREATE TABLE IF NOT EXISTS pro_artwork (
          id SERIAL PRIMARY KEY,
          contract_address TEXT NOT NULL,
          token_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          ipfs_hash TEXT,
          attributes JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Ensure unique combination of contract and token_id
          UNIQUE(contract_address, token_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_pro_artwork_contract ON pro_artwork (contract_address);
      CREATE INDEX IF NOT EXISTS idx_pro_artwork_token_id ON pro_artwork (token_id);
      CREATE INDEX IF NOT EXISTS idx_pro_artwork_contract_token ON pro_artwork (contract_address, token_id);

      -- Disable RLS (Row Level Security) to match editions_artwork table setup
      ALTER TABLE pro_artwork DISABLE ROW LEVEL SECURITY;
    `;

    // Execute the SQL commands
    console.log('📝 Creating basic_artwork table...');
    const { error: basicError } = await supabase.rpc('exec_sql', {
      sql_query: createBasicTableSQL
    });

    if (basicError) {
      console.error('❌ Error creating basic_artwork table:', basicError);
      return res.status(500).json({
        error: 'Failed to create basic_artwork table',
        details: basicError.message
      });
    }

    console.log('📝 Creating pro_artwork table...');
    const { error: proError } = await supabase.rpc('exec_sql', {
      sql_query: createProTableSQL
    });

    if (proError) {
      console.error('❌ Error creating pro_artwork table:', proError);
      return res.status(500).json({
        error: 'Failed to create pro_artwork table',
        details: proError.message
      });
    }

    console.log('✅ Database tables created successfully!');

    res.status(200).json({
      success: true,
      message: 'Database tables created successfully',
      tablesCreated: ['basic_artwork', 'pro_artwork'],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error creating database tables:', error);
    res.status(500).json({
      error: 'Failed to create database tables',
      details: error.message
    });
  }
}
