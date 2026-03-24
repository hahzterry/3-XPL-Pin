'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../lib/contract';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import CollectionItem from '../../components/CollectionItem';
import AnimatedBackground from '../../components/AnimatedBackground';

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
}

export default function Collection() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [nfts, setNfts] = useState<NFTMetadata[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFTMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 12;

  // Get total supply
  const { data: totalSupply } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'totalSupply',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadNFTs();
  }, [totalSupply]);

  const loadNFTs = async () => {
    try {
      const nftData: NFTMetadata[] = [];
      
      if (!totalSupply || Number(totalSupply) === 0) {
        // Load demo NFTs when no real NFTs are minted
        const demoTokenIds = [1234, 5678, 2468, 9876, 3333, 7777, 1111, 8888, 4444, 6666, 2222, 9999];
        
        for (const tokenId of demoTokenIds) {
          try {
            const response = await fetch(`/api/metadata/${tokenId}`);
            const metadata = await response.json();
            nftData.push({
              tokenId,
              ...metadata,
            });
          } catch (error) {
            console.error(`Error loading demo NFT ${tokenId}:`, error);
          }
        }
      } else {
        // Load all minted NFTs (removed arbitrary 100 limit)
        const total = Number(totalSupply);
        
        // Load NFTs in batches for better performance
        const batchSize = 20;
        const totalBatches = Math.ceil(total / batchSize);
        
        for (let batch = 0; batch < totalBatches; batch++) {
          const batchPromises = [];
          const start = batch * batchSize + 1;
          const end = Math.min(start + batchSize - 1, total);
          
          for (let i = start; i <= end; i++) {
            batchPromises.push(
              fetch(`/api/metadata/${i}`)
                .then(response => response.json())
                .then(metadata => ({
                  tokenId: i,
                  ...metadata,
                }))
                .catch(error => {
                  console.error(`Error loading NFT ${i}:`, error);
                  return null;
                })
            );
          }
          
          const batchResults = await Promise.all(batchPromises);
          nftData.push(...batchResults.filter(nft => nft !== null));
          
          // Update progress
          const progress = Math.round(((batch + 1) / totalBatches) * 100);
          setLoadingProgress(progress);
        }
      }
      
      setNfts(nftData);
      setFilteredNfts(nftData);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRarity = (attributes: any[]) => {
    // Simple rarity calculation based on pattern type and characteristics
    const patternType = attributes.find(attr => attr.trait_type === 'Pattern Type')?.value;
    const complexity = attributes.find(attr => attr.trait_type === 'Complexity')?.value;
    
    let rarity = 'Common';
    let rarityScore = 0;
    
    // Pattern type rarity
    if (patternType === '3D Swirling Vortex') rarityScore += 30;
    else if (patternType === 'Volumetric Energy Cloud') rarityScore += 25;
    else if (patternType === 'Flowing Particle Streams') rarityScore += 20;
    else if (patternType === 'Particle Field Interactions') rarityScore += 15;
    else if (patternType === 'Flowing Particle Ribbons') rarityScore += 10;
    else rarityScore += 5;
    
    // Complexity rarity
    if (complexity === 'Legendary') rarityScore += 40;
    else if (complexity === 'Epic') rarityScore += 30;
    else if (complexity === 'Rare') rarityScore += 20;
    else if (complexity === 'Uncommon') rarityScore += 10;
    
    // Determine rarity tier
    if (rarityScore >= 60) rarity = 'Legendary';
    else if (rarityScore >= 45) rarity = 'Epic';
    else if (rarityScore >= 30) rarity = 'Rare';
    else if (rarityScore >= 15) rarity = 'Uncommon';
    
    return { rarity, rarityScore };
  };

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...nfts];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(nft => {
        const searchLower = searchTerm.toLowerCase();
        return (
          nft.name.toLowerCase().includes(searchLower) ||
          nft.tokenId.toString().includes(searchLower) ||
          nft.description.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply rarity filter
    if (rarityFilter !== 'all') {
      filtered = filtered.filter(nft => {
        const { rarity } = calculateRarity(nft.attributes);
        return rarity.toLowerCase() === rarityFilter.toLowerCase();
      });
    }

    // Apply sorting by token ID
    filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.tokenId - b.tokenId; // Ascending: 1, 2, 3, 4...
      } else {
        return b.tokenId - a.tokenId; // Descending: ...4, 3, 2, 1
      }
    });

    setFilteredNfts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [nfts, searchTerm, rarityFilter, sortOrder]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-forest-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-forest-300">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  // Pagination
  const totalPages = Math.ceil(filteredNfts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNFTs = filteredNfts.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 flex flex-col">
        <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Collection Header */}
          <div className="text-center mb-16">
            <div className="hero-glow rounded-3xl p-12 mb-8">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 plasma-gradient-text leading-tight">
                Gen-Plasma Collection
              </h1>
              {(!totalSupply || Number(totalSupply) === 0) ? (
                <div className="space-y-4">
                  <p className="text-xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
                    Preview the Gen-Plasma collection with sample NFTs showcasing the variety and beauty of generative plasma art.
                  </p>
                  <div className="bg-forest-500/20 border border-forest-400/30 rounded-xl p-4 max-w-2xl mx-auto">
                    <p className="text-forest-300 text-base font-medium">
                      🎨 Demo Collection Preview
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                      These are sample NFTs showing the potential of Gen-Plasma. Start minting to see real collection data!
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed">
                  Explore all minted Gen-Plasma NFTs with their unique characteristics and rarity information.
                </p>
              )}
              <div className="flex justify-center space-x-8 text-sm text-gray-400 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-forest-400">
                    {(!totalSupply || Number(totalSupply) === 0) ? '12' : nfts.length}
                  </div>
                  <div>{(!totalSupply || Number(totalSupply) === 0) ? 'Demo NFTs' : 'Total Minted'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-forest-400">7</div>
                  <div>Pattern Types</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-forest-400">∞</div>
                  <div>Unique Variations</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          {!loading && (
            <div className="mb-8 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search Field */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, token ID, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all duration-300"
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex gap-3">
                  {/* Combined Filter Dropdown */}
                  <select
                    value={`${rarityFilter}-${sortOrder}`}
                    onChange={(e) => {
                      const [rarity, sort] = e.target.value.split('-');
                      setRarityFilter(rarity);
                      setSortOrder(sort as 'asc' | 'desc');
                    }}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all duration-300 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <optgroup label="All NFTs" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>
                      <option value="all-asc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>All Rarities - Token ID Ascending</option>
                      <option value="all-desc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>All Rarities - Token ID Descending</option>
                    </optgroup>
                    <optgroup label="Filter by Rarity" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>
                      <option value="common-asc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>Common Only - Ascending</option>
                      <option value="common-desc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>Common Only - Descending</option>
                      <option value="uncommon-asc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>Uncommon Only - Ascending</option>
                      <option value="uncommon-desc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>Uncommon Only - Descending</option>
                      <option value="rare-asc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>Rare Only - Ascending</option>
                      <option value="rare-desc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>Rare Only - Descending</option>
                      <option value="epic-asc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>Epic Only - Ascending</option>
                      <option value="epic-desc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>Epic Only - Descending</option>
                      <option value="legendary-asc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>Legendary Only - Ascending</option>
                      <option value="legendary-desc" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>Legendary Only - Descending</option>
                    </optgroup>
                  </select>

                  {/* Filter Icon Button */}
                  <div className="flex items-center px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                    </svg>
                    <span className="ml-2 text-sm text-white">Filter</span>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div>
                  Showing {currentNFTs.length} of {filteredNfts.length} NFTs
                  {searchTerm && (
                    <span className="ml-2">
                      • Search: "<span className="text-forest-400">{searchTerm}</span>"
                    </span>
                  )}
                  {rarityFilter !== 'all' && (
                    <span className="ml-2">
                      • Rarity: <span className="text-forest-400 capitalize">{rarityFilter}</span>
                    </span>
                  )}
                  <span className="ml-2">
                    • Sort: <span className="text-forest-400">
                      Token ID {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      {rarityFilter !== 'all' && ` - ${rarityFilter.charAt(0).toUpperCase() + rarityFilter.slice(1)} Only`}
                    </span>
                  </span>
                </div>
                {(searchTerm || rarityFilter !== 'all' || sortOrder === 'desc') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setRarityFilter('all');
                      setSortOrder('asc');
                    }}
                    className="text-forest-400 hover:text-forest-300 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Collection Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-2 border-forest-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300 text-lg">Loading Gen-Plasma collection...</p>
              {totalSupply && Number(totalSupply) > 0 && (
                <div className="mt-4 max-w-md mx-auto">
                  <div className="bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className="bg-forest-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Loading {loadingProgress}% ({Math.floor((loadingProgress / 100) * Number(totalSupply))} of {Number(totalSupply)} NFTs)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {filteredNfts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-500">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.137 0-4.146-.832-5.657-2.343m0 0L3.515 9.829A9.965 9.965 0 0112 3c5.523 0 10 4.477 10 10a9.965 9.965 0 01-2.828 7.071L16.344 17.243" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No NFTs Found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchTerm || rarityFilter !== 'all' 
                      ? 'No NFTs match your current search and filter criteria.'
                      : 'No NFTs have been minted yet.'
                    }
                  </p>
                  {(searchTerm || rarityFilter !== 'all' || sortOrder === 'desc') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setRarityFilter('all');
                        setSortOrder('asc');
                      }}
                      className="px-6 py-3 bg-forest-500 hover:bg-forest-600 text-white rounded-xl transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                  {currentNFTs.map((nft) => (
                    <CollectionItem 
                      key={nft.tokenId} 
                      nft={nft}
                      rarity={calculateRarity(nft.attributes)}
                    />
                  ))}
                </div>
              )}

              {/* Compact Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-3 mb-16">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-white/10 transition-all duration-300"
                    title="First page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-white/10 transition-all duration-300"
                  >
                    Previous
                  </button>

                  {/* Page Numbers - Smart Display */}
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const getPageNumbers = () => {
                        const delta = 2; // Number of pages to show on each side of current page
                        const range = [];
                        const rangeWithDots = [];

                        // Always show first page
                        range.push(1);

                        // Calculate start and end of middle range
                        const start = Math.max(2, currentPage - delta);
                        const end = Math.min(totalPages - 1, currentPage + delta);

                        // Add dots after first page if needed
                        if (start > 2) {
                          rangeWithDots.push(1, '...');
                        } else if (start === 2) {
                          rangeWithDots.push(1);
                        } else {
                          rangeWithDots.push(1);
                        }

                        // Add middle range
                        for (let i = start; i <= end; i++) {
                          if (i !== 1 && i !== totalPages) {
                            rangeWithDots.push(i);
                          }
                        }

                        // Add dots before last page if needed
                        if (end < totalPages - 1) {
                          rangeWithDots.push('...', totalPages);
                        } else if (totalPages > 1) {
                          if (!rangeWithDots.includes(totalPages)) {
                            rangeWithDots.push(totalPages);
                          }
                        }

                        return rangeWithDots;
                      };

                      return getPageNumbers().map((page, index) => {
                        if (page === '...') {
                          return (
                            <span key={`dots-${index}`} className="px-2 py-2 text-gray-400">
                              ...
                            </span>
                          );
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            className={`px-3 py-2 rounded-lg transition-all duration-300 min-w-[40px] ${
                              currentPage === page
                                ? 'bg-forest-500 text-white shadow-lg'
                                : 'bg-white/5 hover:bg-white/10 text-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-white/10 transition-all duration-300"
                  >
                    Next
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-white/10 transition-all duration-300"
                    title="Last page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Page Info */}
                  <div className="ml-4 text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              )}

              {/* Call to Action for Demo Mode */}
              {(!totalSupply || Number(totalSupply) === 0) && (
                <div className="text-center mt-16">
                  <div className="glass-card p-12 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold mb-4 plasma-gradient-text">Ready to Own Your Gen-Plasma?</h2>
                    <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                      These demo NFTs showcase the incredible variety of Gen-Plasma art. 
                      Each minted NFT will be completely unique with its own rarity and characteristics.
                    </p>
                    <a href="/#mint" className="btn-primary text-xl py-4 px-8 inline-block">
                      Start Minting Now
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
          
        </div>
      </main>

        <Footer />
      </div>
    </div>
  );
}
