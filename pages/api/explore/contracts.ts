import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http, defineChain } from 'viem';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

interface ContractData {
  contractAddress: string;
  name: string;
  symbol: string;
  type: 'basic' | 'pro' | 'editions';
  totalSupply: number;
  maxSupply: number;
  mintPrice: number;
  mintingActive: boolean;
  collectionImage?: string;
  pageDescription?: string;
  websiteUrl?: string;
  xProfileUrl?: string;
  deployedAt: string;
  deployer: string;
  featured?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Fetching deployed contracts for explore page...');
    
    const contracts: ContractData[] = [];

    // 1. Add the main Gen-Plasma collection
    const genPlasmaContract = {
      contractAddress: '0xB10d640B74016ed2b8E1f59CA931467D16534D08',
      name: 'Gen-Plasma Collection',
      symbol: 'GENPLASMA',
      type: 'basic' as const,
      totalSupply: 0, // Will be fetched from blockchain
      maxSupply: 10000,
      mintPrice: 0.1,
      mintingActive: true,
      collectionImage: '/logo-hero.webp',
      pageDescription: 'Unique generative art collection inspired by plasma physics. Each NFT is a one-of-a-kind manifestation of fluid dynamics and energy fields.',
      websiteUrl: 'https://www.gen-plasma.com',
      xProfileUrl: 'https://x.com/genplasma',
      deployedAt: '2024-01-01T00:00:00Z',
      deployer: '0x0000000000000000000000000000000000000000',
      featured: true // Always featured
    };

    // Fetch real data for Gen-Plasma collection
    try {
      const [totalSupply, maxSupply, mintPrice, mintingActive] = await Promise.all([
        publicClient.readContract({
          address: genPlasmaContract.contractAddress as `0x${string}`,
          abi: [{
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }],
          functionName: 'totalSupply'
        }),
        publicClient.readContract({
          address: genPlasmaContract.contractAddress as `0x${string}`,
          abi: [{
            "inputs": [],
            "name": "MAX_SUPPLY",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }],
          functionName: 'MAX_SUPPLY'
        }),
        publicClient.readContract({
          address: genPlasmaContract.contractAddress as `0x${string}`,
          abi: [{
            "inputs": [],
            "name": "mintPrice",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }],
          functionName: 'mintPrice'
        }),
        publicClient.readContract({
          address: genPlasmaContract.contractAddress as `0x${string}`,
          abi: [{
            "inputs": [],
            "name": "mintingActive",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "view",
            "type": "function"
          }],
          functionName: 'mintingActive'
        })
      ]);

      genPlasmaContract.totalSupply = Number(totalSupply);
      genPlasmaContract.maxSupply = Number(maxSupply);
      genPlasmaContract.mintPrice = Number(mintPrice) / 1e18; // Convert from wei
      genPlasmaContract.mintingActive = mintingActive as boolean;
    } catch (error) {
      console.error('Error fetching Gen-Plasma contract data:', error);
    }

    contracts.push(genPlasmaContract);

    // 2. Fetch deployed contracts from database (only featured collections)
    try {
      const { data: deployedContracts, error: dbError } = await supabase
        .from('contracts')
        .select('*')
        .eq('featured', true) // Only show featured collections
        .order('deployed_at', { ascending: false }); // Then by deployment date

      if (dbError) {
        console.error('Database error:', dbError);
      } else if (deployedContracts) {
        console.log(`📊 Found ${deployedContracts.length} deployed contracts in database`);

        // Process each deployed contract
        for (const contract of deployedContracts) {
          try {
            // Fetch mint page settings for this contract
            const { data: settings } = await supabase
              .from('mint_page_settings')
              .select('page_description, website_url, x_profile_url')
              .eq('contract_address', contract.contract_address.toLowerCase())
              .single();

            // Fetch collection image (try both collection_images and mint_banners tables)
            let collectionImage = null;
            
            // First try collection_images table
            const { data: collectionImageData } = await supabase
              .from('collection_images')
              .select('ipfs_url, supabase_url')
              .eq('contract_address', contract.contract_address.toLowerCase())
              .order('uploaded_at', { ascending: false })
              .limit(1)
              .single();
            
            if (collectionImageData) {
              collectionImage = collectionImageData;
            } else {
              // If no collection image, try mint_banners table
              const { data: mintBannerData } = await supabase
                .from('mint_banners')
                .select('banner_url')
                .eq('contract_address', contract.contract_address.toLowerCase())
                .order('uploaded_at', { ascending: false })
                .limit(1)
                .single();
              
              if (mintBannerData) {
                collectionImage = { 
                  ipfs_url: mintBannerData.banner_url,
                  supabase_url: mintBannerData.banner_url 
                };
              }
            }

            // Fetch real blockchain data including name and symbol
            const [name, symbol, totalSupply, maxSupply, mintPrice, mintingActive] = await Promise.all([
              publicClient.readContract({
                address: contract.contract_address as `0x${string}`,
                abi: [{
                  "inputs": [],
                  "name": "name",
                  "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                  "stateMutability": "view",
                  "type": "function"
                }],
                functionName: 'name'
              }).catch(() => contract.name || 'Unknown Collection'),
              publicClient.readContract({
                address: contract.contract_address as `0x${string}`,
                abi: [{
                  "inputs": [],
                  "name": "symbol",
                  "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                  "stateMutability": "view",
                  "type": "function"
                }],
                functionName: 'symbol'
              }).catch(() => contract.symbol || 'UNKNOWN'),
              publicClient.readContract({
                address: contract.contract_address as `0x${string}`,
                abi: [{
                  "inputs": [],
                  "name": "totalSupply",
                  "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                  "stateMutability": "view",
                  "type": "function"
                }],
                functionName: 'totalSupply'
              }).catch(() => 0),
              publicClient.readContract({
                address: contract.contract_address as `0x${string}`,
                abi: [{
                  "inputs": [],
                  "name": "MAX_SUPPLY",
                  "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                  "stateMutability": "view",
                  "type": "function"
                }],
                functionName: 'MAX_SUPPLY'
              }).catch(() => 10000),
              publicClient.readContract({
                address: contract.contract_address as `0x${string}`,
                abi: [{
                  "inputs": [],
                  "name": "MINT_PRICE",
                  "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                  "stateMutability": "view",
                  "type": "function"
                }],
                functionName: 'MINT_PRICE'
              }).catch(() => 0),
              publicClient.readContract({
                address: contract.contract_address as `0x${string}`,
                abi: [{
                  "inputs": [],
                  "name": "mintingActive",
                  "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                  "stateMutability": "view",
                  "type": "function"
                }],
                functionName: 'mintingActive'
              }).catch(() => false)
            ]);

            const contractData: ContractData = {
              contractAddress: contract.contract_address,
              name: name as string, // Use blockchain name
              symbol: symbol as string, // Use blockchain symbol
              type: contract.contract_type || 'basic',
              totalSupply: Number(totalSupply),
              maxSupply: Number(maxSupply),
              mintPrice: Number(mintPrice) / 1e18,
              mintingActive: mintingActive as boolean,
              collectionImage: collectionImage?.ipfs_url || collectionImage?.supabase_url,
              pageDescription: settings?.page_description,
              websiteUrl: settings?.website_url,
              xProfileUrl: settings?.x_profile_url,
              deployedAt: contract.deployed_at || new Date().toISOString(),
              deployer: contract.deployer || 'Unknown',
              featured: contract.featured || false
            };

            contracts.push(contractData);
          } catch (error) {
            console.error(`Error processing contract ${contract.contract_address}:`, error);
            // Add basic contract info even if blockchain calls fail
            // Try to get at least name and symbol from blockchain
            const [fallbackName, fallbackSymbol] = await Promise.all([
              publicClient.readContract({
                address: contract.contract_address as `0x${string}`,
                abi: [{
                  "inputs": [],
                  "name": "name",
                  "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                  "stateMutability": "view",
                  "type": "function"
                }],
                functionName: 'name'
              }).catch(() => contract.name || 'Unknown Collection'),
              publicClient.readContract({
                address: contract.contract_address as `0x${string}`,
                abi: [{
                  "inputs": [],
                  "name": "symbol",
                  "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                  "stateMutability": "view",
                  "type": "function"
                }],
                functionName: 'symbol'
              }).catch(() => contract.symbol || 'UNKNOWN')
            ]);

            contracts.push({
              contractAddress: contract.contract_address,
              name: fallbackName as string,
              symbol: fallbackSymbol as string,
              type: contract.contract_type || 'basic',
              totalSupply: 0,
              maxSupply: contract.max_supply || 10000,
              mintPrice: contract.mint_price || 0.1,
              mintingActive: true,
              deployedAt: contract.deployed_at || new Date().toISOString(),
              deployer: contract.deployer || 'Unknown',
              featured: contract.featured || false
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching deployed contracts:', error);
    }

    console.log(`✅ Returning ${contracts.length} contracts for explore page`);

    res.status(200).json({
      success: true,
      contracts,
      total: contracts.length
    });

  } catch (error) {
    console.error('❌ Error fetching contracts for explore page:', error);
    res.status(500).json({
      error: 'Failed to fetch contracts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
