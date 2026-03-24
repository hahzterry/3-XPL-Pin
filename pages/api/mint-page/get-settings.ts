import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress } = req.query;

    if (!contractAddress || typeof contractAddress !== 'string') {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    console.log(`🔍 Fetching mint page settings for contract: ${contractAddress}`);

    const { data: settings, error } = await supabase
      .from('mint_page_settings')
      .select('*')
      .eq('contract_address', contractAddress.toLowerCase())
      .single();

    if (error && error.code === 'PGRST116') {
      // No settings found, return defaults
      return res.status(200).json({
        success: true,
        settings: {
          contract_address: contractAddress.toLowerCase(),
          page_description: '',
          page_background: 'gradient-purple-blue',
          created_at: null,
          updated_at: null
        }
      });
    }

    if (error) {
      console.error('Error fetching mint page settings:', error);
      return res.status(500).json({ error: 'Failed to fetch mint page settings' });
    }

    console.log('✅ Mint page settings fetched successfully');

    res.status(200).json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('❌ Error fetching mint page settings:', error);
    res.status(500).json({
      error: 'Failed to fetch mint page settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
