import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

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
    const { contractAddress, newOwnerAddress } = req.body;

    if (!contractAddress || !newOwnerAddress) {
      return res.status(400).json({ error: 'Missing contractAddress or newOwnerAddress' });
    }

    // Get the old payment system private key
    const oldPaymentSystemPrivateKey = process.env.OLD_PAYMENT_SYSTEM_PRIVATE_KEY;
    if (!oldPaymentSystemPrivateKey) {
      return res.status(500).json({ error: 'OLD_PAYMENT_SYSTEM_PRIVATE_KEY not configured' });
    }

    // Create clients
    const account = privateKeyToAccount(oldPaymentSystemPrivateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: plasmaMainnet,
      transport: http(),
    });
    const publicClient = createPublicClient({
      chain: plasmaMainnet,
      transport: http(),
    });

    // Check current owner
    const currentOwner = await publicClient.readContract({
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

    console.log('🔍 Ownership transfer check:', {
      contractAddress,
      currentOwner,
      newOwnerAddress,
      isCurrentOwner: currentOwner.toLowerCase() === account.address.toLowerCase()
    });

    // Verify that the current owner is the old payment system wallet
    if (currentOwner.toLowerCase() !== account.address.toLowerCase()) {
      return res.status(403).json({ 
        error: 'Current owner is not the old payment system wallet',
        currentOwner,
        expectedOwner: account.address
      });
    }

    // Transfer ownership
    console.log('🔄 Transferring ownership...');
    const hash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: [{
        "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }],
      functionName: 'transferOwnership',
      args: [newOwnerAddress as `0x${string}`],
    });

    console.log('⏳ Waiting for ownership transfer confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Verify the transfer
    const newOwner = await publicClient.readContract({
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

    console.log('✅ Ownership transfer completed:', {
      contractAddress,
      newOwner,
      expectedNewOwner: newOwnerAddress,
      transferSuccessful: newOwner.toLowerCase() === newOwnerAddress.toLowerCase()
    });

    return res.status(200).json({
      success: true,
      contractAddress,
      oldOwner: currentOwner,
      newOwner,
      transactionHash: hash,
      message: 'Ownership transferred successfully'
    });

  } catch (error) {
    console.error('Ownership transfer error:', error);
    return res.status(500).json({ 
      error: 'Failed to transfer ownership',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
