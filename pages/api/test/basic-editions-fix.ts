import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabase } = await import('@/lib/supabase');
    
    console.log('🔧 Running basic Editions fix (without attributes)...');

    // Define the records we need to create/update (without attributes for now)
    const records = [
      // Update existing plasma-gobs record
      {
        contractAddress: 'plasma-gobs',
        artworkName: 'The Gob Punk',
        artworkDescription: 'A unique digital artwork featuring gob punk style',
        artistName: 'Merlini',
        artworkImage: 'https://picsum.photos/400/400?random=9289'
      },
      // Create missing plasma-gobs-2 record
      {
        contractAddress: 'plasma-gobs-2',
        artworkName: 'The Gob Punk 2',
        artworkDescription: 'A unique digital artwork featuring gob punk style - Second Edition',
        artistName: 'Merlini',
        artworkImage: 'https://picsum.photos/400/400?random=9289'
      },
      // Create records for actual contract addresses
      {
        contractAddress: '0x2930a64a90b47615834399828548c92bde2ca8bc',
        artworkName: 'The Gob Punk',
        artworkDescription: 'A unique digital artwork featuring gob punk style',
        artistName: 'Merlini',
        artworkImage: 'https://picsum.photos/400/400?random=9289'
      },
      {
        contractAddress: '0xbee33a0d3564a19cef3e4027b076fb8b04a04b70',
        artworkName: 'The Gob Punk 2',
        artworkDescription: 'A unique digital artwork featuring gob punk style - Second Edition',
        artistName: 'Merlini',
        artworkImage: 'https://picsum.photos/400/400?random=9289'
      }
    ];

    const results = [];

    for (const record of records) {
      console.log(`🔄 Processing ${record.contractAddress}...`);

      // Upsert the record (without attributes)
      const { data, error } = await supabase
        .from('editions_artwork')
        .upsert({
          contract_address: record.contractAddress,
          artwork_name: record.artworkName,
          artwork_description: record.artworkDescription,
          artwork_image: record.artworkImage,
          artist_name: record.artistName,
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
            artist_name: data.artist_name
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Basic Editions fix completed (attributes will be added after column migration)',
      results: results,
      summary: {
        total_processed: records.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      },
      next_steps: [
        '1. Add attributes column manually in Supabase Dashboard',
        '2. Run comprehensive fix to add attributes',
        '3. Test metadata APIs'
      ]
    });

  } catch (error: any) {
    console.error('❌ Error in basic-editions-fix:', error);
    res.status(500).json({
      error: 'Failed to run basic fix',
      details: error.message
    });
  }
}
