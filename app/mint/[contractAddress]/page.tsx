'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useNetwork, useSwitchNetwork } from 'wagmi';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnimatedBackground from '@/components/AnimatedBackground';

interface ContractInfo {
  name: string;
  symbol: string;
  totalSupply: number;
  maxSupply: number;
  mintPrice: string;
  mintingActive: boolean;
  owner: string;
  baseTokenURI: string;
  contractType: 'basic' | 'pro' | 'editions';
  collectionImage?: string;
}

interface MintPageProps {
  params: {
    contractAddress: string;
  };
}

// Helper function to format price nicely (removes trailing zeros)
const formatPrice = (price: number | string): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0';
  
  // Remove trailing zeros by converting to string and using regex
  return num.toFixed(4).replace(/\.?0+$/, '');
};

export default function MintPage({ params }: MintPageProps) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const contractAddress = params.contractAddress;
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState('');
  
  // Admin controls state
  const [isOwner, setIsOwner] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newMintPrice, setNewMintPrice] = useState('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isTogglingMinting, setIsTogglingMinting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  // Owner mint functionality removed - not available on these contracts
  
  // Page customization state
  const [pageDescription, setPageDescription] = useState('');
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [pageBackground, setPageBackground] = useState('gradient-purple-blue');
  const [isUpdatingBackground, setIsUpdatingBackground] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  
  // Social links state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [xProfileUrl, setXProfileUrl] = useState('');
  const [isUpdatingSocialLinks, setIsUpdatingSocialLinks] = useState(false);
  
  // Withdraw specific amount functionality removed - not available on contracts
  
  // Burn token state
  const [burnTokenId, setBurnTokenId] = useState('');
  const [isBurningToken, setIsBurningToken] = useState(false);
  
  // Pro-specific admin state
  // Pro: Set Token Metadata state removed - function not available
  // Toggle on-chain storage state removed - function not available
  const [royaltyRecipient, setRoyaltyRecipient] = useState('');
  const [royaltyPercentage, setRoyaltyPercentage] = useState('');
  const [isSettingRoyalty, setIsSettingRoyalty] = useState(false);
  
  // Editions-specific state removed - functionality not implemented
  
  // Whitelisting state (for Pro and Editions contracts)
  const [whitelistEnabled, setWhitelistEnabled] = useState(false); // Toggle to enable/disable whitelist enforcement
  const [whitelistGroups, setWhitelistGroups] = useState<{[key: string]: {
    title: string, 
    addresses: string[],
    mintStartTime?: string,
    mintEndTime?: string,
    timezone?: string,
    isTimeScheduled?: boolean,
    merkleRoot?: string,
    isActivatedOnchain?: boolean,
    activatedAt?: string
  }}>({});
  const [currentGroupId, setCurrentGroupId] = useState('');
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [whitelistAddress, setWhitelistAddress] = useState('');
  const [isAddingToWhitelist, setIsAddingToWhitelist] = useState(false);
  const [isImportingWhitelist, setIsImportingWhitelist] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  
  // Time scheduling state for editing existing groups
  const [editingGroupMintStartTime, setEditingGroupMintStartTime] = useState('');
  const [editingGroupMintEndTime, setEditingGroupMintEndTime] = useState('');
  const [editingGroupTimezone, setEditingGroupTimezone] = useState('UTC');
  const [editingGroupTimeScheduled, setEditingGroupTimeScheduled] = useState(false);
  const [isUpdatingGroupSchedule, setIsUpdatingGroupSchedule] = useState(false);
  
  // Merkle tree activation state
  const [isGeneratingMerkleRoot, setIsGeneratingMerkleRoot] = useState(false);
  const [isActivatingOnChain, setIsActivatingOnChain] = useState(false);
  const [isUpdatingMerkleRoot, setIsUpdatingMerkleRoot] = useState(false);
  const [needsMerkleUpdate, setNeedsMerkleUpdate] = useState<{[key: string]: boolean}>({});
  
  // Collection image upload state
  const [isUploadingCollectionImage, setIsUploadingCollectionImage] = useState(false);
  const [isLoadingCollectionImage, setIsLoadingCollectionImage] = useState(true);
  
  // NFT metadata image upload state
  const [selectedMetadataImage, setSelectedMetadataImage] = useState<File | null>(null);
  const [metadataImagePreview, setMetadataImagePreview] = useState<string | null>(null);
  const [isUploadingMetadataImage, setIsUploadingMetadataImage] = useState(false);
  
  // Token-specific metadata state
  const [selectedTokenId, setSelectedTokenId] = useState<string>('');
  const [isSettingTokenMetadataForNFT, setIsSettingTokenMetadataForNFT] = useState(false);
  const [pendingMetadataBaseURI, setPendingMetadataBaseURI] = useState<string>('');
  
  // Featured collection state
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);
  const [contractTypeOverride, setContractTypeOverride] = useState<'basic' | 'pro' | 'editions' | 'custom'>('basic');
  const [isUpdatingContractType, setIsUpdatingContractType] = useState(false);

  // Fetch contract data from blockchain
  const { data: name } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [],
      "name": "name",
      "outputs": [{"internalType": "string", "name": "", "type": "string"}],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'name'
  });

  const { data: symbol } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [],
      "name": "symbol",
      "outputs": [{"internalType": "string", "name": "", "type": "string"}],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'symbol'
  });

  const { data: totalSupply } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'totalSupply'
  });

  const { data: maxSupply } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [],
      "name": "MAX_SUPPLY",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'MAX_SUPPLY'
  });

  const { data: mintPrice } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [],
      "name": "MINT_PRICE",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'MINT_PRICE'
  });

  const { data: mintingActive } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [],
      "name": "mintingActive",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'mintingActive'
  });

  const { data: owner } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [],
      "name": "owner",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'owner'
  });

  // Function to fetch mint banner image
  const fetchMintBanner = async (contractAddress: string) => {
    try {
      console.log(`🔍 Fetching mint banner for contract: ${contractAddress}`);
      // Try to fetch mint banner from our API
      const response = await fetch(`/api/mint-banner/${contractAddress}`);
      console.log(`📡 Mint banner API response status: ${response.status}`);
      
      if (response.ok) {
        const bannerData = await response.json();
        console.log(`📄 Mint banner data received:`, bannerData);
        console.log(`🖼️ Banner URL: ${bannerData.bannerUrl}`);
        
        if (bannerData.bannerUrl) {
          console.log(`✅ Found uploaded mint banner: ${bannerData.bannerUrl}`);
          return bannerData.bannerUrl;
        }
      } else if (response.status === 404) {
        console.log(`ℹ️ No mint banner found for contract: ${contractAddress}`);
      } else {
        console.error(`❌ Mint banner API failed with status: ${response.status}`);
        const errorText = await response.text();
        console.error(`❌ Error response:`, errorText);
      }
    } catch (error) {
      console.error('❌ Could not fetch mint banner:', error);
    }
    return undefined;
  };

  // Fetch contract type
  const fetchContractType = async () => {
    try {
      console.log('🔍 Fetching contract type for:', contractAddress);
      const response = await fetch(`/api/contract/get-contract-type?contractAddress=${contractAddress}`);
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Contract type determined:', result);
        return result.contractType || 'basic';
      }
    } catch (error) {
      console.error('❌ Error fetching contract type:', error);
    }
    return 'basic'; // Default fallback
  };

  useEffect(() => {
    const loadContractData = async () => {
      if (name && symbol && totalSupply !== undefined && maxSupply !== undefined && mintPrice !== undefined && mintingActive !== undefined && owner) {
        // Determine contract type dynamically
        const contractType = await fetchContractType();
        
        // Set appropriate base URI based on contract type
        let baseTokenURI = `https://gen-plasma.com/api/metadata/basic/${contractAddress}/`;
        if (contractType === 'pro') {
          baseTokenURI = `https://gen-plasma.com/api/metadata/pro/${contractAddress}/`;
        } else if (contractType === 'editions') {
          baseTokenURI = `https://gen-plasma.com/api/metadata/editions/${contractAddress}/`;
        }

        const contractData = {
          name: name as string,
          symbol: symbol as string,
          totalSupply: Number(totalSupply),
          maxSupply: Number(maxSupply),
          mintPrice: mintPrice ? formatPrice(Number(mintPrice) / 1e18) : '0', // Convert from wei to XPL
          mintingActive: mintingActive as boolean,
          owner: owner as string,
          baseTokenURI: baseTokenURI,
          contractType: contractType as 'basic' | 'pro' | 'editions',
          collectionImage: undefined
        };

        setContractInfo(contractData);

      // Check admin access (owner or deployer)
      const checkAdminAccess = async () => {
        if (!address) {
          setIsOwner(false);
          setIsCheckingAdmin(false);
          return;
        }

        try {
          const response = await fetch('/api/admin/check-admin-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractAddress,
              userAddress: address
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('🔍 Admin access check:', {
              connectedAddress: address,
              contractOwner: owner,
              hasAdminAccess: result.hasAdminAccess,
              isOwner: result.isOwner,
              isDeployer: result.isDeployer
            });
            
            setIsOwner(result.hasAdminAccess);
            
            if (result.hasAdminAccess) {
              console.log('✅ User has admin access - showing admin panel');
            } else {
              console.log('❌ User does not have admin access - admin panel hidden');
            }
          } else {
            console.error('Failed to check admin access');
            setIsOwner(false);
          }
        } catch (error) {
          console.error('Error checking admin access:', error);
          setIsOwner(false);
        } finally {
          setIsCheckingAdmin(false);
        }
      };

        checkAdminAccess();

        // Always try to fetch mint banner for any contract type
        setIsLoadingCollectionImage(true);
        fetchMintBanner(contractAddress).then(bannerUrl => {
          if (bannerUrl) {
            setContractInfo(prev => prev ? { ...prev, collectionImage: bannerUrl } : null);
            console.log('Mint banner loaded:', bannerUrl);
          } else {
            console.log('No mint banner found for contract:', contractAddress);
          }
          setIsLoadingCollectionImage(false);
        }).catch(error => {
          console.error('Error loading mint banner:', error);
          setIsLoadingCollectionImage(false);
        });

        setIsLoading(false);
      }
    };

    loadContractData();
  }, [name, symbol, totalSupply, maxSupply, mintPrice, mintingActive, owner, contractAddress, address]);

  // State for Merkle proof
  const [merkleProof, setMerkleProof] = useState<readonly `0x${string}`[]>([]);
  const [merkleGroupId, setMerkleGroupId] = useState<number>(0);

  // Contract write hook for minting - Basic contracts (no Merkle)
  const { config: mintConfigBasic } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [{"internalType": "uint256", "name": "quantity", "type": "uint256"}],
      "name": "mint",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }],
    functionName: 'mint',
    args: [BigInt(mintQuantity)],
    value: mintPrice ? BigInt(mintPrice) * BigInt(mintQuantity) : undefined,
    enabled: isConnected && !!contractInfo?.mintingActive && contractInfo?.contractType === 'basic'
  });

  // Contract write hook for minting - Pro/Editions with Merkle
  const { config: mintConfigMerkle } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [
        {"internalType": "uint256", "name": "quantity", "type": "uint256"},
        {"internalType": "bytes32[]", "name": "merkleProof", "type": "bytes32[]"},
        {"internalType": "uint256", "name": "groupId", "type": "uint256"}
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }],
    functionName: 'mint',
    args: [BigInt(mintQuantity), merkleProof, BigInt(merkleGroupId)],
    value: mintPrice ? BigInt(mintPrice) * BigInt(mintQuantity) : undefined,
    enabled: isConnected && !!contractInfo?.mintingActive && (contractInfo?.contractType === 'pro' || contractInfo?.contractType === 'editions')
  });

  // Create separate write hooks for Basic and Merkle contracts
  const { write: mintBasic, isLoading: isMintLoadingBasic } = useContractWrite({
    ...mintConfigBasic,
    onSuccess: (data) => {
      setIsMinting(false);
      setMintStatus(`Mint successful! Transaction: ${data.hash}`);
      console.log('Mint transaction:', data);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    },
    onError: (error) => {
      setIsMinting(false);
      setMintStatus(`Mint failed: ${error.message}`);
      console.error('Mint error:', error);
    }
  });

  const { write: mintMerkle, isLoading: isMintLoadingMerkle } = useContractWrite({
    ...mintConfigMerkle,
    onSuccess: (data) => {
      setIsMinting(false);
      setMintStatus(`Mint successful! Transaction: ${data.hash}`);
      console.log('Mint transaction:', data);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    },
    onError: (error) => {
      setIsMinting(false);
      setMintStatus(`Mint failed: ${error.message}`);
      console.error('Mint error:', error);
    }
  });

  // Use the appropriate write function based on contract type
  const mint = contractInfo?.contractType === 'basic' ? mintBasic : mintMerkle;
  const isMintLoading = contractInfo?.contractType === 'basic' ? isMintLoadingBasic : isMintLoadingMerkle;

  const handleMint = async () => {
    if (!isConnected || !address) {
      setMintStatus('Please connect your wallet first');
      return;
    }

    if (!contractInfo?.mintingActive) {
      setMintStatus('Minting is not active');
      return;
    }

    if (!contractInfo) {
      setMintStatus('Contract information not loaded');
      return;
    }

    if (!mint) {
      setMintStatus('Mint function not ready. Please try again.');
      return;
    }

    // Check whitelist and time scheduling for Pro/Editions contracts
    if (contractInfo.contractType === 'pro' || contractInfo.contractType === 'editions') {
      const mintAvailability = await checkMintAvailability();
      if (!mintAvailability.canMint) {
        setMintStatus(`❌ ${mintAvailability.reason}`);
        return;
      }

      // Generate Merkle proof if whitelist is enabled
      if (currentGroupId && whitelistGroups[currentGroupId]) {
        try {
          setMintStatus('Generating whitelist proof...');
          
          const proofResponse = await fetch(
            `/api/whitelist/get-merkle-proof?contractAddress=${contractAddress}&groupId=${currentGroupId}&address=${address}`
          );
          
          if (proofResponse.ok) {
            const proofData = await proofResponse.json();
            const proof = (proofData.proof || []) as `0x${string}`[];
            setMerkleProof(proof);
            
            // Extract group ID number from the string groupId
            const groupIdNumber = parseInt(currentGroupId.replace(/\D/g, '')) || 0;
            setMerkleGroupId(groupIdNumber);
            
            console.log('✅ Merkle proof generated:', {
              proof: proof,
              groupId: groupIdNumber,
              merkleRoot: proofData.merkleRoot
            });
          } else {
            // If proof generation fails, try minting without proof (backward compatibility)
            console.log('⚠️ No Merkle proof available, attempting mint without proof');
            setMerkleProof([]);
            setMerkleGroupId(0);
          }
        } catch (error) {
          console.error('❌ Error generating Merkle proof:', error);
          setMerkleProof([]);
          setMerkleGroupId(0);
        }
      }
    }

    // Validate mint price
    const mintPrice = parseFloat(contractInfo.mintPrice);
    if (isNaN(mintPrice) || mintPrice <= 0) {
      setMintStatus('Invalid mint price');
      return;
    }

    setIsMinting(true);
    setMintStatus('Preparing mint transaction...');

    try {
      // Call the actual mint function which will prompt for transaction
      console.log('Attempting to mint:', {
        quantity: mintQuantity,
        price: mintPrice,
        totalCost: mintPrice * mintQuantity,
        contractAddress: contractAddress,
        merkleProof: merkleProof.length > 0 ? merkleProof : 'none',
        groupId: merkleGroupId
      });
      
      mint();
    } catch (error) {
      setIsMinting(false);
      setMintStatus(`Mint failed: ${error}`);
      console.error('Mint error:', error);
    }
  };

  // Contract write hooks for admin functions
  const { config: setMintingActiveConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [{"internalType": "bool", "name": "active", "type": "bool"}],
      "name": "setMintingActive",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    functionName: 'setMintingActive',
    args: [!contractInfo?.mintingActive], // Toggle the current state
    enabled: isOwner && !!contractInfo
  });

  const { write: setMintingActive, isLoading: isToggleLoading } = useContractWrite({
    ...setMintingActiveConfig,
    onSuccess: () => {
      setIsTogglingMinting(false);
      setMintStatus('Minting status updated successfully!');
      // Refresh contract data after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error) => {
      setIsTogglingMinting(false);
      setMintStatus(`Error updating minting status: ${error.message}`);
    }
  });

  // State for whitelist activation
  const [activationMerkleRoot, setActivationMerkleRoot] = useState<`0x${string}`>('0x0000000000000000000000000000000000000000000000000000000000000000');
  const [activationStartTime, setActivationStartTime] = useState<bigint>(BigInt(0));
  const [activationEndTime, setActivationEndTime] = useState<bigint>(BigInt(0));
  
  // State for whitelist update
  const [updateGroupId, setUpdateGroupId] = useState<bigint>(BigInt(0));
  const [updateMerkleRoot, setUpdateMerkleRoot] = useState<`0x${string}`>('0x0000000000000000000000000000000000000000000000000000000000000000');

  // Create whitelist group on-chain
  const { config: createWhitelistGroupConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [
        {"internalType": "bytes32", "name": "merkleRoot", "type": "bytes32"},
        {"internalType": "uint256", "name": "startTime", "type": "uint256"},
        {"internalType": "uint256", "name": "endTime", "type": "uint256"}
      ],
      "name": "createWhitelistGroup",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    functionName: 'createWhitelistGroup',
    args: [activationMerkleRoot, activationStartTime, activationEndTime],
    enabled: isOwner && activationMerkleRoot !== '0x0000000000000000000000000000000000000000000000000000000000000000'
  });

  const { write: createWhitelistGroup, isLoading: isCreatingWhitelistGroup } = useContractWrite({
    ...createWhitelistGroupConfig,
    onSuccess: (data) => {
      setIsActivatingOnChain(false);
      setMintStatus('✅ Whitelist group activated on-chain!');
      console.log('✅ Whitelist activation transaction successful:', data);
      
      // Mark as activated in database
      const currentGroup = currentGroupId;
      if (currentGroup) {
        fetch('/api/whitelist/activate-onchain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress,
            groupId: currentGroup,
            activatedBy: address,
            transactionHash: data.hash
          })
        }).then(() => {
          console.log('✅ Activation status saved to database');
          // Reload whitelist groups
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        });
      }
    },
    onError: (error) => {
      setIsActivatingOnChain(false);
      setMintStatus(`❌ Failed to activate on-chain: ${error.message}`);
      console.error('❌ Activation error:', error);
    }
  });

  // Auto-trigger activation when state is set
  useEffect(() => {
    if (isActivatingOnChain && 
        activationMerkleRoot !== '0x0000000000000000000000000000000000000000000000000000000000000000' && 
        createWhitelistGroup) {
      console.log('🚀 Auto-triggering createWhitelistGroup with:', {
        merkleRoot: activationMerkleRoot,
        startTime: activationStartTime.toString(),
        endTime: activationEndTime.toString(),
        isReady: !!createWhitelistGroup
      });
      createWhitelistGroup();
    }
  }, [activationMerkleRoot, activationStartTime, activationEndTime, createWhitelistGroup, isActivatingOnChain]);

  // Update whitelist group Merkle root on-chain
  const { config: updateWhitelistGroupConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [
        {"internalType": "uint256", "name": "groupId", "type": "uint256"},
        {"internalType": "bytes32", "name": "merkleRoot", "type": "bytes32"}
      ],
      "name": "updateWhitelistGroup",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    functionName: 'updateWhitelistGroup',
    args: [updateGroupId, updateMerkleRoot],
    enabled: isOwner && updateMerkleRoot !== '0x0000000000000000000000000000000000000000000000000000000000000000'
  });

  const { write: updateWhitelistGroup } = useContractWrite({
    ...updateWhitelistGroupConfig,
    onSuccess: (data) => {
      setIsUpdatingMerkleRoot(false);
      setMintStatus('✅ Merkle root updated on-chain!');
      console.log('✅ Merkle root update transaction successful:', data);
      
      // Clear the update flag
      const currentGroup = currentGroupId;
      if (currentGroup) {
        setNeedsMerkleUpdate(prev => ({ ...prev, [currentGroup]: false }));
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error) => {
      setIsUpdatingMerkleRoot(false);
      setMintStatus(`❌ Failed to update Merkle root on-chain: ${error.message}`);
      console.error('❌ Update error:', error);
    }
  });

  // Auto-trigger update when state is set
  useEffect(() => {
    if (isUpdatingMerkleRoot && 
        updateMerkleRoot !== '0x0000000000000000000000000000000000000000000000000000000000000000' && 
        updateWhitelistGroup) {
      console.log('🔄 Auto-triggering updateWhitelistGroup with:', {
        groupId: updateGroupId.toString(),
        merkleRoot: updateMerkleRoot
      });
      updateWhitelistGroup();
    }
  }, [updateGroupId, updateMerkleRoot, updateWhitelistGroup, isUpdatingMerkleRoot]);

  // Set mint price
  const { config: setPriceConfig, error: setPriceError } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [{"internalType": "uint256", "name": "newPrice", "type": "uint256"}],
      "name": "setMintPrice", 
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    functionName: 'setMintPrice',
    args: newMintPrice ? [BigInt(Math.floor(parseFloat(newMintPrice) * 1e18))] : undefined,
    enabled: Boolean(isOwner && newMintPrice && !isNaN(parseFloat(newMintPrice)))
  });

  // Debug setMintPrice preparation
  useEffect(() => {
    if (newMintPrice && isOwner) {
      const priceInWei = BigInt(Math.floor(parseFloat(newMintPrice) * 1e18));
      console.log('🔍 setMintPrice preparation:', {
        newMintPrice,
        priceInWei: priceInWei.toString(),
        isOwner,
        enabled: Boolean(isOwner && newMintPrice && !isNaN(parseFloat(newMintPrice))),
        error: setPriceError
      });
    }
  }, [newMintPrice, isOwner, setPriceError]);

  const { write: setPrice, isLoading: isSetPriceLoading } = useContractWrite({
    ...setPriceConfig,
    onSuccess: () => {
      setIsUpdatingPrice(false);
      setNewMintPrice('');
      setMintStatus('Mint price updated successfully!');
      // Refresh contract data after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error) => {
      setIsUpdatingPrice(false);
      setMintStatus(`Error updating mint price: ${error.message}`);
    }
  });

  // Withdraw funds
  const { config: withdrawConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    functionName: 'withdraw',
    enabled: isOwner
  });

  const { write: withdraw, isLoading: isWithdrawLoading } = useContractWrite({
    ...withdrawConfig,
    onSuccess: () => {
      setMintStatus('✅ Funds withdrawn successfully!');
      setIsWithdrawing(false);
    },
    onError: (error) => {
      setMintStatus(`❌ Failed to withdraw funds: ${error.message}`);
      setIsWithdrawing(false);
    }
  });

  // Note: Owner mint function is not available on these contracts
  // The contracts only have standard ERC-721 transfer functions:
  // - approve, safeTransferFrom, setApprovalForAll, transferFrom

  // Owner mint debug removed - function not available

  // Owner mint function not available on these contracts

  // Withdraw specific amount function not available on these contracts

  // Pro: Set Token Metadata functionality removed - not available on these contracts

  // Toggle on-chain storage functionality removed - not available on these contracts

  // Pro-specific: Set royalty recipient
  const { config: setRoyaltyRecipientConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [{"internalType": "address", "name": "newRecipient", "type": "address"}],
      "name": "setRoyaltyRecipient",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    functionName: 'setRoyaltyRecipient',
    args: [royaltyRecipient as `0x${string}`],
    enabled: isOwner && royaltyRecipient.length > 0
  });

  const { write: setRoyaltyRecipientContract, isLoading: isSetRoyaltyRecipientLoading } = useContractWrite({
    ...setRoyaltyRecipientConfig,
    onSuccess: (data) => {
      console.log('✅ Royalty recipient set successfully!', data);
      setMintStatus(`✅ Royalty recipient set to ${royaltyRecipient}! Now setting fee...`);
      // After setting recipient, set the fee
      setTimeout(() => {
        setRoyaltyFeeContract?.();
      }, 1000); // Small delay to ensure first transaction is processed
    },
    onError: (error) => {
      console.error('❌ Failed to set royalty recipient:', error);
      setMintStatus(`❌ Failed to set royalty recipient: ${error.message}`);
      setIsSettingRoyalty(false);
    }
  });

  // Pro-specific: Set royalty fee
  const { config: setRoyaltyFeeConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [{"internalType": "uint96", "name": "feeNumerator", "type": "uint96"}],
      "name": "setRoyaltyFee",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    functionName: 'setRoyaltyFee',
    args: [BigInt(Math.floor(parseFloat(royaltyPercentage || '0') * 100))], // Convert percentage to basis points
    enabled: isOwner && royaltyPercentage.length > 0 && !isNaN(parseFloat(royaltyPercentage))
  });

  const { write: setRoyaltyFeeContract, isLoading: isSetRoyaltyFeeLoading } = useContractWrite({
    ...setRoyaltyFeeConfig,
    onSuccess: (data) => {
      console.log('✅ Royalty fee set successfully!', data);
      setMintStatus(`✅ Royalty set successfully! ${royaltyPercentage}% to ${royaltyRecipient}`);
      setRoyaltyRecipient('');
      setRoyaltyPercentage('');
      setIsSettingRoyalty(false);
    },
    onError: (error) => {
      console.error('❌ Failed to set royalty fee:', error);
      setMintStatus(`❌ Failed to set royalty fee: ${error.message}`);
      setIsSettingRoyalty(false);
    }
  });

  // Contract write hook for setting base URI (since this is a basic contract, not editions)
  const metadataBaseURI = `https://gen-plasma.com/api/metadata/collection/${contractAddress}/`;
  const { config: setBaseURIConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [{"internalType": "string", "name": "newBaseURI", "type": "string"}],
      "name": "setBaseURI",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    functionName: 'setBaseURI',
    args: [metadataBaseURI],
    enabled: isOwner
  });

  const { write: setBaseURI, isLoading: isSetBaseURILoading } = useContractWrite({
    ...setBaseURIConfig,
    onSuccess: () => {
      setMintStatus('Base URI updated successfully! All collectibles will now use your custom artwork!');
      console.log('Base URI set to:', contractInfo?.collectionImage);
    },
    onError: (error) => {
      setMintStatus(`Error setting base URI: ${error.message}`);
      console.error('Base URI error:', error);
    }
  });

  // Dynamic contract write function for setting IPFS base URI
  const [dynamicBaseURI, setDynamicBaseURI] = useState<string>('');
  const { config: dynamicSetBaseURIConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: [{
      "inputs": [{"internalType": "string", "name": "newBaseURI", "type": "string"}],
      "name": "setBaseURI",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    functionName: 'setBaseURI',
    args: [dynamicBaseURI],
    enabled: isOwner && dynamicBaseURI !== ''
  });

  const { write: executeSetDynamicBaseURI, isLoading: isSetDynamicBaseURILoading } = useContractWrite({
    ...dynamicSetBaseURIConfig,
    onSuccess: (data) => {
      setMintStatus('✅ Collectible Metadata Fixed! Contract updated with IPFS metadata.');
      console.log('✅ Contract write successful!');
      console.log('✅ Transaction hash:', data.hash);
      console.log('✅ Dynamic Base URI set to:', dynamicBaseURI);
      setDynamicBaseURI(''); // Clear after success
      setPendingMetadataBaseURI(''); // Clear pending base URI
    },
    onError: (error) => {
      setMintStatus(`Error setting IPFS base URI: ${error.message}`);
      console.error('❌ Contract write error:', error);
      console.error('❌ Error details:', error.message, error.stack);
      setDynamicBaseURI(''); // Clear on error
    }
  });


  // Trigger contract write when dynamic base URI is set
  useEffect(() => {
    if (dynamicBaseURI && executeSetDynamicBaseURI && !isSetDynamicBaseURILoading && isOwner) {
      console.log('🔧 Triggering contract write with metadata base URI:', dynamicBaseURI);
      console.log('🔧 Contract address:', contractAddress);
      console.log('🔧 Is owner:', isOwner);
      console.log('🔧 Is loading:', isSetDynamicBaseURILoading);
      console.log('🔧 Execute function available:', !!executeSetDynamicBaseURI);
      
      try {
        executeSetDynamicBaseURI();
        console.log('✅ Contract write function called successfully');
      } catch (error) {
        console.error('❌ Error executing contract write:', error);
        setMintStatus(`Contract write failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setDynamicBaseURI(''); // Clear on error
      }
    } else {
      console.log('🚫 Contract write conditions not met:', {
        dynamicBaseURI: !!dynamicBaseURI,
        executeSetDynamicBaseURI: !!executeSetDynamicBaseURI,
        isSetDynamicBaseURILoading,
        isOwner
      });
    }
  }, [dynamicBaseURI, executeSetDynamicBaseURI, isSetDynamicBaseURILoading, isOwner, contractAddress]);

  // Load mint page settings and featured status when page loads
  useEffect(() => {
    loadMintPageSettings();
    loadFeaturedStatus();
  }, [contractAddress]);

  // Load whitelist groups from Supabase on page load
  useEffect(() => {
    const loadWhitelistGroups = async () => {
      try {
        console.log('🔍 Loading whitelist groups from Supabase...');
        const response = await fetch(`/api/whitelist/get-groups?contractAddress=${contractAddress}`);
        const data = await response.json();
        
        if (data.success && data.groups) {
          setWhitelistGroups(data.groups);
          
          // Set the first group as current if none is selected
          const groupIds = Object.keys(data.groups);
          if (groupIds.length > 0 && !currentGroupId) {
            setCurrentGroupId(groupIds[0]);
          }
          
          console.log('✅ Whitelist groups loaded from Supabase:', Object.keys(data.groups).length, 'groups');
        } else {
          console.log('📝 No whitelist groups found in Supabase, starting with empty state');
          setWhitelistGroups({});
        }
      } catch (error) {
        console.error('❌ Error loading whitelist groups from Supabase:', error);
        // Fallback to localStorage if Supabase fails
        try {
          const savedGroups = localStorage.getItem(`whitelist-groups-${contractAddress}`);
          if (savedGroups) {
            const parsedGroups = JSON.parse(savedGroups);
            setWhitelistGroups(parsedGroups);
            console.log('✅ Fallback: Whitelist groups loaded from localStorage:', Object.keys(parsedGroups).length, 'groups');
          }
        } catch (localError) {
          console.error('❌ Fallback localStorage also failed:', localError);
        }
      }
    };

    loadWhitelistGroups();
  }, [contractAddress]);

  // Save whitelist groups to Supabase whenever they change
  const saveWhitelistGroupsToSupabase = async (groups: {[key: string]: {
    title: string, 
    addresses: string[],
    mintStartTime?: string,
    mintEndTime?: string,
    timezone?: string,
    isTimeScheduled?: boolean
  }}) => {
    try {
      for (const [groupId, group] of Object.entries(groups)) {
        await fetch('/api/whitelist/save-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress,
            groupId,
            groupTitle: group.title,
            addresses: group.addresses,
            createdBy: address,
            mintStartTime: group.mintStartTime,
            mintEndTime: group.mintEndTime,
            timezone: group.timezone,
            isTimeScheduled: group.isTimeScheduled
          })
        });
      }
      console.log('✅ Whitelist groups saved to Supabase:', Object.keys(groups).length, 'groups');
    } catch (error) {
      console.error('❌ Error saving whitelist groups to Supabase:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem(`whitelist-groups-${contractAddress}`, JSON.stringify(groups));
        console.log('✅ Fallback: Whitelist groups saved to localStorage');
      } catch (localError) {
        console.error('❌ Fallback localStorage also failed:', localError);
      }
    }
  };

  // Save whitelist groups to Supabase whenever they change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.keys(whitelistGroups).length > 0) {
        saveWhitelistGroupsToSupabase(whitelistGroups);
      }
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(timeoutId);
  }, [whitelistGroups, contractAddress, address]);

  // Admin functions
  const handleToggleMinting = () => {
    if (!isOwner) return;
    setIsTogglingMinting(true);
    setMintingActive?.();
  };

  const handleUpdatePrice = () => {
    console.log('🔍 handleUpdatePrice called:', {
      isOwner,
      newMintPrice,
      hasNewMintPrice: newMintPrice.length > 0,
      setPriceFunction: !!setPrice,
      setPriceError
    });
    
    if (!isOwner || !newMintPrice.length) {
      console.log('❌ Cannot update price - missing requirements');
      return;
    }
    
    if (setPriceError) {
      console.log('❌ setPrice preparation error:', setPriceError);
      setMintStatus(`Error preparing price update: ${setPriceError.message}`);
      return;
    }
    
    if (!setPrice) {
      console.log('❌ setPrice function not available');
      setMintStatus('Error: Price update function not available');
      return;
    }
    
    console.log('✅ Calling setPrice function');
    setIsUpdatingPrice(true);
    setPrice();
  };

  const handleWithdrawFunds = () => {
    if (!isOwner) return;
    setIsWithdrawing(true);
    withdraw?.();
  };

  // Owner mint handler removed - function not available on contracts

  // Withdraw specific amount handler removed - function not available

  // Pro: Set Token Metadata handler removed - function not available

  // Toggle on-chain storage handler removed - function not available

  const handleSetRoyalty = () => {
    if (!isOwner || !royaltyRecipient.length || !royaltyPercentage.length) return;
    console.log('🔧 Setting royalty:', { royaltyRecipient, royaltyPercentage });
    console.log('🔧 Contract address:', contractAddress);
    console.log('🔧 Is owner:', isOwner);
    console.log('🔧 Set royalty recipient function available:', !!setRoyaltyRecipientContract);
    console.log('🔧 Set royalty fee function available:', !!setRoyaltyFeeContract);
    setIsSettingRoyalty(true);
    
    // First set the royalty recipient, then the fee
    setRoyaltyRecipientContract?.();
  };

  // Editions: Artwork Metadata handler removed - functionality not implemented

  // Whitelisting handlers
  const handleCreateGroup = () => {
    if (!newGroupTitle.trim()) {
      setMintStatus('❌ Please enter a group title');
      return;
    }

    const groupId = Date.now().toString();
    const newGroup = {
      title: newGroupTitle.trim(),
      addresses: [],
      mintStartTime: undefined,
      mintEndTime: undefined,
      timezone: 'UTC',
      isTimeScheduled: false
    };

    setWhitelistGroups(prev => ({
      ...prev,
      [groupId]: newGroup
    }));

    setCurrentGroupId(groupId);
    setNewGroupTitle('');
    setMintStatus(`✅ Created whitelist group: ${newGroup.title}. Now add addresses and configure scheduling.`);
  };

  const handleSelectGroup = (groupId: string) => {
    setCurrentGroupId(groupId);
    
    // Load the selected group's time scheduling settings for editing
    const selectedGroup = whitelistGroups[groupId];
    if (selectedGroup) {
      setEditingGroupMintStartTime(selectedGroup.mintStartTime || '');
      setEditingGroupMintEndTime(selectedGroup.mintEndTime || '');
      setEditingGroupTimezone(selectedGroup.timezone || 'UTC');
      setEditingGroupTimeScheduled(selectedGroup.isTimeScheduled || false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const groupTitle = whitelistGroups[groupId]?.title || 'Unknown';
    
    try {
      // Delete from Supabase
      const response = await fetch(`/api/whitelist/delete-group?contractAddress=${contractAddress}&groupId=${groupId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ Group deleted from Supabase');
      } else {
        console.warn('⚠️ Failed to delete group from Supabase, continuing with local delete');
      }
    } catch (error) {
      console.error('❌ Error deleting group from Supabase:', error);
    }
    
    // Update local state
    setWhitelistGroups(prev => {
      const newGroups = { ...prev };
      delete newGroups[groupId];
      return newGroups;
    });
    
    if (currentGroupId === groupId) {
      const remainingGroups = Object.keys(whitelistGroups).filter(id => id !== groupId);
      setCurrentGroupId(remainingGroups[0] || '');
    }
    
    setMintStatus(`✅ Deleted whitelist group: ${groupTitle}`);
  };

  const handleAddToWhitelist = async () => {
    if (!isOwner || !whitelistAddress.trim() || !currentGroupId) return;
    
    setIsAddingToWhitelist(true);
    try {
      // Validate Ethereum address format
      if (!whitelistAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        setMintStatus('❌ Invalid Ethereum address format');
        return;
      }

      const currentGroup = whitelistGroups[currentGroupId];
      if (!currentGroup) {
        setMintStatus('❌ No whitelist group selected');
        return;
      }

      // Add to current group
      if (!currentGroup.addresses.includes(whitelistAddress.toLowerCase())) {
        setWhitelistGroups(prev => ({
          ...prev,
          [currentGroupId]: {
            ...prev[currentGroupId],
            addresses: [...prev[currentGroupId].addresses, whitelistAddress.toLowerCase()]
          }
        }));
        setWhitelistAddress('');
        setMintStatus(`✅ Added ${whitelistAddress} to ${currentGroup.title}`);
      } else {
        setMintStatus('⚠️ Address already in this whitelist group');
      }
    } catch (error) {
      setMintStatus(`❌ Failed to add address to whitelist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingToWhitelist(false);
    }
  };

  const handleRemoveFromWhitelist = (address: string) => {
    if (!currentGroupId) return;
    
    const currentGroup = whitelistGroups[currentGroupId];
    if (!currentGroup) return;

    setWhitelistGroups(prev => ({
      ...prev,
      [currentGroupId]: {
        ...prev[currentGroupId],
        addresses: prev[currentGroupId].addresses.filter(addr => addr !== address)
      }
    }));
    
    setMintStatus(`✅ Removed ${address} from ${currentGroup.title}`);
  };

  const handleImportWhitelist = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportingWhitelist(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Support different JSON formats
      if (data.groups && typeof data.groups === 'object') {
        // Import multiple groups
        const importedGroups: {[key: string]: {title: string, addresses: string[]}} = {};
        
        Object.keys(data.groups).forEach(groupId => {
          const group = data.groups[groupId];
          if (group.title && Array.isArray(group.addresses)) {
            const validAddresses = group.addresses
              .filter((addr: any) => typeof addr === 'string' && addr.match(/^0x[a-fA-F0-9]{40}$/))
              .map((addr: string) => addr.toLowerCase());
            
            if (validAddresses.length > 0) {
              importedGroups[groupId] = {
                title: group.title,
                addresses: validAddresses
              };
            }
          }
        });

        if (Object.keys(importedGroups).length > 0) {
          setWhitelistGroups(prev => ({ ...prev, ...importedGroups }));
          setMintStatus(`✅ Imported ${Object.keys(importedGroups).length} whitelist groups`);
        } else {
          setMintStatus('❌ No valid whitelist groups found in file');
        }
      } else {
        // Import single group (legacy format)
        let addresses: string[] = [];
        let title = 'Imported Whitelist';
        
        if (Array.isArray(data)) {
          addresses = data;
        } else if (data.addresses && Array.isArray(data.addresses)) {
          addresses = data.addresses;
          if (data.title) title = data.title;
        } else if (data.whitelist && Array.isArray(data.whitelist)) {
          addresses = data.whitelist;
          if (data.title) title = data.title;
        }

        // Validate and filter addresses
        const validAddresses = addresses
          .filter((addr: any) => typeof addr === 'string' && addr.match(/^0x[a-fA-F0-9]{40}$/))
          .map((addr: string) => addr.toLowerCase());

        if (validAddresses.length > 0) {
          const groupId = Date.now().toString();
          setWhitelistGroups(prev => ({
            ...prev,
            [groupId]: {
              title: title,
              addresses: validAddresses
            }
          }));
          setCurrentGroupId(groupId);
          setMintStatus(`✅ Imported ${validAddresses.length} addresses to new group: ${title}`);
        } else {
          setMintStatus('❌ No valid addresses found in file');
        }
      }
    } catch (error) {
      setMintStatus(`❌ Failed to import whitelist: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
    } finally {
      setIsImportingWhitelist(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleExportWhitelist = () => {
    const data = {
      contractAddress: contractAddress,
      exportedAt: new Date().toISOString(),
      groups: whitelistGroups
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whitelist-groups-${contractAddress}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Also save to localStorage as backup
    try {
      localStorage.setItem(`whitelist-groups-${contractAddress}`, JSON.stringify(whitelistGroups));
      console.log('✅ Whitelist groups also saved to localStorage as backup');
    } catch (error) {
      console.error('Error saving backup to localStorage:', error);
    }
    
    setMintStatus('✅ Whitelist groups exported successfully');
  };

  const handleClearAllWhitelistData = async () => {
    if (confirm('Are you sure you want to clear all whitelist data for this contract? This action cannot be undone.')) {
      try {
        // Clear from Supabase
        const response = await fetch(`/api/whitelist/clear-all?contractAddress=${contractAddress}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          console.log('✅ All whitelist groups cleared from Supabase');
        } else {
          console.warn('⚠️ Failed to clear groups from Supabase, continuing with local clear');
        }
      } catch (error) {
        console.error('❌ Error clearing groups from Supabase:', error);
      }
      
      // Clear local state
      setWhitelistGroups({});
      setCurrentGroupId('');
      setNewGroupTitle('');
      setWhitelistAddress('');
      
      // Clear from localStorage as backup
      try {
        localStorage.removeItem(`whitelist-groups-${contractAddress}`);
        console.log('✅ Whitelist data cleared from localStorage');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      
      setMintStatus('✅ All whitelist data cleared');
    }
  };

  // Update time scheduling for an existing group
  const handleUpdateGroupSchedule = async () => {
    if (!currentGroupId || !whitelistGroups[currentGroupId]) {
      setMintStatus('❌ No group selected');
      return;
    }

    setIsUpdatingGroupSchedule(true);
    try {
      const updatedGroup = {
        ...whitelistGroups[currentGroupId],
        mintStartTime: editingGroupTimeScheduled ? editingGroupMintStartTime : undefined,
        mintEndTime: editingGroupTimeScheduled ? editingGroupMintEndTime : undefined,
        timezone: editingGroupTimeScheduled ? editingGroupTimezone : undefined,
        isTimeScheduled: editingGroupTimeScheduled
      };

      // Update local state
      setWhitelistGroups(prev => ({
        ...prev,
        [currentGroupId]: updatedGroup
      }));

      // Save to Supabase
      await fetch('/api/whitelist/save-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress,
          groupId: currentGroupId,
          groupTitle: updatedGroup.title,
          addresses: updatedGroup.addresses,
          createdBy: address,
          mintStartTime: updatedGroup.mintStartTime,
          mintEndTime: updatedGroup.mintEndTime,
          timezone: updatedGroup.timezone,
          isTimeScheduled: updatedGroup.isTimeScheduled
        })
      });

      setMintStatus(`✅ Updated time scheduling for ${updatedGroup.title}`);
    } catch (error) {
      setMintStatus(`❌ Failed to update time scheduling: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingGroupSchedule(false);
    }
  };

  // Check if current user can mint based on whitelist and time scheduling
  const checkMintAvailability = async () => {
    if (!address) {
      return { canMint: false, reason: 'Wallet not connected' };
    }

    // If whitelist is disabled, allow public minting
    if (!whitelistEnabled) {
      return { canMint: true, reason: 'Public minting (whitelist disabled)' };
    }

    // Check if all whitelist groups have ended - enable public minting
    if (getAllGroupsEnded()) {
      return { canMint: true, reason: 'Public minting now available' };
    }

    // If no group selected, check if user is in any active whitelist group
    if (!currentGroupId || !whitelistGroups[currentGroupId]) {
      // Check if user is in any active whitelist group
      const activeGroup = Object.entries(whitelistGroups).find(([groupId, group]) => {
        if (!group.addresses.includes(address.toLowerCase())) return false;
        
        if (!group.isTimeScheduled) return true; // Always available group
        
        const now = new Date();
        const startTime = group.mintStartTime ? new Date(group.mintStartTime) : null;
        const endTime = group.mintEndTime ? new Date(group.mintEndTime) : null;
        
        if (startTime && now < startTime) return false;
        if (endTime && now > endTime) return false;
        
        return true;
      });
      
      if (activeGroup) {
        return { canMint: true, reason: `Active in ${activeGroup[1].title}` };
      }
      
      return { canMint: false, reason: 'No active whitelist group or wallet not in whitelist' };
    }

    const currentGroup = whitelistGroups[currentGroupId];
    
    // Check if user is in the whitelist
    if (!currentGroup.addresses.includes(address.toLowerCase())) {
      return { canMint: false, reason: 'Address not in whitelist' };
    }

    // If no time scheduling, user can mint (subject to contract-level minting)
    if (!currentGroup.isTimeScheduled) {
      return { canMint: true, reason: 'No time restrictions' };
    }

    // Check time scheduling
    const now = new Date();
    const startTime = currentGroup.mintStartTime ? new Date(currentGroup.mintStartTime) : null;
    const endTime = currentGroup.mintEndTime ? new Date(currentGroup.mintEndTime) : null;

    if (startTime && now < startTime) {
      return { 
        canMint: false, 
        reason: `Minting starts at ${startTime.toLocaleString()}` 
      };
    }

    if (endTime && now > endTime) {
      return { 
        canMint: false, 
        reason: `Minting ended at ${endTime.toLocaleString()}` 
      };
    }

    return { canMint: true, reason: 'Minting is currently active' };
  };

  // Generate Merkle root for a whitelist group
  const handleGenerateMerkleRoot = async (groupId: string) => {
    if (!isOwner) return;
    
    setIsGeneratingMerkleRoot(true);
    try {
      setMintStatus('Generating Merkle root...');
      
      const response = await fetch('/api/whitelist/generate-merkle-root', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress,
          groupId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const wasAlreadyActivated = whitelistGroups[groupId]?.isActivatedOnchain;
        
        if (wasAlreadyActivated) {
          setMintStatus(`⚠️ Merkle root regenerated. You must UPDATE ON-CHAIN for changes to take effect!`);
          setNeedsMerkleUpdate(prev => ({ ...prev, [groupId]: true }));
        } else {
          setMintStatus(`✅ Merkle root generated: ${result.merkleRoot.substring(0, 10)}...`);
        }
        
        console.log('✅ Merkle root generated:', result);
        
        // Reload whitelist groups to get updated data
        const reloadResponse = await fetch(`/api/whitelist/get-groups?contractAddress=${contractAddress}`);
        const reloadData = await reloadResponse.json();
        if (reloadData.success) {
          setWhitelistGroups(reloadData.groups);
        }
      } else {
        setMintStatus(`❌ Failed to generate Merkle root: ${result.error}`);
      }
    } catch (error) {
      setMintStatus(`❌ Error generating Merkle root: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingMerkleRoot(false);
    }
  };

  // Update Merkle root on-chain for existing group
  const handleUpdateMerkleRootOnChain = async (groupId: string) => {
    if (!isOwner || !address) return;
    
    setIsUpdatingMerkleRoot(true);
    try {
      setMintStatus('Preparing Merkle root update...');
      
      // Get the updated Merkle root from database
      const proofResponse = await fetch(
        `/api/whitelist/get-groups?contractAddress=${contractAddress}`
      );
      const groupsData = await proofResponse.json();
      const groupData = groupsData.groups?.[groupId];
      
      if (!groupData || !groupData.merkleRoot) {
        setMintStatus('❌ Merkle root not found.');
        setIsUpdatingMerkleRoot(false);
        return;
      }
      
      const merkleRoot = groupData.merkleRoot as `0x${string}`;
      const groupIdNumber = BigInt(parseInt(groupId.replace(/\D/g, '')) || 0);
      
      console.log('🔄 Updating Merkle root on-chain:', {
        groupId: groupIdNumber.toString(),
        merkleRoot
      });
      
      // Set state for contract write hook
      setUpdateGroupId(groupIdNumber);
      setUpdateMerkleRoot(merkleRoot);
      
      setMintStatus('Please sign the transaction to update Merkle root on-chain...');
      
    } catch (error) {
      setMintStatus(`❌ Error updating Merkle root: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUpdatingMerkleRoot(false);
    }
  };

  // Activate whitelist group on-chain
  const handleActivateOnChain = async (groupId: string) => {
    if (!isOwner || !address) return;
    
    setIsActivatingOnChain(true);
    try {
      setMintStatus('Preparing whitelist activation...');
      
      // First, get the Merkle root and time settings
      const group = whitelistGroups[groupId];
      if (!group) {
        setMintStatus('❌ Group not found');
        setIsActivatingOnChain(false);
        return;
      }
      
      // Get Merkle root from database
      const proofResponse = await fetch(
        `/api/whitelist/get-groups?contractAddress=${contractAddress}`
      );
      const groupsData = await proofResponse.json();
      const groupData = groupsData.groups?.[groupId];
      
      if (!groupData || !groupData.merkleRoot) {
        setMintStatus('❌ Merkle root not found. Generate it first.');
        setIsActivatingOnChain(false);
        return;
      }
      
      // Prepare activation parameters
      const merkleRoot = groupData.merkleRoot as `0x${string}`;
      const startTime = groupData.mintStartTime 
        ? BigInt(Math.floor(new Date(groupData.mintStartTime).getTime() / 1000))
        : BigInt(0);
      const endTime = groupData.mintEndTime 
        ? BigInt(Math.floor(new Date(groupData.mintEndTime).getTime() / 1000))
        : BigInt(0);
      
      console.log('🚀 Activating whitelist on-chain with:', {
        merkleRoot,
        startTime: startTime.toString(),
        endTime: endTime.toString()
      });
      
      // Set the state for the contract write hook
      // The useEffect will auto-trigger when these states change
      setActivationMerkleRoot(merkleRoot);
      setActivationStartTime(startTime);
      setActivationEndTime(endTime);
      
      setMintStatus('Preparing transaction to activate whitelist on-chain...');
      
    } catch (error) {
      setMintStatus(`❌ Error activating on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsActivatingOnChain(false);
    }
  };

  // Check if all whitelist groups have ended (for public minting)
  const getAllGroupsEnded = () => {
    const now = new Date();
    const scheduledGroups = Object.values(whitelistGroups).filter(group => group.isTimeScheduled);
    
    if (scheduledGroups.length === 0) {
      return false; // No scheduled groups, so not all ended
    }
    
    return scheduledGroups.every(group => {
      if (!group.mintEndTime) return false; // Group has no end time
      return new Date(group.mintEndTime) < now;
    });
  };

  // Check mint availability for a specific group (for display cards)
  const getGroupMintStatus = (group: any) => {
    if (!contractInfo?.mintingActive) {
      return { canMint: false, status: 'Contract minting paused', statusColor: 'gray' };
    }

    if (!group.isTimeScheduled) {
      return { canMint: true, status: 'Always available', statusColor: 'green' };
    }

    const now = new Date();
    const startTime = group.mintStartTime ? new Date(group.mintStartTime) : null;
    const endTime = group.mintEndTime ? new Date(group.mintEndTime) : null;

    if (startTime && now < startTime) {
      return { 
        canMint: false, 
        status: `Starts ${startTime.toLocaleDateString()} ${startTime.toLocaleTimeString()}`,
        statusColor: 'yellow'
      };
    }

    if (endTime && now > endTime) {
      return { 
        canMint: false, 
        status: `Ended ${endTime.toLocaleDateString()} ${endTime.toLocaleTimeString()}`,
        statusColor: 'red'
      };
    }

    return { canMint: true, status: 'Mint active now', statusColor: 'green' };
  };

  // Transfer ownership function
  // Transfer ownership functionality removed - not available on these contracts

  const handleUpdatePageDescription = async () => {
    if (!isOwner || !pageDescription.trim()) return;
    setIsUpdatingDescription(true);
    try {
      const response = await fetch('/api/mint-page/update-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress,
          description: pageDescription.trim()
        })
      });
      
      if (response.ok) {
        setMintStatus('✅ Page description updated successfully!');
      } else {
        const error = await response.json();
        setMintStatus(`❌ Failed to update description: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating page description:', error);
      setMintStatus('❌ Failed to update page description');
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  const handleUpdatePageBackground = async () => {
    if (!isOwner) return;
    setIsUpdatingBackground(true);
    try {
      const response = await fetch('/api/mint-page/update-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress,
          background: pageBackground
        })
      });
      
      if (response.ok) {
        setMintStatus('✅ Page background updated successfully!');
      } else {
        const error = await response.json();
        setMintStatus(`❌ Failed to update background: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating page background:', error);
      setMintStatus('❌ Failed to update page background');
    } finally {
      setIsUpdatingBackground(false);
    }
  };

  const handleUpdateSocialLinks = async () => {
    if (!isOwner) return;
    setIsUpdatingSocialLinks(true);
    try {
      console.log('🔧 Updating social links:', {
        contractAddress,
        websiteUrl: websiteUrl.trim(),
        xProfileUrl: xProfileUrl.trim()
      });
      
      const response = await fetch('/api/mint-page/update-social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress,
          websiteUrl: websiteUrl.trim(),
          xProfileUrl: xProfileUrl.trim()
        })
      });
      
      console.log('📡 Social links API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Social links updated successfully:', result);
        setMintStatus('✅ Social links updated successfully!');
        
        // Reload settings to ensure UI is updated
        setTimeout(() => {
          loadMintPageSettings();
        }, 500);
      } else {
        const error = await response.json();
        console.error('❌ Social links update failed:', error);
        setMintStatus(`❌ Failed to update social links: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Error updating social links:', error);
      setMintStatus('❌ Failed to update social links');
    } finally {
      setIsUpdatingSocialLinks(false);
    }
  };

  const toggleFeatured = async () => {
    if (!address) return;
    setIsTogglingFeatured(true);
    try {
      console.log('⭐ Toggling featured status for contract:', contractAddress);
      
      const response = await fetch('/api/admin/toggle-featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress,
          userAddress: address
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Featured status updated:', result);
        setIsFeatured(result.featured);
        setMintStatus(`✅ ${result.message}`);
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setMintStatus('');
        }, 3000);
      } else {
        const error = await response.json();
        console.error('❌ Failed to toggle featured status:', error);
        setMintStatus(`❌ Failed to update featured status: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Error toggling featured status:', error);
      setMintStatus('❌ Failed to update featured status');
    } finally {
      setIsTogglingFeatured(false);
    }
  };

  const loadFeaturedStatus = async () => {
    try {
      console.log('🔍 Loading featured status for contract:', contractAddress);
      const response = await fetch(`/api/admin/get-featured-status?contractAddress=${contractAddress}`);
      
      if (response.ok) {
        const result = await response.json();
        setIsFeatured(result.featured);
        console.log('✅ Featured status loaded:', result.featured);
      } else {
        console.error('❌ Failed to load featured status');
      }
    } catch (error) {
      console.error('❌ Error loading featured status:', error);
    }
  };

  const updateContractType = async () => {
    if (!address) return;
    setIsUpdatingContractType(true);
    try {
      console.log('🔧 Updating contract type for:', contractAddress, 'to:', contractTypeOverride);
      
      const response = await fetch('/api/admin/update-contract-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress,
          contractType: contractTypeOverride,
          userAddress: address
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Contract type updated:', result);
        setMintStatus(`✅ Contract type updated to ${contractTypeOverride.toUpperCase()}`);
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setMintStatus('');
        }, 3000);
      } else {
        const error = await response.json();
        console.error('❌ Failed to update contract type:', error);
        setMintStatus(`❌ Failed to update contract type: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Error updating contract type:', error);
      setMintStatus('❌ Failed to update contract type');
    } finally {
      setIsUpdatingContractType(false);
    }
  };

  const loadMintPageSettings = async () => {
    setIsLoadingSettings(true);
    try {
      console.log('🔍 Loading mint page settings for contract:', contractAddress);
      const response = await fetch(`/api/mint-page/get-settings?contractAddress=${contractAddress}`);
      console.log('📡 Settings API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📄 Settings data received:', result);
        
        if (result.settings) {
          setPageDescription(result.settings.page_description || '');
          setPageBackground(result.settings.page_background || 'gradient-purple-blue');
          setWebsiteUrl(result.settings.website_url || '');
          setXProfileUrl(result.settings.x_profile_url || '');
          
          console.log('✅ Settings loaded:', {
            description: result.settings.page_description,
            background: result.settings.page_background,
            website: result.settings.website_url,
            xProfile: result.settings.x_profile_url
          });
        } else {
          console.log('⚠️ No settings found, using defaults');
        }
      } else {
        console.error('❌ Settings API failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error loading mint page settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const getBackgroundClass = () => {
    switch (pageBackground) {
      // Animated background (special case)
      case 'animated-plasma':
        return 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';
      // Gradients
      case 'gradient-purple-blue':
        return 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';
      case 'gradient-blue-green':
        return 'bg-gradient-to-br from-blue-900 via-cyan-900 to-green-900';
      case 'gradient-purple-pink':
        return 'bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900';
      case 'gradient-orange-red':
        return 'bg-gradient-to-br from-orange-900 via-red-900 to-pink-900';
      case 'gradient-green-teal':
        return 'bg-gradient-to-br from-green-900 via-teal-900 to-cyan-900';
      case 'gradient-indigo-purple':
        return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900';
      // Dark solid colors
      case 'solid-dark-black':
        return 'bg-gray-900';
      case 'solid-dark-navy':
        return 'bg-slate-900';
      case 'solid-dark-charcoal':
        return 'bg-zinc-900';
      default:
        return 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';
    }
  };

  const shouldShowAnimatedBackground = useMemo(() => {
    const isAnimated = pageBackground === 'animated-plasma';
    console.log('🎨 Background check:', { pageBackground, isAnimated });
    return isAnimated;
  }, [pageBackground]);

  const handleSetBaseURI = () => {
    if (!isOwner) return;
    setBaseURI?.();
  };


  // Collection image upload functions (permanent IPFS storage)
  const handleCollectionImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size client-side first
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setMintStatus(`File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum allowed: 10MB`);
      event.target.value = ''; // Clear the input
      return;
    }
    
    // Immediately start upload
    setIsUploadingCollectionImage(true);
    setMintStatus('Uploading collection image...');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('contractAddress', contractAddress);
      
      const response = await fetch('/api/upload-mint-banner', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setMintStatus('Mint banner uploaded successfully!');
        
        // Update the contract info with the new banner immediately
        setContractInfo(prev => prev ? {
          ...prev,
          collectionImage: result.bannerUrl
        } : null);
        
        console.log('✅ Mint banner uploaded and set:', result.bannerUrl);
        console.log('🔄 Contract info updated with new banner');
        setIsLoadingCollectionImage(false);
        
        // Test if the banner persists by refetching after a short delay
        setTimeout(async () => {
          console.log('🧪 Testing persistence - refetching mint banner...');
          const persistedBanner = await fetchMintBanner(contractAddress);
          if (persistedBanner && persistedBanner === result.bannerUrl) {
            console.log('✅ Banner persistence confirmed');
          } else {
            console.log('❌ Banner persistence failed - got different banner:', persistedBanner);
          }
        }, 2000);
      } else {
        // Try to get error details
        let errorMessage = `Upload failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          try {
            const errorText = await response.text();
            errorMessage = `Upload failed: ${errorText.substring(0, 100)}...`;
          } catch (textError) {
            errorMessage = `Upload failed: Could not parse error response`;
          }
        }
        setMintStatus(`Mint banner upload failed: ${errorMessage}`);
        setIsLoadingCollectionImage(false);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setMintStatus(`Mint banner upload failed: ${error.message || error}`);
      setIsLoadingCollectionImage(false);
    } finally {
      setIsUploadingCollectionImage(false);
      // Clear the input
      event.target.value = '';
    }
  };


  // NFT metadata image upload functions (temporary storage for metadata fix)
  const handleMetadataImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMetadataImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setMetadataImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFixNFTMetadata = async () => {
    if (!selectedMetadataImage || !isOwner) {
      setMintStatus('Please select a metadata image first');
      return;
    }
    
    setIsUploadingMetadataImage(true);
    setMintStatus('Uploading metadata image to IPFS...');
    
    try {
      // Step 1: Upload image to IPFS
      const formData = new FormData();
      formData.append('image', selectedMetadataImage);
      formData.append('contractAddress', contractAddress);
      
      const uploadResponse = await fetch('/api/upload-metadata-image', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      
      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || 'IPFS upload failed');
      }
      
      setMintStatus('Image uploaded to IPFS! Now applying metadata to contract...');
      
      // Step 2: Set the dynamic base URI to point to our metadata API
      // The contract base URI should point to our API, not directly to IPFS
      const metadataBaseURI = `https://gen-plasma.com/api/metadata/basic/${contractAddress}/`;
      
      // Set the dynamic base URI which will enable the contract write function
      setDynamicBaseURI(metadataBaseURI);
      
      // Store the pending base URI for manual trigger if needed
      setPendingMetadataBaseURI(metadataBaseURI);
      
      // Clear the selected image after initiating the transaction
      setSelectedMetadataImage(null);
      setMetadataImagePreview(null);
      setSelectedTokenId('');
      
      // The contract transaction will be triggered automatically when dynamicBaseURI is set
      setMintStatus('IPFS upload complete! Contract transaction initiated...');
      
    } catch (error: any) {
      setMintStatus(`Fix Collectible Metadata failed: ${error.message}`);
    } finally {
      setIsUploadingMetadataImage(false);
    }
  };

  // Manual trigger for contract write if automatic trigger fails
  const handleManualContractWrite = () => {
    console.log('🔧 Manual contract write triggered');
    console.log('🔧 Pending base URI:', pendingMetadataBaseURI);
    console.log('🔧 Execute function available:', !!executeSetDynamicBaseURI);
    console.log('🔧 Is owner:', isOwner);
    console.log('🔧 Contract address:', contractAddress);
    
    if (pendingMetadataBaseURI && executeSetDynamicBaseURI && isOwner) {
      console.log('✅ Manual contract write conditions met, setting dynamic base URI');
      setDynamicBaseURI(pendingMetadataBaseURI);
    } else {
      console.log('❌ Manual contract write conditions not met');
      setMintStatus('Manual trigger failed: Missing requirements');
    }
  };

  // Check if user is on the correct network
  const isOnPlasmaMainnet = chain?.id === 9745;
  const isOnPlasmaTestnet = chain?.id === 9746;
  const isOnCorrectNetwork = isOnPlasmaMainnet || isOnPlasmaTestnet;

  if (isLoading) {
    return (
      <div className={`min-h-screen ${shouldShowAnimatedBackground ? 'bg-black' : getBackgroundClass()} flex items-center justify-center`}>
        {shouldShowAnimatedBackground && <AnimatedBackground />}
        <div className="relative z-10 text-white text-xl">Loading contract information...</div>
      </div>
    );
  }

  // Show network warning if not on Plasma
  if (isConnected && !isOnCorrectNetwork) {
    return (
      <div className={`min-h-screen ${shouldShowAnimatedBackground ? 'bg-black' : getBackgroundClass()}`}>
        {shouldShowAnimatedBackground && <AnimatedBackground />}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-black/50 backdrop-blur-lg rounded-3xl p-8 max-w-md mx-4 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Wrong Network</h1>
            <p className="text-white mb-6">
              You're connected to {chain?.name || 'Unknown Network'}. 
              Please switch to Plasma Mainnet to interact with this contract.
            </p>
            {switchNetwork && (
              <button
                onClick={() => switchNetwork(9745)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Switch to Plasma Mainnet
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${shouldShowAnimatedBackground ? 'bg-black' : getBackgroundClass()}`}>
      {shouldShowAnimatedBackground && (
        <>
          <AnimatedBackground key="animated-bg" />
          {/* Debug info for animated background */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
              Animated Background Active
            </div>
          )}
        </>
      )}
      
      <div className="relative z-10 bg-transparent">
        <Header />
        
        <main className="container mx-auto px-4 py-8 bg-transparent">
          <div className="max-w-6xl mx-auto">
            {/* Header Section - Art-focused for editions */}
            <div className="text-center mb-12">
              {/* Collection Image - Large for editions */}
              <div className="mb-8">
                {isLoadingCollectionImage ? (
                  <div className="w-full max-w-4xl mx-auto rounded-3xl bg-gray-800/50 border-4 border-white/20 flex items-center justify-center" style={{ aspectRatio: '16/9', maxHeight: '600px' }}>
                    <div className="text-white text-lg">Loading collection image...</div>
                  </div>
                ) : contractInfo?.collectionImage ? (
                  <img
                    src={contractInfo.collectionImage}
                    alt={`${contractInfo.name} Collection`}
                    className="w-full max-w-4xl mx-auto rounded-3xl object-cover shadow-2xl border-4 border-white/20"
                    style={{ aspectRatio: '16/9', maxHeight: '600px' }}
                    onLoad={() => console.log('Image loaded successfully:', contractInfo.collectionImage)}
                    onError={(e) => console.error('Image failed to load:', contractInfo.collectionImage, e)}
                  />
                ) : (
                  <div className="w-full max-w-4xl mx-auto rounded-3xl bg-gray-800/50 border-4 border-white/20 flex items-center justify-center" style={{ aspectRatio: '16/9', maxHeight: '600px' }}>
                    <div className="text-white text-lg">No collection image uploaded yet</div>
                  </div>
                )}
              </div>
              
              <h1 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-forest-400 to-emerald-600">
                {contractInfo?.name}
              </h1>
              
            </div>

            {/* Page Description and Collection Info - Side by side layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Page Description - Takes up 2/3 of the space */}
              {pageDescription ? (
                <div className="lg:col-span-2">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 h-full relative">
                    <h3 className="text-2xl font-semibold text-white mb-4">About This Collection</h3>
                    <p className="text-white/90 text-lg leading-relaxed pr-20">
                      {pageDescription}
                    </p>
                    
                    {/* Social Links Icons - Bottom Right */}
                    {(websiteUrl || xProfileUrl) && (
                      <div className="absolute bottom-4 right-4 flex space-x-3">
                        {websiteUrl && (
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                            title="Visit Website"
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                          </a>
                        )}
                        {xProfileUrl && (
                          <a
                            href={xProfileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                            title="Follow on X"
                          >
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="lg:col-span-2">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 h-full flex items-center justify-center relative">
                    <p className="text-white/60 text-lg text-center">
                      No description added yet. Use the admin panel to add a custom page description.
                    </p>
                    
                    {/* Social Links Icons - Bottom Right (even when no description) */}
                    {(websiteUrl || xProfileUrl) && (
                      <div className="absolute bottom-4 right-4 flex space-x-3">
                        {websiteUrl && (
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                            title="Visit Website"
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                          </a>
                        )}
                        {xProfileUrl && (
                          <a
                            href={xProfileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                            title="Follow on X"
                          >
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Collection Information - Takes up 1/3 of the space */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-white mb-4 text-center">Collection Details</h2>
                
                <div className="space-y-4">
                <div>
                  <label className="text-blue-200 text-sm">Symbol</label>
                  <p className="text-white font-medium">{contractInfo?.symbol}</p>
                </div>
                <div>
                  <label className="text-blue-200 text-sm">Total Supply</label>
                  <p className="text-white font-medium">
                    {contractInfo?.totalSupply} / {contractInfo?.maxSupply}
                  </p>
                </div>
                <div>
                  <label className="text-blue-200 text-sm">Mint Price</label>
                  <p className="text-white font-medium">{contractInfo?.mintPrice} XPL</p>
                </div>
                <div>
                  <label className="text-blue-200 text-sm">Status</label>
                  <p className={`font-medium ${contractInfo?.mintingActive ? 'text-green-400' : 'text-red-400'}`}>
                    {contractInfo?.mintingActive ? 'Minting Active' : 'Minting Paused'}
                  </p>
                </div>
                <div>
                  <label className="text-blue-200 text-sm block mb-2">Contract Address</label>
                  <a 
                    href={`https://plasmascan.to/address/${contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-medium text-sm break-all underline decoration-dotted hover:decoration-solid transition-all"
                  >
                    {contractAddress}
                  </a>
                </div>
                <div>
                  <label className="text-blue-200 text-sm block mb-2">Network</label>
                  {isConnected ? (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      isOnPlasmaMainnet 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : isOnPlasmaTestnet
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {isOnPlasmaMainnet ? '🟢  Plasma Mainnet' : isOnPlasmaTestnet ? '🟡  Plasma Testnet' : `🔴  ${chain?.name || 'Unknown Network'}`}
                    </span>
                  ) : (
                    <p className="text-gray-400 text-sm">Not connected</p>
                  )}
                </div>
                </div>
              </div>
            </div>

            {/* Featured Collection Admin Panel - Only for Admin/Treasury Address */}
            {address && address.toLowerCase().trim() === '0x36d7885524c591eda18cf678b49a09772e89db5c' && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6 mb-8">
                <div className="space-y-6">
                  {/* Featured Status Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl text-green-400">✓</div>
                      <div>
                        <h3 className="text-xl font-semibold text-yellow-300">Featured Collection</h3>
                        <p className="text-yellow-200/80 text-sm">Feature this collection on the explore page</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleFeatured}
                      disabled={isTogglingFeatured}
                      className="flex items-center space-x-2 px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-yellow-300 font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      {isTogglingFeatured ? (
                        <>
                          <div className="w-5 h-5 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">{isFeatured ? '✓' : '○'}</span>
                          <span>{isFeatured ? 'Unfeature' : 'Feature'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Contract Type Override Section */}
                  <div className="border-t border-yellow-500/30 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl text-blue-400">🏷️</div>
                        <div>
                          <h4 className="text-lg font-semibold text-blue-300">Contract Type Override</h4>
                          <p className="text-blue-200/80 text-sm">Override the contract type shown on explore page</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <select
                          value={contractTypeOverride}
                          onChange={(e) => setContractTypeOverride(e.target.value as 'basic' | 'pro' | 'editions' | 'custom')}
                          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                          style={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            color: 'white'
                          }}
                        >
                          <option value="basic" style={{ backgroundColor: '#1f2937', color: 'white' }}>Basic</option>
                          <option value="pro" style={{ backgroundColor: '#1f2937', color: 'white' }}>Pro</option>
                          <option value="editions" style={{ backgroundColor: '#1f2937', color: 'white' }}>Editions</option>
                          <option value="custom" style={{ backgroundColor: '#1f2937', color: 'white' }}>Custom</option>
                        </select>
                        <button
                          onClick={updateContractType}
                          disabled={isUpdatingContractType}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-300 font-medium transition-all duration-200 disabled:opacity-50"
                        >
                          {isUpdatingContractType ? (
                            <>
                              <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <span>Update</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mint Section - Enhanced for editions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
              <h2 className="text-3xl font-semibold text-white mb-6 text-center">Mint Your Collectible</h2>
              
              {!isConnected ? (
                <div className="text-center py-8">
                  <p className="text-blue-200 mb-4">Please connect your wallet to mint</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quantity Selection */}
                  <div>
                    <label className="text-white font-medium mb-2 block">Quantity</label>
                    <select
                      value={mintQuantity}
                      onChange={(e) => setMintQuantity(Number(e.target.value))}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5].map((qty) => (
                        <option key={qty} value={qty} className="bg-gray-800">
                          {qty}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cost Display */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Total Cost:</span>
                      <span className="text-white font-semibold text-lg">
                        {(parseFloat(contractInfo?.mintPrice || '0') * mintQuantity).toFixed(2)} XPL
                      </span>
                    </div>
                  </div>

                  {/* Mint Button */}
                  <button
                    onClick={handleMint}
                    disabled={!contractInfo?.mintingActive || isMinting || isMintLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-lg font-semibold text-lg transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {isMinting || isMintLoading ? 'Minting...' : 'Mint Collectible'}
                  </button>

                  {/* Status Message */}
                  {mintStatus && (
                    <div className={`p-4 rounded-lg ${
                      mintStatus.includes('successful') ? 'bg-green-500/20 text-green-300' :
                      mintStatus.includes('failed') ? 'bg-red-500/20 text-red-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {mintStatus}
                    </div>
                  )}

                  {/* Whitelist Group Cards */}
                  {(contractInfo?.contractType === 'pro' || contractInfo?.contractType === 'editions') && Object.keys(whitelistGroups).length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-white font-medium mb-3 text-sm">Whitelist Groups</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {Object.entries(whitelistGroups).slice(0, 4).map(([groupId, group]) => {
                          const mintStatus = getGroupMintStatus(group);
                          const isSelected = currentGroupId === groupId;
                          
                          return (
                            <div 
                              key={groupId}
                              className={`bg-white/10 border rounded-lg p-2 cursor-pointer transition-all duration-200 ${
                                isSelected ? 'border-blue-500 bg-blue-500/20' : 'border-white/20 hover:border-white/40'
                              }`}
                              onClick={() => handleSelectGroup(groupId)}
                            >
                              {/* Group Title & Selection Indicator */}
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-white font-medium text-xs truncate">
                                  {group.title}
                                </h4>
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                )}
                              </div>

                              {/* Address Count */}
                              <div className="text-blue-200 text-xs mb-1">
                                {group.addresses.length} addresses
                              </div>

                              {/* Time Information - Compact */}
                              {group.isTimeScheduled && (
                                <div className="mb-2">
                                  {group.mintStartTime && (
                                    <div className="text-xs text-gray-300">
                                      <span className="text-gray-400">Opens:</span> {new Date(group.mintStartTime).toLocaleDateString()} {new Date(group.mintStartTime).toLocaleTimeString()}
                                    </div>
                                  )}
                                  {group.mintEndTime && (
                                    <div className="text-xs text-gray-300">
                                      <span className="text-gray-400">Closes:</span> {new Date(group.mintEndTime).toLocaleDateString()} {new Date(group.mintEndTime).toLocaleTimeString()}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Mint Status & Button - Compact */}
                              <div className="flex items-center justify-between">
                                <div className={`text-xs px-1.5 py-0.5 rounded ${
                                  mintStatus.statusColor === 'green' ? 'bg-green-500/20 text-green-300' :
                                  mintStatus.statusColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-300' :
                                  mintStatus.statusColor === 'red' ? 'bg-red-500/20 text-red-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                  {mintStatus.status.length > 12 ? mintStatus.status.substring(0, 12) + '...' : mintStatus.status}
                                </div>
                                
                                {/* Mint Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (mintStatus.canMint && isSelected) {
                                      handleMint();
                                    }
                                  }}
                                  disabled={!mintStatus.canMint || !isSelected}
                                  className={`px-2 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                                    mintStatus.canMint && isSelected
                                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  {mintStatus.canMint && isSelected ? 'Mint' : 'Off'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {Object.keys(whitelistGroups).length > 4 && (
                        <div className="text-center mt-2">
                          <p className="text-gray-400 text-xs">
                            Showing 4 of {Object.keys(whitelistGroups).length} groups
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Public Minting Notice */}
                  {(contractInfo?.contractType === 'pro' || contractInfo?.contractType === 'editions') && getAllGroupsEnded() && (
                    <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-300 text-sm font-medium">Public Minting Now Available</span>
                      </div>
                      <p className="text-green-200 text-xs mt-1">
                        All whitelist periods have ended. Anyone can now mint from this collection.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin Panel - Only visible to contract owner */}
            {isOwner && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white">Admin Controls</h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 text-sm font-medium">Owner</span>
                  </div>
                </div>


                {/* Page Customization Section */}
                <div className="mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6 border border-purple-500/20">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                    Page Customization
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Page Description */}
                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Page Description</h4>
                      <textarea
                        value={pageDescription}
                        onChange={(e) => setPageDescription(e.target.value)}
                        placeholder="Enter a custom description for your mint page..."
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-colors resize-none"
                        rows={4}
                      />
                      <button
                        onClick={handleUpdatePageDescription}
                        disabled={isUpdatingDescription || !pageDescription.trim()}
                        className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        {isUpdatingDescription ? 'Updating...' : 'Update Description'}
                      </button>
                    </div>

                    {/* Background Color/Gradient */}
                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Page Background</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          // Animated Background (Special)
                          { id: 'animated-plasma', name: 'Animated Plasma', preview: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900', isAnimated: true },
                          // Gradients
                          { id: 'gradient-purple-blue', name: 'Purple Blue', preview: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900' },
                          { id: 'gradient-blue-green', name: 'Blue Green', preview: 'bg-gradient-to-br from-blue-900 via-cyan-900 to-green-900' },
                          { id: 'gradient-purple-pink', name: 'Purple Pink', preview: 'bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900' },
                          { id: 'gradient-orange-red', name: 'Orange Red', preview: 'bg-gradient-to-br from-orange-900 via-red-900 to-pink-900' },
                          { id: 'gradient-green-teal', name: 'Green Teal', preview: 'bg-gradient-to-br from-green-900 via-teal-900 to-cyan-900' },
                          { id: 'gradient-indigo-purple', name: 'Indigo Purple', preview: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900' },
                          // Dark solid colors
                          { id: 'solid-dark-black', name: 'Dark Black', preview: 'bg-gray-900' },
                          { id: 'solid-dark-navy', name: 'Dark Navy', preview: 'bg-slate-900' },
                          { id: 'solid-dark-charcoal', name: 'Dark Charcoal', preview: 'bg-zinc-900' }
                        ].map((bg) => (
                          <button
                            key={bg.id}
                            onClick={() => setPageBackground(bg.id)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 relative ${
                              pageBackground === bg.id 
                                ? 'border-purple-400 ring-2 ring-purple-400/50' 
                                : 'border-white/20 hover:border-white/40'
                            }`}
                          >
                            <div className={`w-full h-8 rounded ${bg.preview} mb-2 relative overflow-hidden`}>
                              {bg.isAnimated && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                              )}
                            </div>
                            <div className="flex items-center justify-center space-x-1">
                              <span className="text-white text-sm font-medium">{bg.name}</span>
                              {bg.isAnimated && (
                                <span className="text-xs bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 px-1 py-0.5 rounded-full border border-yellow-500/30">
                                  ✨
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleUpdatePageBackground}
                        disabled={isUpdatingBackground}
                        className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        {isUpdatingBackground ? 'Updating...' : 'Update Background'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Social Links Section */}
                <div className="mb-8 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-6 border border-blue-500/20">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Social Links
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Website URL */}
                    <div className="space-y-2">
                      <label className="text-white font-medium text-sm">Website URL</label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                      />
                    </div>

                    {/* X.com Profile URL */}
                    <div className="space-y-2">
                      <label className="text-white font-medium text-sm">X.com Profile</label>
                      <input
                        type="url"
                        value={xProfileUrl}
                        onChange={(e) => setXProfileUrl(e.target.value)}
                        placeholder="https://x.com/yourusername"
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleUpdateSocialLinks}
                    disabled={isUpdatingSocialLinks}
                    className="w-full mt-4 bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {isUpdatingSocialLinks ? 'Updating...' : 'Update Social Links'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Minting Control */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-3">Minting Control</h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-blue-200">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        contractInfo?.mintingActive 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {contractInfo?.mintingActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <button
                      onClick={handleToggleMinting}
                      disabled={isTogglingMinting}
                      className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {isTogglingMinting ? 'Updating...' : 
                       contractInfo?.mintingActive ? 'Pause Minting' : 'Activate Minting'}
                    </button>
                  </div>

                  {/* Price Control */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-3">Mint Price</h3>
                    <div className="mb-3">
                      <span className="text-blue-200">Current:</span>
                      <span className="text-white font-semibold ml-2">
                        {contractInfo?.mintPrice} XPL
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder="New price (XPL)"
                        value={newMintPrice}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseFloat(value) >= 0)) {
                            setNewMintPrice(value);
                          }
                        }}
                        className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleUpdatePrice}
                        disabled={!newMintPrice.length || isUpdatingPrice || isNaN(parseFloat(newMintPrice))}
                        className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        {isUpdatingPrice ? 'Updating...' : 'Update'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collection Management */}
                <div className="mt-6 bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Collection Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-blue-200 text-sm mb-2">Collection Information</h4>
                      <p className="text-white text-sm">
                        Name: <span className="font-medium">{contractInfo?.name}</span>
                      </p>
                      <p className="text-white text-sm">
                        Symbol: <span className="font-medium">{contractInfo?.symbol}</span>
                      </p>
                      <p className="text-white text-sm">
                        Max Supply: <span className="font-medium">{contractInfo?.maxSupply}</span>
                      </p>
                    </div>
                    <div>
                      <h4 className="text-blue-200 text-sm mb-3">Mint Page Banner</h4>
                      <p className="text-white text-sm mb-3">
                        Upload a banner image for the mint page. Max size: 10MB.
                      </p>
                      
                      {/* Simple Collection Image Upload */}
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCollectionImageSelect}
                          className="hidden"
                          id="collection-image-upload"
                          disabled={isUploadingCollectionImage}
                        />
                        
                        <label
                          htmlFor="collection-image-upload"
                          className={`inline-block bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                            isUploadingCollectionImage ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isUploadingCollectionImage ? 'Uploading...' : 'Upload Mint Banner'}
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transfer Ownership section removed - function not available on contracts */}

                  {/* NFT Metadata Fix Section (only for Editions contracts) */}
                  {contractInfo?.contractType === 'editions' && (
                    <div className="mt-6">
                      <h4 className="text-orange-200 text-sm mb-2">Fix Collectible Metadata</h4>
                      <p className="text-white text-sm mb-2">
                        Select custom artwork for collectible metadata. The "Fix Collectible Metadata" button will automatically upload to IPFS and apply the metadata to all edition tokens.
                      </p>
                      
                      {/* Metadata Image Preview */}
                      {metadataImagePreview && (
                        <div className="mb-4">
                          <img
                            src={metadataImagePreview}
                            alt="Metadata Preview"
                            className="w-full max-w-xs mx-auto object-cover rounded-xl border-2 border-white/20 shadow-lg"
                            style={{ aspectRatio: '1/1', maxHeight: '200px' }}
                          />
                          <p className="text-white text-sm mt-2 text-center">Metadata Preview</p>
                        </div>
                      )}
                      
                      {/* Metadata Image File Input */}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMetadataImageSelect}
                        className="hidden"
                        id="metadata-image-upload"
                      />
                      
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <label
                            htmlFor="metadata-image-upload"
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer"
                          >
                            Select Metadata Image
                          </label>
                          
                        </div>
                        
                        
                        {/* Set Base URI Button */}
                        {contractInfo?.collectionImage && (
                          <div className="border-t border-white/20 pt-3">
                            <p className="text-yellow-200 text-sm mb-2">
                              ⚠️ Important: Apply custom metadata (requires transaction)
                            </p>
                            <p className="text-blue-200 text-xs mb-2">
                              This will upload the image to IPFS and set it for all edition tokens.
                            </p>
                            <button
                              onClick={handleFixNFTMetadata}
                              disabled={isUploadingMetadataImage || isSetDynamicBaseURILoading}
                              className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                            >
                              {(isUploadingMetadataImage || isSetDynamicBaseURILoading) ? 'Fixing Collectible Metadata...' : 'Fix Collectible Metadata (All Edition Tokens)'}
                            </button>
                            
                            {/* Manual trigger button if automatic trigger fails */}
                            {pendingMetadataBaseURI && !isSetDynamicBaseURILoading && (
                              <div className="mt-2">
                                <p className="text-yellow-200 text-xs mb-2">
                                  If the contract transaction didn't trigger automatically:
                                </p>
                                <button
                                  onClick={handleManualContractWrite}
                                  disabled={!isOwner}
                                  className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed text-sm"
                                >
                                  Manual Trigger Contract Write
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fund Management */}
                <div className="mt-6 bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Fund Management</h3>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-yellow-200 text-sm font-medium">Contract Balance</span>
                    </div>
                    <p className="text-white text-sm">
                      This contract may have accumulated funds from minting fees. As the contract owner, you can withdraw these funds to your wallet.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-blue-200 text-sm mb-1">Withdraw Funds</h4>
                      <p className="text-white text-sm">
                        Withdraw all accumulated funds from minting fees
                      </p>
                    </div>
                    <button
                      onClick={handleWithdrawFunds}
                      disabled={isWithdrawLoading}
                      className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {isWithdrawLoading ? 'Withdrawing...' : 'Withdraw Funds'}
                    </button>
                  </div>
                </div>

                {/* Owner Mint section removed - function not available on these contracts */}

                {/* Withdraw Specific Amount section removed - function not available on contracts */}

                {/* Pro: Set Token Metadata section removed - function not available on contracts */}

                {/* Toggle On-Chain Storage section removed - function not available on contracts */}

                {/* Pro Features - Set Royalty (only for Pro contracts) */}
                {contractInfo?.contractType === 'pro' && (
                  <div className="mt-6 bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-3">Pro: Set Royalty</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Royalty recipient address (0x...)"
                        value={royaltyRecipient}
                        onChange={(e) => setRoyaltyRecipient(e.target.value)}
                        className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        placeholder="Royalty percentage (0-1000 = 0-10%)"
                        value={royaltyPercentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 1000)) {
                            setRoyaltyPercentage(value);
                          }
                        }}
                        className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSetRoyalty}
                        disabled={!royaltyRecipient.length || !royaltyPercentage.length || isSettingRoyalty || isNaN(parseFloat(royaltyPercentage))}
                        className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        {isSettingRoyalty ? 'Setting Royalty...' : 'Set Royalty'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Whitelist Management (for Pro and Editions contracts) */}
                {(contractInfo?.contractType === 'pro' || contractInfo?.contractType === 'editions') && (
                  <div className="mt-6 bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-medium">Whitelist Management</h3>
                      
                      {/* Whitelist Enforcement Toggle */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-300">
                          Enforce Whitelist:
                        </label>
                        <button
                          onClick={() => setWhitelistEnabled(!whitelistEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            whitelistEnabled ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              whitelistEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-medium ${whitelistEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                          {whitelistEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                    
                    {!whitelistEnabled && (
                      <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                        <p className="text-blue-300 text-sm">
                          ℹ️ Whitelist is currently <strong>disabled</strong>. All users can mint when minting is active. 
                          Enable the toggle above to restrict minting to whitelist groups only.
                        </p>
                      </div>
                    )}
                    
                    {/* Create New Group */}
                    <div className="mb-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="New whitelist group title (e.g., Collection Owners, VIP Members)"
                          value={newGroupTitle}
                          onChange={(e) => setNewGroupTitle(e.target.value)}
                          className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleCreateGroup}
                          disabled={!newGroupTitle.trim() || isCreatingGroup}
                          className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                        >
                          {isCreatingGroup ? 'Creating...' : 'Create Group'}
                        </button>
                      </div>
                      <p className="text-blue-200 text-xs mt-2">
                        Create a group, then add addresses and configure time scheduling below
                      </p>
                    </div>

                    {/* Group Selection */}
                    {Object.keys(whitelistGroups).length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-white font-medium mb-2">Select Whitelist Group</h4>
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                          {Object.entries(whitelistGroups).map(([groupId, group]) => (
                            <div key={groupId} className="bg-white/10 rounded-lg px-3 py-2">
                              <div className="flex items-center justify-between mb-1">
                                <button
                                  onClick={() => handleSelectGroup(groupId)}
                                  className={`flex-1 text-left ${currentGroupId === groupId ? 'text-blue-300 font-medium' : 'text-white'}`}
                                >
                                  {group.title} ({group.addresses.length} addresses)
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(groupId)}
                                  className="text-red-400 hover:text-red-300 text-sm ml-2"
                                >
                                  Delete
                                </button>
                              </div>
                              {group.isTimeScheduled && (
                                <div className="text-xs text-blue-200 ml-0">
                                  {group.mintStartTime && (
                                    <div>Starts: {new Date(group.mintStartTime).toLocaleString()}</div>
                                  )}
                                  {group.mintEndTime && (
                                    <div>Ends: {new Date(group.mintEndTime).toLocaleString()}</div>
                                  )}
                                  {group.timezone && group.timezone !== 'UTC' && (
                                    <div>Timezone: {group.timezone}</div>
                                  )}
                                </div>
                              )}
                              
                              {/* Merkle Activation Status & Buttons */}
                              <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                                {!group.merkleRoot ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGenerateMerkleRoot(groupId);
                                    }}
                                    disabled={isGeneratingMerkleRoot || group.addresses.length === 0}
                                    className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed"
                                  >
                                    {isGeneratingMerkleRoot ? 'Generating...' : 'Generate Merkle Root'}
                                  </button>
                                ) : !group.isActivatedOnchain ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleActivateOnChain(groupId);
                                    }}
                                    disabled={isActivatingOnChain}
                                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed"
                                  >
                                    {isActivatingOnChain ? 'Activating...' : 'Activate On-Chain'}
                                  </button>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-center gap-1 text-xs text-green-300">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                      </svg>
                                      <span>Activated On-Chain</span>
                                    </div>
                                    
                                    {needsMerkleUpdate[groupId] ? (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpdateMerkleRootOnChain(groupId);
                                          }}
                                          disabled={isUpdatingMerkleRoot}
                                          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed animate-pulse"
                                        >
                                          {isUpdatingMerkleRoot ? 'Updating...' : '⚠️ Update On-Chain (Required)'}
                                        </button>
                                        <p className="text-xs text-red-200 text-center font-medium">
                                          New addresses won't work until you update!
                                        </p>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleGenerateMerkleRoot(groupId);
                                          }}
                                          disabled={isGeneratingMerkleRoot}
                                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed"
                                        >
                                          {isGeneratingMerkleRoot ? 'Regenerating...' : 'Regenerate Merkle Root'}
                                        </button>
                                        <p className="text-xs text-blue-200 text-center">
                                          Added/removed addresses? Regenerate first
                                        </p>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Address to Current Group */}
                    {currentGroupId && whitelistGroups[currentGroupId] && (
                      <div className="space-y-3 mb-4">
                        <h4 className="text-white font-medium">
                          Add to: {whitelistGroups[currentGroupId].title}
                        </h4>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add address (0x...)"
                            value={whitelistAddress}
                            onChange={(e) => setWhitelistAddress(e.target.value)}
                            className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleAddToWhitelist}
                            disabled={!whitelistAddress.trim() || isAddingToWhitelist}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                          >
                            {isAddingToWhitelist ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Edit Time Scheduling for Current Group */}
                    {currentGroupId && whitelistGroups[currentGroupId] && (
                      <div className="space-y-3 mb-4">
                        <h4 className="text-white font-medium">
                          Time Scheduling: {whitelistGroups[currentGroupId].title}
                        </h4>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="editTimeScheduled"
                              checked={editingGroupTimeScheduled}
                              onChange={(e) => setEditingGroupTimeScheduled(e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="editTimeScheduled" className="text-blue-200 text-sm font-medium">
                              Enable time-based mint scheduling
                            </label>
                          </div>

                          {editingGroupTimeScheduled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-blue-200 text-xs mb-1">Start Time</label>
                                <input
                                  type="datetime-local"
                                  value={editingGroupMintStartTime}
                                  onChange={(e) => setEditingGroupMintStartTime(e.target.value)}
                                  className="w-full bg-gray-800 border border-white/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                                />
                              </div>
                              <div>
                                <label className="block text-blue-200 text-xs mb-1">End Time</label>
                                <input
                                  type="datetime-local"
                                  value={editingGroupMintEndTime}
                                  onChange={(e) => setEditingGroupMintEndTime(e.target.value)}
                                  className="w-full bg-gray-800 border border-white/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                                />
                              </div>
                              <div>
                                <label className="block text-blue-200 text-xs mb-1">Timezone</label>
                                <select
                                  value={editingGroupTimezone}
                                  onChange={(e) => setEditingGroupTimezone(e.target.value)}
                                  className="w-full bg-gray-800 border border-white/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="UTC">UTC</option>
                                  <option value="America/New_York">Eastern Time</option>
                                  <option value="America/Chicago">Central Time</option>
                                  <option value="America/Denver">Mountain Time</option>
                                  <option value="America/Los_Angeles">Pacific Time</option>
                                  <option value="Europe/London">London</option>
                                  <option value="Europe/Paris">Paris</option>
                                  <option value="Asia/Tokyo">Tokyo</option>
                                </select>
                              </div>
                            </div>
                          )}

                          <button
                            onClick={handleUpdateGroupSchedule}
                            disabled={isUpdatingGroupSchedule}
                            className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                          >
                            {isUpdatingGroupSchedule ? 'Updating...' : 'Update Time Schedule'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Import/Export/Clear */}
                    <div className="flex gap-2 mb-4">
                      <label className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer text-center">
                        {isImportingWhitelist ? 'Importing...' : 'Import JSON'}
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportWhitelist}
                          className="hidden"
                          disabled={isImportingWhitelist}
                        />
                      </label>
                      <button
                        onClick={handleExportWhitelist}
                        disabled={Object.keys(whitelistGroups).length === 0}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        Export All Groups
                      </button>
                      <button
                        onClick={handleClearAllWhitelistData}
                        disabled={Object.keys(whitelistGroups).length === 0}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        Clear All Data
                      </button>
                    </div>

                    {/* Current Group Addresses */}
                    {currentGroupId && whitelistGroups[currentGroupId] && whitelistGroups[currentGroupId].addresses.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-white font-medium">
                          {whitelistGroups[currentGroupId].title} ({whitelistGroups[currentGroupId].addresses.length} addresses)
                        </h4>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {whitelistGroups[currentGroupId].addresses.map((address, index) => (
                            <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
                              <span className="text-white text-sm font-mono">{address}</span>
                              <button
                                onClick={() => handleRemoveFromWhitelist(address)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Editions: Artwork Metadata section removed - functionality not implemented */}
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-8 text-center">
              <p className="text-blue-200 text-sm">
                This mint page was automatically created when your collection was deployed.
              </p>
              <p className="text-blue-200 text-sm mt-2">
                {isOwner 
                  ? 'You are the contract owner and can modify mint settings above.'
                  : 'Only the contract owner can modify mint settings and pricing.'
                }
              </p>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

