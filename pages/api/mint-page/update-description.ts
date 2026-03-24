import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, description } = req.body;

    if (!contractAddress || !description) {
      return res.status(400).json({ error: 'Contract address and description are required' });
    }

    console.log(`🔧 Updating page description for contract: ${contractAddress}`);

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
          page_description: description,
          updated_at: new Date().toISOString()
        })
        .eq('contract_address', contractAddress.toLowerCase());

      if (updateError) {
        console.error('Error updating page description:', updateError);
        return res.status(500).json({ error: 'Failed to update page description' });
      }

      console.log('✅ Page description updated successfully');
    } else {
      // Create new settings
      const { error: insertError } = await supabase
        .from('mint_page_settings')
        .insert({
          contract_address: contractAddress.toLowerCase(),
          page_description: description,
          page_background: 'gradient-purple-blue',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating page settings:', insertError);
        return res.status(500).json({ error: 'Failed to create page settings' });
      }

      console.log('✅ Page description created successfully');
    }

    res.status(200).json({
      success: true,
      message: 'Page description updated successfully',
      contractAddress,
      description
    });

  } catch (error) {
    console.error('❌ Error updating page description:', error);
    res.status(500).json({
      error: 'Failed to update page description',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
