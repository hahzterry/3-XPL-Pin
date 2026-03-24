'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { isAddress } from 'viem';
import Link from 'next/link';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';
import WalletNFTCard from '@/components/WalletNFTCard';
import CollectibleImage from '@/components/CollectibleImage';

interface NFTMetadata {
  tokenId: number;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
    rarity?: number;
  }>;
  properties?: {
    shader_properties?: {
      energy_score?: number;
    };
  };
}

interface CollectibleImage {
  url: string;
  type: string;
  format: string;
  isValid: boolean;
  tokenId?: number;
  name?: string;
  collectionName?: string;
}

interface CollectibleCollection {
  contractAddress: string;
  contractName: string;
  tokenCount: number;
  description: string;
  validImages: CollectibleImage[];
}

export default function WalletPage() {
  const { address, isConnected } = useAccount();
  const [userNFTs, setUserNFTs] = useState<NFTMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [totalToLoad, setTotalToLoad] = useState(0);
  const [transferTokenId, setTransferTokenId] = useState<number | null>(null);
  const [transferContractAddress, setTransferContractAddress] = useState<string>(CONTRACT_ADDRESS);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [activeTab, setActiveTab] = useState<'gen-plasma' | 'collectibles'>('gen-plasma');
  const [otherCollectibles, setOtherCollectibles] = useState<CollectibleCollection[]>([]);
  const [collectiblesLoading, setCollectiblesLoading] = useState(false);

  // Get user's NFT balance
  const { data: balance, error: balanceError, isLoading: balanceLoading } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Prepare transfer transaction (works with any ERC721 contract)
  const { config: transferConfig } = usePrepareContractWrite({
    address: transferContractAddress as `0x${string}`,
    abi: CONTRACT_ABI, // Standard ERC721 ABI works for all contracts
    functionName: 'safeTransferFrom',
    args: address && recipientAddress && transferTokenId !== null 
      ? [address, recipientAddress as `0x${string}`, BigInt(transferTokenId)] 
      : undefined,
    enabled: !!address && !!recipientAddress && transferTokenId !== null && isAddress(recipientAddress),
  });

  const { data: transferData, write: transfer } = useContractWrite(transferConfig);

  const { isLoading: isTransferring, isSuccess: transferComplete } = useWaitForTransaction({
    hash: transferData?.hash,
  });

  // Load user's NFTs
  useEffect(() => {
    async function loadUserNFTs() {
      if (!address) {
        setLoading(false);
        return;
      }

      if (!balance) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userBalance = Number(balance);
        setTotalToLoad(userBalance);
        setLoadingProgress(0);
        
        const nfts: NFTMetadata[] = [];
        const BATCH_SIZE = 10; // Process 10 NFTs at a time

        // First, get all token IDs owned by the user
        const tokenIds: number[] = [];
        for (let i = 0; i < userBalance; i++) {
          try {
            const response = await fetch(`/api/contract-read`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                functionName: 'tokenOfOwnerByIndex',
                args: [address, i]
              })
            });
            if (response.ok) {
              const { result } = await response.json();
              tokenIds.push(Number(result));
            }
          } catch (error) {
            console.error(`Error getting token ${i}:`, error);
          }
        }

        console.log('User owns token IDs:', tokenIds);

        // Now load metadata for each token in batches (same as collection page)
        for (let batchStart = 0; batchStart < tokenIds.length; batchStart += BATCH_SIZE) {
          const batchEnd = Math.min(batchStart + BATCH_SIZE, tokenIds.length);
          const batchPromises = [];

          // Create batch of promises for metadata
          for (let i = batchStart; i < batchEnd; i++) {
            const tokenId = tokenIds[i];
            batchPromises.push(
              fetch(`/api/metadata/${tokenId}`)
                .then(response => response.json())
                .then(metadata => ({
                  tokenId,
                  ...metadata,
                }))
                .catch(error => {
                  console.error(`Error loading metadata for token ${tokenId}:`, error);
                  return null;
                })
            );
          }

          // Wait for batch to complete
          const batchResults = await Promise.all(batchPromises);
          nfts.push(...batchResults.filter(nft => nft !== null));

          // Update progress
          setLoadingProgress(batchEnd);
          
          // Update UI with current progress
          setUserNFTs([...nfts].sort((a, b) => a.tokenId - b.tokenId));
        }

        // Final sort and update
        setUserNFTs(nfts.sort((a, b) => a.tokenId - b.tokenId));
      } catch (error) {
        console.error('Error loading user NFTs:', error);
      } finally {
        setLoading(false);
        setLoadingProgress(0);
      }
    }

    loadUserNFTs();
  }, [address, balance]);

  // Load other collectibles
  const loadOtherCollectibles = async () => {
    if (!address) return;
    
    setCollectiblesLoading(true);
    try {
      console.log('Scanning for other collectibles...');
      
      // Fetch all deployed contracts from the database (same API as explore page)
      let knownContracts = [];
      
      try {
        const response = await fetch('/api/explore/contracts');
        if (response.ok) {
          const data = await response.json();
          if (data.contracts) {
            // Convert to the format expected by the wallet scanner
            knownContracts = data.contracts
              .filter((contract: any) => contract.contractAddress !== CONTRACT_ADDRESS)
              .map((contract: any) => ({
                address: contract.contractAddress,
                name: contract.name || 'Unknown Collection',
                description: contract.pageDescription || 'NFT collection on Plasma network',
              }));
            
            console.log(`✅ Loaded ${knownContracts.length} deployed contracts to scan`);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching deployed contracts:', error);
        knownContracts = [];
      }
      
      // If no contracts found in database, return early
      if (knownContracts.length === 0) {
        console.log('No deployed contracts found to scan');
        setCollectiblesLoading(false);
        return;
      }
      
      const collectiblesFound = [];
      
      // Check each known contract
      for (const contract of knownContracts) {
        try {
          console.log(`Checking contract: ${contract.name} (${contract.address})`);
          
          // Try to get balance for this contract using the contract read API
          let hasTokens = false;
          let tokenCount = 0;
          
          try {
            const response = await fetch('/api/contract-read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contractAddress: contract.address,
                functionName: 'balanceOf',
                args: [address]
              })
            });
            
            if (response.ok) {
              const { result } = await response.json();
              tokenCount = Number(result);
              hasTokens = tokenCount > 0;
              console.log(`${contract.name}: Found ${tokenCount} tokens`);
            } else {
              // If the contract doesn't exist or doesn't support balanceOf, skip it
              hasTokens = false;
              tokenCount = 0;
              console.log(`${contract.name}: Contract not found or doesn't support balanceOf`);
            }
          } catch (error) {
            // If API call fails, skip this contract
            hasTokens = false;
            tokenCount = 0;
            console.log(`${contract.name}: API error, skipping contract`, error);
          }
          
          if (hasTokens) {
            console.log(`Processing ${tokenCount} tokens in ${contract.name}`);
            
            // Fetch actual NFT images from database or contract
            const realImages = [];
            let supportsEnumeration = true; // Track if contract supports ERC721Enumerable
            
            try {
              // Get the token IDs owned by this user
              const ownedTokenIds = [];
              
              // Try tokenOfOwnerByIndex first
              for (let i = 0; i < Math.min(tokenCount, 6); i++) {
                try {
                  const response = await fetch('/api/contract-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contractAddress: contract.address,
                      functionName: 'tokenOfOwnerByIndex',
                      args: [address, i]
                    })
                  });
                  
                  if (response.ok) {
                    const { result } = await response.json();
                    ownedTokenIds.push(Number(result));
                  } else {
                    supportsEnumeration = false;
                    break;
                  }
                } catch (error) {
                  supportsEnumeration = false;
                  break;
                }
              }
              
              // If enumeration failed, scan token IDs using ownerOf (with rate limiting)
              if (!supportsEnumeration && ownedTokenIds.length === 0) {
                console.log(`🔍 Scanning ${contract.name} for owned tokens using ownerOf (limited to 20 tokens)`);
                
                // Helper function to add delay between requests
                const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
                
                for (let tokenId = 1; tokenId <= 20 && ownedTokenIds.length < 6; tokenId++) {
                  try {
                    const ownerResponse = await fetch('/api/contract-read', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contractAddress: contract.address,
                        functionName: 'ownerOf',
                        args: [tokenId]
                      })
                    });
                    
                    if (ownerResponse.ok) {
                      const { result: owner } = await ownerResponse.json();
                      if (owner && owner.toLowerCase() === address.toLowerCase()) {
                        ownedTokenIds.push(tokenId);
                        console.log(`✅ User owns token #${tokenId}`);
                      }
                    } else if (ownerResponse.status === 500) {
                      // Server error - stop scanning to avoid hammering the API
                      console.log(`⚠️ Server error during scan, stopping early`);
                      break;
                    }
                    
                    // Add small delay between requests to avoid overwhelming the server
                    await delay(100);
                  } catch (error) {
                    // Token doesn't exist or other error, continue
                  }
                }
                
                console.log(`Found ${ownedTokenIds.length} owned tokens via ownerOf scan`);
              }
                
                console.log(`Found token IDs for ${contract.name}:`, ownedTokenIds);
                
                // Fetch metadata from IPFS using tokenURI
                if (ownedTokenIds.length > 0) {
                  for (const tokenId of ownedTokenIds) {
                try {
                  // First, try to get tokenURI to determine the metadata source
                  const uriResponse = await fetch('/api/contract-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contractAddress: contract.address,
                      functionName: 'tokenURI',
                      args: [tokenId]
                    })
                  });
                  
                  let metadata = null;
                  
                  if (uriResponse.ok) {
                    const { result: tokenURI } = await uriResponse.json();
                    console.log(`Token ${tokenId} URI:`, tokenURI);
                    
                    // If it's our platform's metadata URL, fetch directly
                    if (tokenURI && tokenURI.includes('gen-plasma.com/api/metadata/')) {
                      // Extract contract type and slug from URI
                      const uriParts = tokenURI.split('/api/metadata/');
                      if (uriParts.length > 1) {
                        const [type, rest] = uriParts[1].split('/');
                        
                        // Try different metadata endpoints based on contract type
                        const metadataEndpoints = [
                          `/api/metadata/${type}/${rest}${tokenId}`,
                          `/api/metadata/${type}/${contract.address}/${tokenId}`,
                        ];
                        
                        for (const endpoint of metadataEndpoints) {
                          try {
                            const metadataResponse = await fetch(endpoint);
                            if (metadataResponse.ok) {
                              metadata = await metadataResponse.json();
                              console.log(`✅ Fetched metadata from ${endpoint}`);
                              break;
                            }
                          } catch (e) {
                            // Try next endpoint
                          }
                        }
                      }
                    } else if (tokenURI && tokenURI.startsWith('ipfs://')) {
                      // IPFS URI - convert to HTTP gateway
                      const ipfsUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                      console.log(`Fetching IPFS metadata from ${ipfsUrl}`);
                      const metadataResponse = await fetch(ipfsUrl);
                      if (metadataResponse.ok) {
                        metadata = await metadataResponse.json();
                        console.log(`✅ Fetched metadata from IPFS`);
                      }
                    } else if (tokenURI && tokenURI.startsWith('http')) {
                      // External HTTP URL - fetch from server
                      const metadataResponse = await fetch(tokenURI);
                      if (metadataResponse.ok) {
                        metadata = await metadataResponse.json();
                      }
                    } else if (tokenURI && tokenURI.startsWith('data:application/json;base64,')) {
                      // Base64 data URL - decode directly
                      const base64Data = tokenURI.replace('data:application/json;base64,', '');
                      const jsonString = atob(base64Data);
                      metadata = JSON.parse(jsonString);
                    }
                  }
                  
                  if (metadata && metadata.image) {
                    // Convert IPFS image URLs to HTTP gateway
                    let imageUrl = metadata.image;
                    if (imageUrl.startsWith('ipfs://')) {
                      imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                    }
                    
                    console.log(`✅ Adding image for token ${tokenId}:`, imageUrl);
                    realImages.push({
                      url: imageUrl,
                      type: 'image/png',
                      format: 'png',
                      isValid: true,
                      tokenId: tokenId,
                      name: metadata.name || `Token #${tokenId}`,
                      collectionName: contract.name
                    });
                  }
                } catch (error) {
                  console.warn(`Failed to fetch metadata for token ${tokenId}:`, error);
                }
              }
                }
              
              console.log(`Found ${realImages.length} real images for ${contract.name}:`, realImages);
              
            } catch (error) {
              console.error(`Error fetching real images for ${contract.name}:`, error);
            }
            
            // If we couldn't get real images, create an informative placeholder
            if (realImages.length === 0) {
              console.log(`⚠️ No images loaded for ${contract.name} - creating placeholder`);
              const message = !supportsEnumeration 
                ? 'Visit mint page to view NFTs'
                : `${tokenCount} item${tokenCount !== 1 ? 's' : ''}`;
              
              const fallbackColor = '#6366f1'; // Indigo
              const fallbackImage = `data:image/svg+xml;base64,${btoa(`<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" /><stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#grad)"/><circle cx="75" cy="75" r="45" fill="#fff" opacity="0.1"/><text x="50%" y="45%" font-family="Arial" font-size="12" fill="#fff" text-anchor="middle" font-weight="bold">${contract.name}</text><text x="50%" y="65%" font-family="Arial" font-size="10" fill="#fff" text-anchor="middle" opacity="0.8">${message}</text></svg>`)}`;
              
              realImages.push({
                url: fallbackImage,
                type: 'image/svg+xml',
                format: 'svg',
                isValid: true,
                tokenId: 0,
                name: contract.name
              });
            }
            
            console.log(`Final images array for ${contract.name}:`, realImages);
            
              // Use the real collection name from metadata if available
              const realCollectionName = realImages.length > 0 && realImages[0].collectionName 
                ? realImages[0].collectionName 
                : contract.name;
              
              collectiblesFound.push({
                contractAddress: contract.address,
                contractName: realCollectionName,
                tokenCount,
                description: contract.description,
                validImages: realImages
              });
          }
        } catch (error) {
          console.warn(`Failed to check contract ${contract.name}:`, error);
        }
      }
      
      // Brief loading delay to show scanning process
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log(`Found ${collectiblesFound.length} collections with tokens`);
      const processedCollectibles = collectiblesFound;
      
      setOtherCollectibles(processedCollectibles);
    } catch (error) {
      console.error('Error loading other collectibles:', error);
    } finally {
      setCollectiblesLoading(false);
    }
  };

  // Load other collectibles when tab is switched
  useEffect(() => {
    if (activeTab === 'collectibles' && otherCollectibles.length === 0) {
      loadOtherCollectibles();
    }
  }, [activeTab, address]);

  // Handle transfer success
  useEffect(() => {
    if (transferComplete) {
      setTransferSuccess(true);
      setTransferTokenId(null);
      setRecipientAddress('');
      setTransferError('');
      
      // Reload NFTs after successful transfer
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [transferComplete]);

  const handleTransfer = () => {
    setTransferError('');
    
    if (!recipientAddress) {
      setTransferError('Please enter a recipient address');
      return;
    }
    
    if (!isAddress(recipientAddress)) {
      setTransferError('Please enter a valid Ethereum address');
      return;
    }
    
    if (recipientAddress.toLowerCase() === address?.toLowerCase()) {
      setTransferError('Cannot transfer to yourself');
      return;
    }

    if (transfer) {
      transfer();
    }
  };

  const closeTransferModal = () => {
    setTransferTokenId(null);
    setTransferContractAddress(CONTRACT_ADDRESS);
    setRecipientAddress('');
    setTransferError('');
    setTransferSuccess(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-forest-900">
        <Header />
        <div className="container mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 plasma-gradient-text">
              My Wallet
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Please connect your wallet to view your Gen-Plasma collection
            </p>
            <Link href="/">
              <button className="px-8 py-3 bg-forest-500 hover:bg-forest-600 text-white rounded-lg font-semibold transition-colors">
                Go to Mint Page
              </button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show minimal loading state only for initial connection, not NFT loading
  if (loading && userNFTs.length === 0 && !address) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-forest-900">
      <Header />
      
      <div className="container mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 plasma-gradient-text">
            My Wallet
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Manage your Gen-Plasma collection
          </p>
          
          {/* Debug Info */}
          {balanceError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg max-w-md mx-auto">
              <p className="text-red-400 text-sm">
                Connection Error: Unable to load collection balance. Please check your network connection.
              </p>
            </div>
          )}
          
          {balanceLoading && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg max-w-md mx-auto">
              <p className="text-blue-400 text-sm">
                Loading collection balance...
              </p>
            </div>
          )}

          
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-400 mb-8">
            <div>
              <span className="font-semibold text-forest-300">{userNFTs.length}</span> Items Owned
            </div>
            <div>
              <span className="font-semibold text-forest-300">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
            {balance && (
              <div>
                <span className="font-semibold text-forest-300">Balance: {balance.toString()}</span>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="glass-card p-1 inline-flex rounded-lg">
              <button
                onClick={() => {
                  setActiveTab('gen-plasma');
                  setCurrentPage(1);
                }}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'gen-plasma'
                    ? 'bg-forest-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-forest-500/20'
                }`}
              >
                Gen-Plasma
              </button>
              <button
                onClick={() => {
                  setActiveTab('collectibles');
                  setCurrentPage(1);
                }}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'collectibles'
                    ? 'bg-forest-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-forest-500/20'
                }`}
              >
                Other Collectibles
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'gen-plasma' && loading && userNFTs.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-8">
              <div className="w-16 h-16 border-4 border-forest-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-300 mb-4">Loading Your Collection</h2>
              <p className="text-gray-400 mb-4">
                Discovering your Gen-Plasma collection...
              </p>
              {totalToLoad > 0 && (
                <div className="max-w-md mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-forest-300 text-sm">
                      Found {totalToLoad} Items
                    </span>
                    <span className="text-forest-300 text-sm">
                      Loading {loadingProgress}/{totalToLoad}
                    </span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2">
                    <div 
                      className="bg-forest-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: totalToLoad > 0 ? `${(loadingProgress / totalToLoad) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'gen-plasma' && userNFTs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🎨</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-4">No Gen-Plasma Items Found</h2>
            <p className="text-gray-400 mb-8">
              You don't own any Gen-Plasma items yet. Start your collection today!
            </p>
            <Link href="/">
              <button className="px-8 py-3 bg-forest-500 hover:bg-forest-600 text-white rounded-lg font-semibold transition-colors">
                Mint Your First Item
              </button>
            </Link>
          </div>
        ) : activeTab === 'gen-plasma' ? (
          <>
            {/* Pagination Controls */}
            {userNFTs.length > itemsPerPage && (
              <div className="flex justify-center items-center space-x-4 mb-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-forest-500/20 hover:bg-forest-500/30 disabled:bg-gray-600/20 disabled:cursor-not-allowed border border-forest-500/30 rounded-lg text-forest-300 transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-300">
                  Page {currentPage} of {Math.ceil(userNFTs.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(Math.ceil(userNFTs.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage >= Math.ceil(userNFTs.length / itemsPerPage)}
                  className="px-4 py-2 bg-forest-500/20 hover:bg-forest-500/30 disabled:bg-gray-600/20 disabled:cursor-not-allowed border border-forest-500/30 rounded-lg text-forest-300 transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userNFTs
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((nft) => (
                  <WalletNFTCard
                    key={nft.tokenId}
                    nft={nft}
                    onTransfer={(tokenId) => setTransferTokenId(tokenId)}
                  />
                ))}
              
              {/* Show skeleton cards while loading */}
              {loading && userNFTs.length > 0 && userNFTs.length < totalToLoad && (
                Array.from({ length: Math.min(8, totalToLoad - userNFTs.length) }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="glass-card p-4 animate-pulse">
                    <div className="aspect-square bg-gradient-to-br from-forest-500/10 to-forest-700/20 rounded-xl mb-4 border border-white/5">
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-forest-500/30 border-t-forest-500 rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-forest-500/20 rounded w-3/4"></div>
                      <div className="h-3 bg-forest-500/10 rounded w-1/2"></div>
                      <div className="h-8 bg-forest-500/20 rounded w-full"></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Pagination Controls */}
            {userNFTs.length > itemsPerPage && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-forest-500/20 hover:bg-forest-500/30 disabled:bg-gray-600/20 disabled:cursor-not-allowed border border-forest-500/30 rounded-lg text-forest-300 transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-300">
                  Page {currentPage} of {Math.ceil(userNFTs.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(Math.ceil(userNFTs.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage >= Math.ceil(userNFTs.length / itemsPerPage)}
                  className="px-4 py-2 bg-forest-500/20 hover:bg-forest-500/30 disabled:bg-gray-600/20 disabled:cursor-not-allowed border border-forest-500/30 rounded-lg text-forest-300 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : activeTab === 'collectibles' ? (
          <div className="max-w-4xl mx-auto">
            {collectiblesLoading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-forest-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-gray-300 mb-4">Scanning for Other Collectibles</h2>
                <p className="text-gray-400">
                  Checking popular collections on Plasma network...
                </p>
              </div>
            ) : otherCollectibles.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">🔍</div>
                <h2 className="text-2xl font-bold text-gray-300 mb-4">No Other Collectibles Found</h2>
                <p className="text-gray-400 mb-8">
                  You don't seem to own any other collectibles on the Plasma network.
                </p>
                <button
                  onClick={loadOtherCollectibles}
                  className="px-6 py-3 bg-forest-500 hover:bg-forest-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Scan Again
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-300 mb-2">Other Collectibles</h2>
                  <p className="text-gray-400">
                    Found {otherCollectibles.length} other collection{otherCollectibles.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="grid gap-6">
                  {otherCollectibles.map((collection, index) => (
                    <div key={index} className="glass-card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex items-baseline space-x-1">
                              <h3 className="text-xl font-bold text-white">
                                {collection.contractName.includes(' by ') 
                                  ? collection.contractName.split(' by ')[0]
                                  : collection.contractName}
                              </h3>
                              {collection.contractName.includes(' by ') && (
                                <span className="text-sm font-normal text-gray-400">
                                  by {collection.contractName.split(' by ')[1]}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full" title="Verified Collection">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Contract: {collection.contractAddress}</span>
                            <span>•</span>
                            <span>{collection.tokenCount} item{collection.tokenCount !== 1 ? 's' : ''} owned</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-forest-300">{collection.tokenCount}</div>
                          <div className="text-sm text-gray-400">Items</div>
                        </div>
                      </div>

                      {/* Sample Images */}
                      {collection.validImages && collection.validImages.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-300">Items:</h4>
                            <span className="text-xs text-gray-500">
                              {collection.validImages.length} of {collection.tokenCount} shown
                            </span>
                          </div>
                          <div className="flex space-x-3 overflow-x-auto pb-2">
                            {collection.validImages.slice(0, 6).map((image: CollectibleImage, imgIndex: number) => (
                              <div key={imgIndex} className="flex-shrink-0 relative group">
                                <CollectibleImage
                                  src={image.url}
                                  alt={`${collection.contractName} #${image.tokenId || imgIndex + 1}`}
                                  size={120}
                                  type={image.type}
                                  className="hover:scale-105 transition-transform duration-200 cursor-pointer"
                                />
                                {/* Transfer button overlay */}
                                {image.tokenId && (
                                  <button
                                    onClick={() => {
                                      setTransferTokenId(image.tokenId!);
                                      setTransferContractAddress(collection.contractAddress);
                                    }}
                                    className="absolute bottom-2 right-2 px-2 py-1 bg-forest-600 hover:bg-forest-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium"
                                    title={`Transfer #${image.tokenId}`}
                                  >
                                    Transfer
                                  </button>
                                )}
                                {/* Token ID label */}
                                {image.tokenId && (
                                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded font-medium">
                                    #{image.tokenId}
                                  </div>
                                )}
                              </div>
                            ))}
                            {collection.tokenCount > 6 && (
                              <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 bg-gradient-to-br from-forest-500/10 to-forest-700/20 rounded-lg border border-white/10 text-forest-300 text-xs text-center">
                                +{collection.tokenCount - 6}<br/>more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex space-x-3">
                          <a
                            href={`/mint/${collection.contractAddress}`}
                            className="flex-1 px-4 py-2 bg-forest-600 hover:bg-forest-700 border border-forest-500/50 rounded-lg text-white text-sm font-medium transition-colors text-center"
                          >
                            View Mint Page
                          </a>
                          <a
                            href={`https://plasmascan.to/address/${collection.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2 bg-forest-500/20 hover:bg-forest-500/30 border border-forest-500/30 rounded-lg text-forest-300 text-sm font-medium transition-colors text-center"
                          >
                            View Contract
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Transfer Modal */}
      {transferTokenId !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Transfer #{transferTokenId}
            </h3>
            
            {transferSuccess ? (
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-green-400 font-semibold mb-4">Transfer Successful!</p>
                <p className="text-gray-400 text-sm">Page will reload in 2 seconds...</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-forest-500 focus:outline-none"
                  />
                </div>

                {transferError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{transferError}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={closeTransferModal}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransfer}
                    disabled={isTransferring || !recipientAddress}
                    className="flex-1 px-4 py-2 bg-forest-500 hover:bg-forest-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                  >
                    {isTransferring ? 'Transferring...' : 'Transfer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
