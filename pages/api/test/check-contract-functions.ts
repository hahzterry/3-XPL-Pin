import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http } from 'viem';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractAddress } = req.query;

  if (!contractAddress || typeof contractAddress !== 'string') {
    return res.status(400).json({ error: 'Contract address is required' });
  }

  try {
    console.log(`🔍 Checking available functions for contract: ${contractAddress}`);
    
    // Create a public client for Plasma mainnet
    const publicClient = createPublicClient({
      chain: {
        id: 9745,
        name: 'Plasma Mainnet',
        network: 'plasma',
        nativeCurrency: {
          decimals: 18,
          name: 'XPL',
          symbol: 'XPL',
        },
        rpcUrls: {
          default: { http: ['https://rpc.plasma.to'] },
          public: { http: ['https://rpc.plasma.to'] },
        },
        blockExplorers: {
          default: { name: 'Plasmascan', url: 'https://plasmascan.to' },
        },
      },
      transport: http('https://rpc.plasma.to')
    });

    // Test different functions to see what's available
    const functionTests = [
      { name: 'setRoyalty', abi: [{ "inputs": [{"internalType": "address", "name": "recipient", "type": "address"}, {"internalType": "uint256", "name": "percentage", "type": "uint256"}], "name": "setRoyalty", "outputs": [], "stateMutability": "nonpayable", "type": "function" }] },
      { name: 'setTokenMetadata', abi: [{ "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"internalType": "string", "name": "metadata", "type": "string"}], "name": "setTokenMetadata", "outputs": [], "stateMutability": "nonpayable", "type": "function" }] },
      { name: 'toggleOnChainStorage', abi: [{ "inputs": [], "name": "toggleOnChainStorage", "outputs": [], "stateMutability": "nonpayable", "type": "function" }] },
      { name: 'burn', abi: [{ "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }] },
      { name: 'pause', abi: [{ "inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }] },
      { name: 'withdrawAmount', abi: [{ "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "withdrawAmount", "outputs": [], "stateMutability": "nonpayable", "type": "function" }] },
      { name: 'addToWhitelist', abi: [{ "inputs": [{"internalType": "address", "name": "user", "type": "address"}], "name": "addToWhitelist", "outputs": [], "stateMutability": "nonpayable", "type": "function" }] },
      { name: 'reduceMaxSupply', abi: [{ "inputs": [{"internalType": "uint256", "name": "newMaxSupply", "type": "uint256"}], "name": "reduceMaxSupply", "outputs": [], "stateMutability": "nonpayable", "type": "function" }] }
    ];

    const availableFunctions = [];
    const unavailableFunctions = [];

    for (const funcTest of functionTests) {
      try {
        // Try to read the function (this will fail if function doesn't exist)
        await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: funcTest.abi,
          functionName: funcTest.name as any,
          args: funcTest.name === 'setRoyalty' ? ['0x0000000000000000000000000000000000000000', BigInt(0)] :
                funcTest.name === 'setTokenMetadata' ? [BigInt(1), 'test'] :
                funcTest.name === 'burn' ? [BigInt(1)] :
                funcTest.name === 'withdrawAmount' ? [BigInt(1)] :
                funcTest.name === 'addToWhitelist' ? ['0x0000000000000000000000000000000000000000'] :
                funcTest.name === 'reduceMaxSupply' ? [BigInt(100)] :
                []
        });
        availableFunctions.push(funcTest.name);
      } catch (error) {
        unavailableFunctions.push(funcTest.name);
        console.log(`❌ Function ${funcTest.name} not available:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.log(`✅ Available functions:`, availableFunctions);
    console.log(`❌ Unavailable functions:`, unavailableFunctions);

    return res.status(200).json({
      contractAddress,
      availableFunctions,
      unavailableFunctions,
      totalFunctions: functionTests.length,
      message: `Found ${availableFunctions.length}/${functionTests.length} functions available`
    });

  } catch (error) {
    console.error('❌ Error checking contract functions:', error);
    res.status(500).json({ 
      error: 'Failed to check contract functions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
