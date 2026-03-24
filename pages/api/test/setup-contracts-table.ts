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
    console.log('🔧 Setting up contracts table with proper structure...');

    // First, let's try to drop and recreate the table with proper structure
    const createTableSQL = `
      -- Drop existing contracts table if it exists
      DROP TABLE IF EXISTS contracts CASCADE;
      
      -- Create contracts table with proper structure
      CREATE TABLE contracts (
        id SERIAL PRIMARY KEY,
        contract_address TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        contract_type TEXT NOT NULL CHECK (contract_type IN ('basic', 'pro', 'editions')),
        max_supply INTEGER DEFAULT 10000,
        mint_price DECIMAL(18, 6) DEFAULT 0.1,
        deployer TEXT NOT NULL,
        deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create indexes for better performance
      CREATE INDEX idx_contracts_address ON contracts (contract_address);
      CREATE INDEX idx_contracts_featured ON contracts (featured);
      CREATE INDEX idx_contracts_type ON contracts (contract_type);
      CREATE INDEX idx_contracts_deployed_at ON contracts (deployed_at);
      
      -- Add some sample data for testing
      INSERT INTO contracts (contract_address, name, symbol, contract_type, max_supply, mint_price, deployer, featured) VALUES
      ('0xB10d640B74016ed2b8E1f59CA931467D16534D08', 'Gen-Plasma Collection', 'GENPLASMA', 'basic', 10000, 0.1, '0x0000000000000000000000000000000000000000', true),
      ('0xcb30486f9ec7fc30a6eaeae00c374a78acf7f5b3', 'Test Collection', 'TEST', 'editions', 1000, 0.01, '0x36d7885524c591eda18Cf678b49a09772E89dB5c', false);
    `;

    // Try to execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL
    });

    if (error) {
      console.error('Error setting up contracts table:', error);
      
      // If exec_sql doesn't work, provide manual instructions
      return res.status(500).json({
        error: 'Could not execute SQL automatically',
        message: 'Please run this SQL manually in your Supabase dashboard',
        sql: createTableSQL,
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the SQL above',
          '4. Execute the SQL',
          '5. The contracts table will be properly set up'
        ]
      });
    }

    console.log('✅ Contracts table set up successfully');

    // Verify the table was created correctly
    const { data: verifyData, error: verifyError } = await supabase
      .from('contracts')
      .select('*')
      .limit(5);

    if (verifyError) {
      console.error('Error verifying table setup:', verifyError);
      return res.status(500).json({
        error: 'Table created but verification failed',
        details: verifyError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contracts table set up successfully',
      data: verifyData,
      tableInfo: {
        totalRecords: verifyData?.length || 0,
        columns: verifyData && verifyData.length > 0 ? Object.keys(verifyData[0]) : []
      }
    });

  } catch (error) {
    console.error('❌ Error setting up contracts table:', error);
    res.status(500).json({
      error: 'Failed to set up contracts table',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
