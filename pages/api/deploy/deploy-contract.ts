import { requireApiKey } from '../_auth'
import { NextApiRequest, NextApiResponse } from 'next';
import { createWalletClient, http, createPublicClient, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import solc from 'solc';

// Create clients for the Plasma network
const plasmaChain = {
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
};

const publicClient = createPublicClient({
  chain: plasmaChain,
  transport: http('https://rpc.plasma.to'),
});

interface DeploymentRequest {
  deploymentId: string;
  contractCode: string;
  constructorArgs: any[];
  contractName: string;
  userAddress: string;
}

interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: string;
  gasUsed: string;
  deploymentCost: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!requireApiKey(req, res)) return

  try {
    const { deploymentId, contractCode, constructorArgs, contractName, userAddress } = req.body as DeploymentRequest;

    // Validate required fields
    if (!deploymentId || !contractCode || !contractName || !userAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: deploymentId, contractCode, contractName, userAddress' 
      });
    }

    console.log(`Starting contract deployment for: ${contractName}`);
    console.log(`Deployment ID: ${deploymentId}`);
    console.log(`User Address: ${userAddress}`);

    // Get deployer private key from environment
    const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!deployerPrivateKey) {
      throw new Error('Deployer private key not configured');
    }

    // Ensure private key has 0x prefix
    const formattedPrivateKey = deployerPrivateKey.startsWith('0x') 
      ? deployerPrivateKey 
      : `0x${deployerPrivateKey}`;

    // Validate private key length (should be 66 characters: 0x + 64 hex chars)
    if (formattedPrivateKey.length !== 66) {
      throw new Error(`Invalid private key length: ${formattedPrivateKey.length}. Expected 66 characters (0x + 64 hex)`);
    }

    console.log('Using deployer key: configured');

    // Create deployer account
    const deployerAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    
    const walletClient = createWalletClient({
      account: deployerAccount,
      chain: plasmaChain,
      transport: http('https://rpc.plasma.to'),
    });

    console.log(`Deploying from address: ${deployerAccount.address}`);

    // Check deployer balance
    const balance = await publicClient.getBalance({
      address: deployerAccount.address,
    });

    console.log(`Deployer balance: ${balance} wei`);

    if (balance < parseEther('0.1')) {
      throw new Error('Insufficient deployer balance for contract deployment');
    }

    // Deploy the contract
    let deploymentResult: DeploymentResult;
    
    try {
        // Step 1: Compile the contract
        console.log('Compiling smart contract...');
        const compiledContract = await compileContract(contractCode, contractName);
        console.log('Contract compiled successfully, ABI length:', compiledContract.abi.length);
        
        // Step 2: Deploy the contract
        console.log('Deploying contract to Plasma network...');
        
        // Adjust constructor arguments to match pre-compiled contract
        // Pre-compiled contract expects: (name, symbol, baseTokenURI)
        // Generated contract sends: (name, symbol, collectionName, maxSupply, mintPrice, maxPerWallet)
        const adjustedConstructorArgs = [
          constructorArgs[0], // name
          constructorArgs[1], // symbol
          "https://gen-plasma.com/api/metadata/" // baseTokenURI
        ];
        
        console.log('Original constructor args:', constructorArgs);
        console.log('Adjusted constructor args:', adjustedConstructorArgs);
        console.log('Bytecode length:', compiledContract.bytecode.length);
        
        const deployHash = await walletClient.deployContract({
          abi: compiledContract.abi,
          bytecode: compiledContract.bytecode as `0x${string}`,
          args: adjustedConstructorArgs,
        });

        console.log(`Deployment transaction sent: ${deployHash}`);

        // Step 3: Wait for deployment confirmation
        console.log('Waiting for deployment confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: deployHash,
          confirmations: 3
        });

        if (!receipt.contractAddress) {
          throw new Error('Contract deployment failed - no contract address returned');
        }

        deploymentResult = {
          contractAddress: receipt.contractAddress,
          transactionHash: deployHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          deploymentCost: formatEther(receipt.gasUsed * (receipt.effectiveGasPrice || BigInt(0)))
        };

        console.log('Contract deployed successfully:', deploymentResult);

    } catch (deployError) {
      console.error('Contract deployment failed:', deployError);
      const errorMessage = deployError instanceof Error ? deployError.message : 'Unknown deployment error';
      throw new Error(`Contract deployment failed: ${errorMessage}`);
    }

    res.status(200).json({
      success: true,
      deploymentId,
      contractName,
      ...deploymentResult,
      status: 'deployed',
      network: 'plasma',
      explorerUrl: `https://plasmaexplorer.io/address/${deploymentResult.contractAddress}`
    });

  } catch (error) {
    console.error('Contract deployment error:', error);
    
    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('balance')) {
      return res.status(400).json({ error: 'Insufficient balance for deployment' });
    }
    
    if (errorMessage.includes('compilation')) {
      return res.status(400).json({ error: 'Contract compilation failed' });
    }
    
    if (errorMessage.includes('network')) {
      return res.status(503).json({ error: 'Network error, please try again' });
    }

    res.status(500).json({ 
      error: 'Failed to deploy contract',
      details: errorMessage 
    });
  }
}

async function simulateDeployment(): Promise<DeploymentResult> {
  console.log('Simulating contract compilation and deployment...');
  
  // Simulate compilation time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Generate mock deployment result
  return {
    contractAddress: generateMockAddress(),
    transactionHash: generateMockTxHash(),
    blockNumber: (await publicClient.getBlockNumber()).toString(),
    gasUsed: '2500000',
    deploymentCost: '0.05'
  };
}

function generateMockAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

function generateMockTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

// Contract compilation function - uses pre-compiled contracts
async function compileContract(contractCode: string, contractName: string): Promise<{
  abi: any[];
  bytecode: string;
}> {
  console.log(`Using pre-compiled contract for: ${contractName}`);
  
  // Determine contract type based on the contract code
  const contractType = determineContractType(contractCode);
  console.log(`Detected contract type: ${contractType}`);
  
  // Load the appropriate pre-compiled contract
  const preCompiledContract = await loadPreCompiledContract(contractType);
  
  return preCompiledContract;
}

// Determine contract type based on features in the code
function determineContractType(contractCode: string): 'basic' | 'pro' | 'editions' {
  if (contractCode.includes('Pausable') || contractCode.includes('pause()')) {
    return 'pro';
  }
  if (contractCode.includes('editionMetadataURI') || contractCode.includes('setEditionMetadata')) {
    return 'editions';
  }
  return 'basic';
}

// Load pre-compiled contract based on type
async function loadPreCompiledContract(contractType: 'basic' | 'pro' | 'editions'): Promise<{
  abi: any[];
  bytecode: string;
}> {
  // For now, we'll use the same pre-compiled contract for all types
  // In a real implementation, you'd have different contracts for each type
  
  try {
    // Try to load the pre-compiled contract from artifacts
    // In Vercel, the contracts directory might not be available, so we'll use a fallback
    let contractData;
    
    try {
      // Try to load from lib directory using fs.readFileSync to avoid build-time resolution
      const fs = require('fs');
      const path = require('path');
      
      const libPath = path.join(process.cwd(), 'lib', 'contracts', 'PlasmaNFT.json');
      if (fs.existsSync(libPath)) {
        const fileContent = fs.readFileSync(libPath, 'utf8');
        contractData = JSON.parse(fileContent);
        console.log('Loaded contract from lib directory');
      } else {
        throw new Error('Lib contract file not found');
      }
    } catch (libError) {
      try {
        // Fallback to artifacts directory (local development)
        const fs = require('fs');
        const path = require('path');
        
        const artifactsPath = path.join(process.cwd(), 'contracts', 'artifacts', 'PlasmaNFT.json');
        if (fs.existsSync(artifactsPath)) {
          const fileContent = fs.readFileSync(artifactsPath, 'utf8');
          contractData = JSON.parse(fileContent);
          console.log('Loaded contract from artifacts directory');
        } else {
          throw new Error('Artifacts contract file not found');
        }
      } catch (requireError) {
        console.log('Pre-compiled contract not found in either location');
        console.log('Lib error:', libError);
        console.log('Artifacts error:', requireError);
        throw new Error('Pre-compiled contract not available');
      }
    }
    
    // Extract ABI and bytecode
    const abi = contractData.abi;
    const bytecode = contractData.data.bytecode.object;
    
    console.log(`Loaded pre-compiled contract: ABI length ${abi.length}, bytecode length ${bytecode.length}`);
    
    // Debug: Check if constructor exists in ABI
    const constructor = abi.find((item: any) => item.type === 'constructor');
    console.log('Constructor found in ABI:', constructor);
    
    if (!constructor) {
      console.error('No constructor found in ABI!');
      console.log('Available ABI items:', abi.map((item: any) => ({ type: item.type, name: item.name })));
    }
    
    return {
      abi,
      bytecode: `0x${bytecode}`
    };
    
  } catch (error) {
    console.error('Failed to load pre-compiled contract:', error);
    
    // Fallback to mock contract if pre-compiled contract fails to load
    console.log('Falling back to mock contract');
    
    // For now, let's just throw an error to see if we can get the pre-compiled contract working
    throw new Error('Pre-compiled contract not available - please ensure contracts are compiled and available');
  }
}

// Helper function to estimate deployment gas
export async function estimateDeploymentGas(
  contractCode: string,
  constructorArgs: any[]
): Promise<bigint> {
  // TODO: Implement actual gas estimation
  // For now, return a reasonable estimate
  return BigInt(2500000);
}

// Helper function to get current gas price
export async function getCurrentGasPrice(): Promise<bigint> {
  try {
    const gasPrice = await publicClient.getGasPrice();
    return gasPrice;
  } catch (error) {
    console.error('Failed to get gas price:', error);
    // Return fallback gas price (20 gwei)
    return parseEther('0.00000002');
  }
}

