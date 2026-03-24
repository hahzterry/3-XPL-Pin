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
    console.log('🔧 Updating contract name to Plasma Lilshid...');

    // Update the specific contract with correct name
    const { data, error } = await supabase
      .from('contracts')
      .update({
        name: 'Plasma Lilshid',
        symbol: 'LILSHID'
      })
      .eq('contract_address', '0xcb30486f9ec7fc30a6eaeae00c374a78acf7f5b3')
      .select()
      .single();

    if (error) {
      console.error('Error updating contract name:', error);
      return res.status(500).json({
        error: 'Failed to update contract name',
        details: error.message
      });
    }

    console.log('✅ Contract name updated successfully');

    res.status(200).json({
      success: true,
      message: 'Contract name updated to Plasma Lilshid',
      contract: data
    });

  } catch (error) {
    console.error('❌ Error updating contract name:', error);
    res.status(500).json({
      error: 'Failed to update contract name',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
