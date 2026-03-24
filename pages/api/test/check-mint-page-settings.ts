import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress } = req.query;

    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    console.log(`🔍 Checking mint page settings for contract: ${contractAddress}`);

    // First, check if the table exists and what columns it has
    const { data: tableInfo, error: tableError } = await supabase
      .from('mint_page_settings')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Table check error:', tableError);
      return res.status(500).json({ 
        error: 'Table check failed', 
        details: tableError.message 
      });
    }

    // Check if social links columns exist by trying to select them
    const { data: settings, error: settingsError } = await supabase
      .from('mint_page_settings')
      .select('contract_address, page_description, page_background, website_url, x_profile_url, created_at, updated_at')
      .eq('contract_address', (contractAddress as string).toLowerCase())
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Settings query error:', settingsError);
      return res.status(500).json({ 
        error: 'Settings query failed', 
        details: settingsError.message 
      });
    }

    // Test inserting/updating with social links
    const testData = {
      contract_address: (contractAddress as string).toLowerCase(),
      page_description: 'Test description',
      page_background: 'gradient-purple-blue',
      website_url: 'https://example.com',
      x_profile_url: 'https://x.com/example',
      updated_at: new Date().toISOString()
    };

    const { data: upsertResult, error: upsertError } = await supabase
      .from('mint_page_settings')
      .upsert(testData, { onConflict: 'contract_address' })
      .select();

    if (upsertError) {
      console.error('Upsert test error:', upsertError);
      return res.status(500).json({ 
        error: 'Upsert test failed', 
        details: upsertError.message 
      });
    }

    // Now fetch the updated data
    const { data: updatedSettings, error: fetchError } = await supabase
      .from('mint_page_settings')
      .select('*')
      .eq('contract_address', (contractAddress as string).toLowerCase())
      .single();

    res.status(200).json({
      success: true,
      tableExists: true,
      columnsExist: true,
      testUpsert: upsertResult,
      currentSettings: updatedSettings,
      message: 'Social links columns are working correctly'
    });

  } catch (error) {
    console.error('❌ Error checking mint page settings:', error);
    res.status(500).json({
      error: 'Failed to check mint page settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}