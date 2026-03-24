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
    const { contractAddress, userAddress } = req.body;

    if (!contractAddress || !userAddress) {
      return res.status(400).json({ error: 'Missing contractAddress or userAddress' });
    }

    // Create public client
    const publicClient = createPublicClient({
      chain: plasmaMainnet,
      transport: http(),
    });

    // Check contract owner
    try {
      const owner = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "owner",
          "outputs": [{"internalType": "address", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'owner',
      });

      const isUserOwner = owner.toLowerCase() === userAddress.toLowerCase();
      
      console.log('🔍 Contract owner check:', {
        contractAddress,
        userAddress,
        contractOwner: owner,
        isUserOwner,
        deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY ? 'Set' : 'Not set'
      });

      return res.status(200).json({
        success: true,
        contractAddress,
        userAddress,
        contractOwner: owner,
        isUserOwner,
        deployerKeyExists: !!process.env.DEPLOYER_PRIVATE_KEY
      });

    } catch (error) {
      console.error('Error checking contract owner:', error);
      return res.status(500).json({ 
        error: 'Failed to check contract owner',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Contract owner check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
