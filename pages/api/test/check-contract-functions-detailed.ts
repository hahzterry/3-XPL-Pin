import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http } from 'viem';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress } = req.body;

    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    console.log(`🔍 Checking available functions for contract: ${contractAddress}`);

    // Create public client for Plasma network
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
          default: {
            http: ['https://rpc.plasma.to'],
          },
          public: {
            http: ['https://rpc.plasma.to'],
          },
        },
      },
      transport: http('https://rpc.plasma.to'),
    });

    const functionTests = [
      { name: 'setMintingActive', signature: 'setMintingActive(bool)', params: [true] },
      { name: 'setMintPrice', signature: 'setMintPrice(uint256)', params: [BigInt(10000000000000000)] },
      { name: 'withdraw', signature: 'withdraw()', params: [] },
      { name: 'ownerMint', signature: 'ownerMint(address,uint256)', params: ['0x0000000000000000000000000000000000000000', BigInt(1)] },
      { name: 'withdrawAmount', signature: 'withdrawAmount(uint256)', params: [BigInt(10000000000000000)] },
    ];

    const results: any = {};

    for (const func of functionTests) {
      try {
        console.log(`🧪 Testing function: ${func.name}`);
        
        // Try to simulate the function call
        await publicClient.simulateContract({
          address: contractAddress as `0x${string}`,
          abi: [{
            "inputs": func.params.map((_, i) => ({ "internalType": i === 0 && func.name === 'setMintingActive' ? "bool" : 
                                                      i === 0 && func.name === 'setMintPrice' ? "uint256" :
                                                      i === 0 && func.name === 'ownerMint' ? "address" :
                                                      i === 1 && func.name === 'ownerMint' ? "uint256" :
                                                      i === 0 && func.name === 'withdrawAmount' ? "uint256" : "uint256",
                                                      "name": i === 0 ? "param1" : "param2", 
                                                      "type": i === 0 && func.name === 'setMintingActive' ? "bool" : 
                                                              i === 0 && func.name === 'setMintPrice' ? "uint256" :
                                                              i === 0 && func.name === 'ownerMint' ? "address" :
                                                              i === 1 && func.name === 'ownerMint' ? "uint256" :
                                                              i === 0 && func.name === 'withdrawAmount' ? "uint256" : "uint256" })),
            "name": func.name,
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }],
          functionName: func.name as any,
          args: func.params as any,
          account: '0x0000000000000000000000000000000000000000' // Dummy account for simulation
        });
        
        results[func.name] = { available: true, error: null };
        console.log(`✅ Function ${func.name} is available`);
        
      } catch (error: any) {
        results[func.name] = { 
          available: false, 
          error: error.message,
          isFunctionNotFound: error.message.includes('function') && error.message.includes('not found')
        };
        console.log(`❌ Function ${func.name} not available:`, error.message);
      }
    }

    res.status(200).json({
      success: true,
      contractAddress,
      functionAvailability: results
    });

  } catch (error: any) {
    console.error('❌ Error checking contract functions:', error);
    res.status(500).json({
      error: 'Failed to check contract functions',
      details: error.message
    });
  }
}
