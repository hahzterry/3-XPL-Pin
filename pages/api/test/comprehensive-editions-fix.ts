import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabase } = await import('@/lib/supabase');
    
    console.log('🔧 Running comprehensive Editions fix...');

    // Define all the records we need to create/update
    const records = [
      // Update existing plasma-gobs record to add attributes
      {
        contractAddress: 'plasma-gobs',
        artworkName: 'The Gob Punk',
        artworkDescription: 'A unique digital artwork featuring gob punk style',
        artistName: 'Merlini',
        artworkImage: 'https://picsum.photos/400/400?random=9289', // You can update this to IPFS later
        attributes: [
          { trait_type: 'Gob', value: 'Punk' },
          { trait_type: 'Style', value: 'Digital Art' }
        ]
      },
      // Create missing plasma-gobs-2 record
      {
        contractAddress: 'plasma-gobs-2',
        artworkName: 'The Gob Punk 2',
        artworkDescription: 'A unique digital artwork featuring gob punk style - Second Edition',
        artistName: 'Merlini',
        artworkImage: 'https://picsum.photos/400/400?random=9289', // You can update this to IPFS later
        attributes: [
          { trait_type: 'Gob', value: 'Punk' },
          { trait_type: 'Style', value: 'Digital Art' },
          { trait_type: 'Edition', value: '2' }
        ]
      },
      // Create records for actual contract addresses
      {
        contractAddress: '0x2930a64a90b47615834399828548c92bde2ca8bc',
        artworkName: 'The Gob Punk',
        artworkDescription: 'A unique digital artwork featuring gob punk style',
        artistName: 'Merlini',
        artworkImage: 'https://picsum.photos/400/400?random=9289', // You can update this to IPFS later
        attributes: [
          { trait_type: 'Gob', value: 'Punk' },
          { trait_type: 'Style', value: 'Digital Art' }
        ]
      },
      {
        contractAddress: '0xbee33a0d3564a19cef3e4027b076fb8b04a04b70',
        artworkName: 'The Gob Punk 2',
        artworkDescription: 'A unique digital artwork featuring gob punk style - Second Edition',
        artistName: 'Merlini',
        artworkImage: 'https://picsum.photos/400/400?random=9289', // You can update this to IPFS later
        attributes: [
          { trait_type: 'Gob', value: 'Punk' },
          { trait_type: 'Style', value: 'Digital Art' },
          { trait_type: 'Edition', value: '2' }
        ]
      }
    ];

    const results = [];

    for (const record of records) {
      console.log(`🔄 Processing ${record.contractAddress}...`);

      // Upsert the record
      const { data, error } = await supabase
        .from('editions_artwork')
        .upsert({
          contract_address: record.contractAddress,
          artwork_name: record.artworkName,
          artwork_description: record.artworkDescription,
          artwork_image: record.artworkImage,
          artist_name: record.artistName,
          attributes: record.attributes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'contract_address'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error processing ${record.contractAddress}:`, error);
        results.push({
          contractAddress: record.contractAddress,
          success: false,
          error: error.message
        });
      } else {
        console.log(`✅ Successfully processed ${record.contractAddress}`);
        results.push({
          contractAddress: record.contractAddress,
          success: true,
          data: {
            artwork_name: data.artwork_name,
            artist_name: data.artist_name,
            attributes_count: data.attributes?.length || 0
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Comprehensive Editions fix completed',
      results: results,
      summary: {
        total_processed: records.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error: any) {
    console.error('❌ Error in comprehensive-editions-fix:', error);
    res.status(500).json({
      error: 'Failed to run comprehensive fix',
      details: error.message
    });
  }
}
