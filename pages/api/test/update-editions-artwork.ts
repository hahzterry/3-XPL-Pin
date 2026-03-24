import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabase } = await import('@/lib/supabase');
    const { oldKey, newKey, artworkName, artworkDescription, artistName, attributes } = req.body;

    if (!oldKey || !newKey) {
      return res.status(400).json({ error: 'Missing required fields: oldKey, newKey' });
    }

    console.log(`🔄 Updating Editions artwork record from "${oldKey}" to "${newKey}"`);

    // First, try to find the record with the old key
    const { data: existingRecord, error: findError } = await supabase
      .from('editions_artwork')
      .select('*')
      .eq('contract_address', oldKey)
      .single();

    if (findError || !existingRecord) {
      return res.status(404).json({ 
        error: `No record found with contract_address: ${oldKey}`,
        details: findError?.message 
      });
    }

    console.log('✅ Found existing record:', existingRecord);

    // Update the record with the new key and any provided data
    const updateData: any = {
      contract_address: newKey,
      updated_at: new Date().toISOString()
    };

    // Add optional fields if provided
    if (artworkName) updateData.artwork_name = artworkName;
    if (artworkDescription) updateData.artwork_description = artworkDescription;
    if (artistName) updateData.artist_name = artistName;
    if (attributes) updateData.attributes = attributes;

    const { data: updatedRecord, error: updateError } = await supabase
      .from('editions_artwork')
      .update(updateData)
      .eq('contract_address', oldKey)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating record:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update record',
        details: updateError.message 
      });
    }

    console.log('✅ Record updated successfully:', updatedRecord);

    res.status(200).json({
      success: true,
      message: 'Editions artwork record updated successfully',
      oldKey,
      newKey,
      updatedRecord
    });

  } catch (error: any) {
    console.error('❌ Error in update-editions-artwork:', error);
    res.status(500).json({
      error: 'Failed to update Editions artwork record',
      details: error.message
    });
  }
}
