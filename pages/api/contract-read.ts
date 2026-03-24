import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';

// Create a public client for the Plasma network
const publicClient = createPublicClient({
  chain: {
    id: 9745,
    name: 'Plasma',
    network: 'plasma',
    nativeCurrency: {
      decimals: 18,
      name: 'Plasma',
      symbol: 'XPL',
    },
    rpcUrls: {
      public: { http: ['https://rpc.plasma.to'] },
      default: { http: ['https://rpc.plasma.to'] },
    },
    blockExplorers: {
      default: { name: 'PlasmaExplorer', url: 'https://plasmaexplorer.io' },
    },
  },
  transport: http('https://rpc.plasma.to'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { functionName, args, contractAddress } = req.body;

  if (!functionName) {
    return res.status(400).json({ error: 'Function name is required' });
  }

  try {
    // Use provided contract address or default to Gen-Plasma contract
    const targetAddress = contractAddress || CONTRACT_ADDRESS;
    
    // Convert numeric arguments to bigint for contract calls
    const processedArgs = args ? args.map((arg: any) => {
      if (typeof arg === 'number') {
        return BigInt(arg);
      }
      return arg;
    }) : [];

    // Standard ERC721 ABI for external contracts - properly typed
    const standardERC721ABI = [
      {
        "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "owner", "type": "address"},
          {"internalType": "uint256", "name": "index", "type": "uint256"}
        ],
        "name": "tokenOfOwnerByIndex",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "tokenURI",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      }
    ] as const;

    // Use standard ERC721 ABI for other contracts, full ABI for Gen-Plasma
    const abiToUse = contractAddress ? standardERC721ABI : CONTRACT_ABI;

    const result = await publicClient.readContract({
      address: targetAddress as `0x${string}`,
      abi: abiToUse as any, // Type assertion to avoid ABI union type issues
      functionName,
      args: processedArgs,
    }) as any; // Type assertion for result as well

    // Convert bigint results back to strings for JSON serialization
    const processedResult = typeof result === 'bigint' ? result.toString() : result;

    res.status(200).json({ result: processedResult });
  } catch (error) {
    console.error('Contract read error:', error);
    res.status(500).json({ error: 'Failed to read from contract' });
  }
}
