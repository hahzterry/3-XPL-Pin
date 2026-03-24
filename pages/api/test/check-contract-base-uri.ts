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
    console.log(`🔍 Checking contract base URI for: ${contractAddress}`);
    
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

    // Try different base URI function names that might exist
    let baseURI = null;
    let functionName = null;
    
    // Common base URI function names in ERC-721 contracts
    const possibleFunctions = [
      'baseURI',
      '_baseURI',
      'baseTokenURI', 
      '_baseTokenURI',
      'tokenBaseURI'
    ];
    
    for (const funcName of possibleFunctions) {
      try {
        console.log(`🔍 Trying function: ${funcName}`);
        baseURI = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{
            "inputs": [],
            "name": funcName,
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function"
          }],
          functionName: funcName as any,
        });
        functionName = funcName;
        console.log(`✅ Found base URI using function: ${funcName}`);
        break;
      } catch (error) {
        console.log(`❌ Function ${funcName} not found:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }
    
    if (!baseURI) {
      // If no base URI function found, try to get token URI for token 1 to see the pattern
      try {
        console.log(`🔍 Trying to get tokenURI for token 1 to analyze pattern`);
        const tokenURI = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{
            "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
            "name": "tokenURI",
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function"
          }],
          functionName: 'tokenURI',
          args: [BigInt(1)]
        });
        
        // Extract base URI from token URI (remove the token ID part)
        if (tokenURI && typeof tokenURI === 'string') {
          const baseURIMatch = tokenURI.match(/^(.+)\d+$/);
          if (baseURIMatch) {
            baseURI = baseURIMatch[1];
            functionName = 'tokenURI (extracted)';
          } else {
            baseURI = tokenURI;
            functionName = 'tokenURI (direct)';
          }
        }
      } catch (error) {
        console.log(`❌ Could not get tokenURI:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.log(`📄 Contract base URI: ${baseURI}`);

    return res.status(200).json({
      contractAddress,
      baseURI: baseURI,
      functionName: functionName,
      isOurMetadataAPI: baseURI && baseURI.includes('gen-plasma.com/api/metadata/basic'),
      message: baseURI ? 'Contract base URI retrieved successfully' : 'Could not find base URI function'
    });

  } catch (error) {
    console.error('❌ Error checking contract base URI:', error);
    res.status(500).json({ 
      error: 'Failed to check contract base URI',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
