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

  try {
    const { address, contract } = req.query;

    if (!address || !contract) {
      return res.status(400).json({ error: 'Address and contract are required' });
    }

    console.log(`🔍 Checking NFT holder status for ${address} on contract ${contract}`);

    // ERC-721 balanceOf function
    const balance = await publicClient.readContract({
      address: contract as `0x${string}`,
      abi: [{
        "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }],
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });

    const isHolder = Number(balance) > 0;

    console.log(`✅ Balance check result: ${balance} tokens, isHolder: ${isHolder}`);

    res.status(200).json({
      success: true,
      isHolder,
      balance: Number(balance),
      address: address as string,
      contract: contract as string
    });

  } catch (error) {
    console.error('❌ Error checking NFT holder status:', error);
    res.status(500).json({
      error: 'Failed to check NFT holder status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
