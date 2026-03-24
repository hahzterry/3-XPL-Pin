import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { createPublicClient, http } from 'viem';

// Create a public client for the Plasma network
const publicClient = createPublicClient({
  chain: {
    id: 9745,
    name: 'Plasma',
    network: 'plasma',
    nativeCurrency: { decimals: 18, name: 'Plasma', symbol: 'XPL' },
    rpcUrls: {
      public: { http: ['https://rpc.plasma.to'] },
      default: { http: ['https://rpc.plasma.to'] },
    },
  },
  transport: http('https://rpc.plasma.to'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, ownerAddress, tokenIds, limit } = req.query;

    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    // If specific token IDs are provided, just fetch those
    if (tokenIds) {
      const tokenIdArray = (tokenIds as string).split(',').map(id => parseInt(id));
      const maxLimit = Math.min(tokenIdArray.length, 100);
      
      console.log(`🔍 Fetching specific token IDs: ${tokenIdArray.slice(0, maxLimit)}`);

      // Try to fetch from artwork tables
      const tables = ['basic_artwork', 'pro_artwork', 'editions_artwork'];
      let nfts: any[] = [];

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('contract_address', (contractAddress as string).toLowerCase())
            .in('token_id', tokenIdArray.slice(0, maxLimit));

          if (!error && data && data.length > 0) {
            console.log(`✅ Found ${data.length} NFTs in ${table}`);
            nfts = data;
            break;
          }
        } catch (error) {
          console.log(`Skipping ${table}`);
        }
      }

      return res.status(200).json({
        success: true,
        nfts: nfts,
        count: nfts.length
      });
    }

    // If no specific token IDs, return empty (ownership must be verified separately)
    return res.status(200).json({
      success: true,
      nfts: [],
      message: 'Please provide token IDs to fetch'
    });

  } catch (error) {
    console.error('❌ Error fetching NFTs:', error);
    res.status(500).json({
      error: 'Failed to fetch NFTs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

