import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabase } = await import('@/lib/supabase');
    
    console.log('🔧 Fixing contract mapping for plasma-gobs contracts...');

    // Create/update records for the actual contract addresses
    const contracts = [
      {
        urlSlug: 'plasma-gobs',
        contractAddress: '0x2930a64a90b47615834399828548c92bde2ca8bc',
        artworkName: 'The Gob Punk',
        artworkDescription: 'A unique digital artwork featuring gob punk style',
        artistName: 'Merlini',
        attributes: [
          { trait_type: 'Gob', value: 'Punk' },
          { trait_type: 'Style', value: 'Digital Art' }
        ]
      },
      {
        urlSlug: 'plasma-gobs-2',
        contractAddress: '0xbee33a0d3564a19cef3e4027b076fb8b04a04b70',
        artworkName: 'The Gob Punk 2',
        artworkDescription: 'A unique digital artwork featuring gob punk style - Second Edition',
        artistName: 'Merlini',
        attributes: [
          { trait_type: 'Gob', value: 'Punk' },
          { trait_type: 'Style', value: 'Digital Art' },
          { trait_type: 'Edition', value: '2' }
        ]
      }
    ];

    const results = [];

    for (const contract of contracts) {
      console.log(`🔄 Processing ${contract.urlSlug} -> ${contract.contractAddress}`);

      // Upsert the record with the actual contract address
      const { data, error } = await supabase
        .from('editions_artwork')
        .upsert({
          contract_address: contract.contractAddress,
          artwork_name: contract.artworkName,
          artwork_description: contract.artworkDescription,
          artwork_image: 'https://picsum.photos/400/400?random=9289', // Placeholder - you can update this later
          artist_name: contract.artistName,
          attributes: contract.attributes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'contract_address'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error processing ${contract.urlSlug}:`, error);
        results.push({
          urlSlug: contract.urlSlug,
          contractAddress: contract.contractAddress,
          success: false,
          error: error.message
        });
      } else {
        console.log(`✅ Successfully processed ${contract.urlSlug}`);
        results.push({
          urlSlug: contract.urlSlug,
          contractAddress: contract.contractAddress,
          success: true,
          data: data
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Contract mapping fix completed',
      results: results
    });

  } catch (error: any) {
    console.error('❌ Error in fix-contract-mapping:', error);
    res.status(500).json({
      error: 'Failed to fix contract mapping',
      details: error.message
    });
  }
}
