import { NextApiRequest, NextApiResponse } from 'next';

interface VerifyRequest {
  contractAddress: string;
  contractType: 'basic' | 'pro' | 'editions';
  contractName: string;
  symbol: string;
  baseTokenURI: string;
  // Type-specific constructor args
  royaltyRecipient?: string;
  artworkName?: string;
  artworkDescription?: string;
  artworkImage?: string;
  artistName?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      contractAddress,
      contractType,
      contractName,
      symbol,
      baseTokenURI,
      royaltyRecipient,
      artworkName,
      artworkDescription,
      artworkImage,
      artistName
    }: VerifyRequest = req.body;

    // Validate required fields
    if (!contractAddress || !contractType || !contractName || !symbol || !baseTokenURI) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Build constructor arguments based on contract type
    let constructorArgs: string[] = [];
    
    switch (contractType) {
      case 'basic':
        constructorArgs = [contractName, symbol, baseTokenURI];
        break;
      case 'pro':
        constructorArgs = [contractName, symbol, baseTokenURI, royaltyRecipient || '0x0000000000000000000000000000000000000000'];
        break;
      case 'editions':
        constructorArgs = [
          contractName, 
          symbol, 
          baseTokenURI, 
          artworkName || 'Untitled Artwork', 
          artworkDescription || 'A unique digital artwork', 
          artworkImage || '', 
          artistName || 'Unknown Artist'
        ];
        break;
      default:
        return res.status(400).json({ error: 'Invalid contract type' });
    }

    console.log('🔍 Preparing Hardhat verification command:', {
      contractAddress,
      contractType,
      constructorArgs
    });

    // Build the hardhat verify command for manual execution
    const argsString = constructorArgs.map(arg => `"${arg}"`).join(' ');
    const command = `npx hardhat run scripts/verify-contract.js --network plasma ${contractAddress} ${argsString}`;
    
    // Alternative: Direct hardhat verify command
    const directCommand = `npx hardhat verify --network plasma ${contractAddress} ${argsString}`;

    console.log('📋 Hardhat verification commands prepared');

    // Return the command for manual execution instead of trying to run it
    res.status(200).json({
      success: true,
      message: 'Hardhat verification command prepared - execute manually',
      contractAddress,
      contractType,
      constructorArgs,
      commands: {
        scriptCommand: command,
        directCommand: directCommand
      },
      instructions: [
        '1. Copy one of the commands above',
        '2. Run it in your terminal from the project root',
        '3. Or use: npm run verify <contractAddress> <args...>',
        '4. Check Plasmascan for verification status'
      ],
      explorerUrl: `https://plasmascan.to/address/${contractAddress}`,
      note: 'Serverless environments cannot execute Hardhat commands directly. Use manual verification.'
    });

  } catch (error: any) {
    console.error('❌ Hardhat verification error:', error);
    
    // Check if it's already verified
    if (error.message && error.message.includes('already verified')) {
      res.status(200).json({
        success: true,
        message: 'Contract is already verified',
        contractAddress: req.body.contractAddress,
        explorerUrl: `https://plasmascan.to/address/${req.body.contractAddress}`
      });
    } else {
      res.status(500).json({ 
        error: 'Verification failed', 
        details: error.message,
        output: error.stdout || error.stderr
      });
    }
  }
}
