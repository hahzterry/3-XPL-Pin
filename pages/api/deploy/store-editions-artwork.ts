import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, artworkName, artworkDescription, artworkImage, artistName, attributes } = req.body;

    if (!contractAddress || !artworkName || !artworkDescription || !artworkImage || !artistName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🎨 Storing Editions artwork data:', {
      contractAddress,
      artworkName,
      artworkDescription,
      artworkImage,
      artistName,
      attributes: attributes || []
    });

    console.log('🎨 Storing Editions artwork data for contract:', contractAddress);

    const { supabase } = await import('@/lib/supabase');

    // Store the artwork data in the editions_artwork table
    const { data, error } = await supabase
      .from('editions_artwork')
      .upsert({
        contract_address: contractAddress.toLowerCase(),
        artwork_name: artworkName,
        artwork_description: artworkDescription,
        artwork_image: artworkImage,
        artist_name: artistName,
        attributes: attributes || [], // Store custom traits
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'contract_address'
      });

    if (error) {
      console.error('❌ Error storing Editions artwork:', error);
      return res.status(500).json({ 
        error: 'Failed to store artwork data',
        details: error.message
      });
    }

    console.log('✅ Editions artwork data stored successfully');

    res.status(200).json({
      success: true,
      message: 'Editions artwork data stored successfully',
      contractAddress: contractAddress.toLowerCase(),
      artworkName,
      artworkDescription,
      artworkImage,
      artistName
    });

  } catch (error: any) {
    console.error('Store Editions artwork error:', error);
    res.status(500).json({
      error: 'Failed to store artwork data',
      details: error.message
    });
  }
}
