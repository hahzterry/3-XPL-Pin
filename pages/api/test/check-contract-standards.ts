import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http } from 'viem';

// Define Plasma Mainnet chain
const plasmaMainnet = {
  id: 9745,
  name: 'Plasma Mainnet',
  network: 'plasma',
  nativeCurrency: {
    decimals: 18,
    name: 'Plasma',
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
} as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress } = req.body;

    if (!contractAddress) {
      return res.status(400).json({ error: 'Missing contractAddress' });
    }

    // Create public client
    const publicClient = createPublicClient({
      chain: plasmaMainnet,
      transport: http(),
    });

    // Check various token standard functions
    const checks = {
      name: null as any,
      symbol: null as any,
      totalSupply: null as any,
      balanceOf: null as any,
      ownerOf: null as any,
      tokenURI: null as any,
      supportsInterface: null as any,
    };

    // Test name() function
    try {
      checks.name = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "name",
          "outputs": [{"internalType": "string", "name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'name',
      });
    } catch (error) {
      checks.name = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test symbol() function
    try {
      checks.symbol = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "symbol",
          "outputs": [{"internalType": "string", "name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'symbol',
      });
    } catch (error) {
      checks.symbol = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test totalSupply() function
    try {
      checks.totalSupply = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "totalSupply",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'totalSupply',
      });
    } catch (error) {
      checks.totalSupply = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test balanceOf() function
    try {
      checks.balanceOf = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'balanceOf',
        args: ['0x0aB705B9734CB776A8F5b18c9036c14C6828933F' as `0x${string}`],
      });
    } catch (error) {
      checks.balanceOf = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test ownerOf() function
    try {
      checks.ownerOf = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
          "name": "ownerOf",
          "outputs": [{"internalType": "address", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'ownerOf',
        args: [BigInt(1)],
      });
    } catch (error) {
      checks.ownerOf = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test tokenURI() function
    try {
      checks.tokenURI = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
          "name": "tokenURI",
          "outputs": [{"internalType": "string", "name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'tokenURI',
        args: [BigInt(1)],
      });
    } catch (error) {
      checks.tokenURI = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test supportsInterface() function (ERC-165)
    try {
      checks.supportsInterface = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}],
          "name": "supportsInterface",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'supportsInterface',
        args: ['0x80ac58cd'], // ERC-721 interface ID
      });
    } catch (error) {
      checks.supportsInterface = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    console.log('🔍 Contract standards check:', {
      contractAddress,
      checks
    });

    // Convert BigInt values to strings for JSON serialization
    const serializedChecks = {
      name: checks.name,
      symbol: checks.symbol,
      totalSupply: typeof checks.totalSupply === 'bigint' ? checks.totalSupply.toString() : checks.totalSupply,
      balanceOf: typeof checks.balanceOf === 'bigint' ? checks.balanceOf.toString() : checks.balanceOf,
      ownerOf: checks.ownerOf,
      tokenURI: checks.tokenURI,
      supportsInterface: checks.supportsInterface
    };

    return res.status(200).json({
      success: true,
      contractAddress,
      checks: serializedChecks,
      analysis: {
        hasName: typeof checks.name === 'string',
        hasSymbol: typeof checks.symbol === 'string',
        hasTotalSupply: typeof checks.totalSupply === 'bigint',
        hasBalanceOf: typeof checks.balanceOf === 'bigint',
        hasOwnerOf: typeof checks.ownerOf === 'string',
        hasTokenURI: typeof checks.tokenURI === 'string',
        supportsERC721: checks.supportsInterface === true,
        isERC721: typeof checks.name === 'string' && typeof checks.symbol === 'string' && typeof checks.totalSupply === 'bigint'
      }
    });

  } catch (error) {
    console.error('Contract standards check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
