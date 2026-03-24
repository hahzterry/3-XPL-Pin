import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabase } = await import('@/lib/supabase');
    const { urlSlug, contractAddress, artworkName, artworkDescription, artistName, artworkImage } = req.body;

    if (!urlSlug || !contractAddress) {
      return res.status(400).json({ error: 'Missing required fields: urlSlug, contractAddress' });
    }

    console.log(`🔄 Adding contract mapping: ${urlSlug} -> ${contractAddress}`);

    // Create artwork record for the URL slug
    const { data, error } = await supabase
      .from('editions_artwork')
      .upsert({
        contract_address: urlSlug,
        artwork_name: artworkName || 'Untitled Artwork',
        artwork_description: artworkDescription || 'A unique digital artwork',
        artwork_image: artworkImage || 'https://picsum.photos/400/400?random=9289',
        artist_name: artistName || 'Unknown Artist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'contract_address'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating artwork record:', error);
      return res.status(500).json({ 
        error: 'Failed to create artwork record',
        details: error.message 
      });
    }

    console.log('✅ Artwork record created successfully:', data);

    res.status(200).json({
      success: true,
      message: 'Contract mapping added successfully',
      urlSlug,
      contractAddress,
      artworkRecord: data
    });

  } catch (error: any) {
    console.error('❌ Error in add-contract-mapping:', error);
    res.status(500).json({
      error: 'Failed to add contract mapping',
      details: error.message
    });
  }
}
