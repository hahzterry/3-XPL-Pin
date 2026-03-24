import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http, defineChain } from 'viem';

// Define Plasma Mainnet chain configuration
const plasmaMainnet = defineChain({
  id: 9745,
  name: 'Plasma Mainnet',
  network: 'plasma',
  nativeCurrency: {
    decimals: 18,
    name: 'XPL',
    symbol: 'XPL',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.plasma.to'],
    },
    public: {
      http: ['https://rpc.plasma.to'],
    },
  },
  blockExplorers: {
    default: { name: 'Plasmascan', url: 'https://plasmascan.to' },
  },
});

const publicClient = createPublicClient({
  chain: plasmaMainnet,
  transport: http('https://rpc.plasma.to')
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const contractAddress = '0xB10d640B74016ed2b8E1f59CA931467D16534D08';

  try {
    console.log(`🔍 Checking Gen-Plasma contract: ${contractAddress}`);

    // Check if contract exists by trying to read the code
    const code = await publicClient.getBytecode({
      address: contractAddress as `0x${string}`
    });

    if (!code || code === '0x') {
      return res.status(404).json({
        success: false,
        message: 'Contract does not exist at this address',
        contractAddress
      });
    }

    console.log('✅ Contract exists, checking functions...');

    // Try to read contract functions
    const results = await Promise.allSettled([
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "name",
          "outputs": [{"internalType": "string", "name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'name'
      }),
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "symbol",
          "outputs": [{"internalType": "string", "name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'symbol'
      }),
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "totalSupply",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'totalSupply'
      }),
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "MAX_SUPPLY",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'MAX_SUPPLY'
      }),
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "MINT_PRICE",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'MINT_PRICE'
      }),
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "mintingActive",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'mintingActive'
      })
    ]);

    const contractData = {
      name: results[0].status === 'fulfilled' ? results[0].value : 'ERROR',
      symbol: results[1].status === 'fulfilled' ? results[1].value : 'ERROR',
      totalSupply: results[2].status === 'fulfilled' ? results[2].value : 'ERROR',
      maxSupply: results[3].status === 'fulfilled' ? results[3].value : 'ERROR',
      mintPrice: results[4].status === 'fulfilled' ? results[4].value : 'ERROR',
      mintingActive: results[5].status === 'fulfilled' ? results[5].value : 'ERROR'
    };

    const errors = results.map((result, index) => {
      if (result.status === 'rejected') {
        return {
          function: ['name', 'symbol', 'totalSupply', 'MAX_SUPPLY', 'MINT_PRICE', 'mintingActive'][index],
          error: result.reason.message
        };
      }
      return null;
    }).filter(Boolean);

    console.log('📊 Contract data:', contractData);
    console.log('❌ Errors:', errors);

    res.status(200).json({
      success: true,
      message: 'Gen-Plasma contract check completed',
      contractAddress,
      contractData,
      errors,
      hasCode: !!code && code !== '0x'
    });

  } catch (error) {
    console.error('❌ Error checking Gen-Plasma contract:', error);
    res.status(500).json({
      error: 'Failed to check Gen-Plasma contract',
      details: error instanceof Error ? error.message : 'Unknown error',
      contractAddress
    });
  }
}
