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

interface SubmitCollectionRequest {
  contractAddress: string;
  collectionName: string;
  creatorName: string;
  websiteUrl?: string;
  description: string;
  submitterAddress: string;
  symbol?: string;
  totalSupply?: number;
  mintPrice?: string;
  xProfile?: string;
  discord?: string;
}

// Standard ERC721 ABI for reading contract details
const erc721ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'maxSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'MAX_SUPPLY',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'mintPrice',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      contractAddress,
      collectionName,
      creatorName,
      websiteUrl,
      description,
      submitterAddress,
      symbol,
      totalSupply,
      mintPrice,
      xProfile,
      discord
    }: SubmitCollectionRequest = req.body;

    // Validate required fields
    if (!contractAddress || !collectionName || !creatorName || !description || !submitterAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate contract address format
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid contract address format' });
    }

    // Validate submitter address format
    if (!submitterAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Fetch contract details from blockchain if not provided
    let contractSymbol = symbol;
    let contractMaxSupply = totalSupply;
    let contractMintPrice = mintPrice;

    try {
      console.log(`🔍 Fetching contract details for ${contractAddress}...`);
      
      // Try to get symbol
      if (!contractSymbol) {
        try {
          const symbolResult = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: erc721ABI,
            functionName: 'symbol'
          });
          contractSymbol = symbolResult as string;
          console.log(`✅ Symbol: ${contractSymbol}`);
        } catch (err) {
          console.log('⚠️ Could not read symbol from contract');
        }
      }

      // Try to get max supply (try multiple common function names)
      if (!contractMaxSupply) {
        try {
          const maxSupplyResult = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: erc721ABI,
            functionName: 'maxSupply'
          });
          contractMaxSupply = Number(maxSupplyResult);
          console.log(`✅ Max Supply: ${contractMaxSupply}`);
        } catch (err) {
          try {
            const maxSupplyResult = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: erc721ABI,
              functionName: 'MAX_SUPPLY'
            });
            contractMaxSupply = Number(maxSupplyResult);
            console.log(`✅ MAX_SUPPLY: ${contractMaxSupply}`);
          } catch (err2) {
            console.log('⚠️ Could not read max supply from contract');
          }
        }
      }

      // Try to get mint price
      if (!contractMintPrice) {
        try {
          const mintPriceResult = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: erc721ABI,
            functionName: 'mintPrice'
          });
          // Convert from wei to XPL
          const priceInXPL = Number(mintPriceResult) / 1e18;
          contractMintPrice = priceInXPL.toString();
          console.log(`✅ Mint Price: ${contractMintPrice} XPL`);
        } catch (err) {
          console.log('⚠️ Could not read mint price from contract');
        }
      }
    } catch (error) {
      console.log('⚠️ Error fetching contract details:', error);
      // Continue anyway - we'll use defaults if needed
    }

    // Check if collection already submitted
    const { data: existing } = await supabase
      .from('collection_submissions')
      .select('id, status')
      .eq('contract_address', contractAddress.toLowerCase())
      .single();

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(400).json({ 
          error: 'This collection has already been submitted and is pending review' 
        });
      } else if (existing.status === 'approved') {
        return res.status(400).json({ 
          error: 'This collection has already been approved and verified' 
        });
      }
    }

    // Insert submission with fetched contract details
    const { data, error } = await supabase
      .from('collection_submissions')
      .insert({
        contract_address: contractAddress.toLowerCase(),
        collection_name: collectionName,
        creator_name: creatorName,
        website_url: websiteUrl || null,
        description: description,
        submitter_address: submitterAddress.toLowerCase(),
        symbol: contractSymbol || 'NFT',
        total_supply: contractMaxSupply || 1000,
        mint_price: contractMintPrice || '0',
        x_profile: xProfile || null,
        discord: discord || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting collection:', error);
      return res.status(500).json({ error: 'Failed to submit collection' });
    }

    res.status(200).json({
      success: true,
      submission: data,
      fetchedDetails: {
        symbol: contractSymbol,
        maxSupply: contractMaxSupply,
        mintPrice: contractMintPrice
      },
      message: 'Collection submitted successfully! You will be notified once it has been reviewed.'
    });
  } catch (error) {
    console.error('Submit collection error:', error);
    res.status(500).json({ 
      error: 'Failed to submit collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

