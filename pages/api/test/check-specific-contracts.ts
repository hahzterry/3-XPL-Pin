import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabase } = await import('@/lib/supabase');
    
    console.log('🔍 Checking specific contract addresses...');

    const contractAddresses = [
      '0x2930a64a90b47615834399828548c92bde2ca8bc', // plasma-gobs
      '0xbee33a0d3564a19cef3e4027b076fb8b04a04b70', // plasma-gobs-2
      'plasma-gobs',
      'plasma-gobs-2'
    ];

    const results = [];

    for (const address of contractAddresses) {
      console.log(`🔍 Checking contract address: ${address}`);
      
      const { data, error } = await supabase
        .from('editions_artwork')
        .select('*')
        .eq('contract_address', address)
        .single();

      if (error) {
        console.log(`❌ No record found for ${address}:`, error.message);
        results.push({
          contractAddress: address,
          found: false,
          error: error.message
        });
      } else {
        console.log(`✅ Found record for ${address}:`, data);
        results.push({
          contractAddress: address,
          found: true,
          data: {
            artwork_name: data.artwork_name,
            artist_name: data.artist_name,
            artwork_description: data.artwork_description,
            artwork_image: data.artwork_image,
            attributes: data.attributes,
            created_at: data.created_at
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Contract address check completed',
      results: results
    });

  } catch (error: any) {
    console.error('❌ Error in check-specific-contracts:', error);
    res.status(500).json({
      error: 'Failed to check specific contracts',
      details: error.message
    });
  }
}
