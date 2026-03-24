import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, background } = req.body;

    if (!contractAddress || !background) {
      return res.status(400).json({ error: 'Contract address and background are required' });
    }

    console.log(`🎨 Updating page background for contract: ${contractAddress}`);

    // Check if mint page settings already exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('mint_page_settings')
      .select('*')
      .eq('contract_address', contractAddress.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing settings:', checkError);
      return res.status(500).json({ error: 'Failed to check existing settings' });
    }

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('mint_page_settings')
        .update({
          page_background: background,
          updated_at: new Date().toISOString()
        })
        .eq('contract_address', contractAddress.toLowerCase());

      if (updateError) {
        console.error('Error updating page background:', updateError);
        return res.status(500).json({ error: 'Failed to update page background' });
      }

      console.log('✅ Page background updated successfully');
    } else {
      // Create new settings
      const { error: insertError } = await supabase
        .from('mint_page_settings')
        .insert({
          contract_address: contractAddress.toLowerCase(),
          page_description: '',
          page_background: background,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating page settings:', insertError);
        return res.status(500).json({ error: 'Failed to create page settings' });
      }

      console.log('✅ Page background created successfully');
    }

    res.status(200).json({
      success: true,
      message: 'Page background updated successfully',
      contractAddress,
      background
    });

  } catch (error) {
    console.error('❌ Error updating page background:', error);
    res.status(500).json({
      error: 'Failed to update page background',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
