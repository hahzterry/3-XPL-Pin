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

    console.log(`🔍 Checking if contract exists: ${contractAddress}`);

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

    // Check if contract exists by trying to read its bytecode
    const bytecode = await publicClient.getBytecode({
      address: contractAddress as `0x${string}`,
    });

    console.log(`📄 Contract bytecode length: ${bytecode ? bytecode.length : 0}`);

    if (!bytecode || bytecode === '0x') {
      return res.status(404).json({ 
        error: 'Contract not found',
        contractAddress,
        message: 'No bytecode found at this address'
      });
    }

    // Try to read basic contract info
    let contractInfo: any = {
      exists: true,
      bytecodeLength: bytecode.length,
      hasBytecode: bytecode !== '0x'
    };

    // Try to read contract name (if it has a name() function)
    try {
      const name = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [
          {
            "inputs": [],
            "name": "name",
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'name',
      });
      contractInfo.name = name;
    } catch (error) {
      console.log('⚠️ Could not read contract name:', error);
    }

    // Try to read contract symbol (if it has a symbol() function)
    try {
      const symbol = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [
          {
            "inputs": [],
            "name": "symbol",
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'symbol',
      });
      contractInfo.symbol = symbol;
    } catch (error) {
      console.log('⚠️ Could not read contract symbol:', error);
    }

    // Try to read total supply (if it has a totalSupply() function)
    try {
      const totalSupply = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [
          {
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'totalSupply',
      });
      contractInfo.totalSupply = totalSupply.toString();
    } catch (error) {
      console.log('⚠️ Could not read total supply:', error);
    }

    console.log('✅ Contract exists and is readable:', contractInfo);

    res.status(200).json({
      success: true,
      contractAddress,
      contractInfo
    });

  } catch (error: any) {
    console.error('❌ Error checking contract:', error);
    res.status(500).json({
      error: 'Failed to check contract',
      details: error.message
    });
  }
}
