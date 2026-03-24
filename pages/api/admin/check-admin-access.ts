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

    // Check if user is the contract owner
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

      const isOwner = owner.toLowerCase() === userAddress.toLowerCase();
      
      // Check if the contract was deployed by the old payment system wallet
      // If so, grant admin access to the current user (they're the same person)
      const oldPaymentSystemWallet = '0x36d7885524c591eda18Cf678b49a09772E89dB5c';
      const isDeployer = owner.toLowerCase() === oldPaymentSystemWallet.toLowerCase();
      
      console.log('🔍 Admin access check:', {
        contractAddress,
        userAddress,
        contractOwner: owner,
        isOwner,
        isDeployer,
        oldPaymentSystemWallet
      });

      return res.status(200).json({
        success: true,
        hasAdminAccess: isOwner || isDeployer,
        isOwner,
        isDeployer,
        contractOwner: owner,
        userAddress
      });

    } catch (error) {
      console.error('Error checking contract owner:', error);
      return res.status(500).json({ 
        error: 'Failed to check contract owner',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Admin access check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
