'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnimatedBackground from '@/components/AnimatedBackground';

interface DeployedContract {
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
  hasWhitelist?: boolean;
}

export default function ExplorePage() {
  const [contracts, setContracts] = useState<DeployedContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'basic' | 'pro' | 'editions'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  useEffect(() => {
    loadDeployedContracts();
  }, []);

  const checkWhitelistStatus = async (contractAddress: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/whitelist/has-whitelist?contractAddress=${contractAddress}`);
      if (response.ok) {
        const result = await response.json();
        return result.hasWhitelist || false;
      }
    } catch (error) {
      console.error(`❌ Error checking whitelist for ${contractAddress}:`, error);
    }
    return false;
  };

  const loadDeployedContracts = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading deployed contracts from API...');
      const response = await fetch('/api/explore/contracts');
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Contracts loaded:', result);
        
        // Load whitelist status for Pro and Editions contracts
        const contractsWithWhitelist = await Promise.all(
          (result.contracts || []).map(async (contract: DeployedContract) => {
            // Only check whitelist for Pro and Editions contracts
            if (contract.type === 'pro' || contract.type === 'editions') {
              const hasWhitelist = await checkWhitelistStatus(contract.contractAddress);
              return { ...contract, hasWhitelist };
            }
            return { ...contract, hasWhitelist: false };
          })
        );
        
        setContracts(contractsWithWhitelist);
      } else {
        console.error('❌ Failed to load contracts:', response.status);
        // Fallback to empty array
        setContracts([]);
      }
    } catch (error) {
      console.error('❌ Error loading contracts:', error);
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Special case: Main Gen-Plasma collection shows in all filters
    const isMainCollection = contract.contractAddress === '0xB10d640B74016ed2b8E1f59CA931467D16534D08';
    const matchesType = filterType === 'all' || contract.type === filterType || isMainCollection;
    
    return matchesSearch && matchesType;
  });

  const sortedContracts = [...filteredContracts].sort((a, b) => {
    // Always show Gen-Plasma Collection first
    const isGenPlasmaA = a.contractAddress === '0xB10d640B74016ed2b8E1f59CA931467D16534D08';
    const isGenPlasmaB = b.contractAddress === '0xB10d640B74016ed2b8E1f59CA931467D16534D08';
    
    if (isGenPlasmaA && !isGenPlasmaB) return -1;
    if (!isGenPlasmaA && isGenPlasmaB) return 1;
    
    // Then show other featured collections
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    
    // Then sort by the selected criteria
    switch (sortBy) {
      case 'newest':
        return new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime();
      case 'oldest':
        return new Date(a.deployedAt).getTime() - new Date(b.deployedAt).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const getTypeColor = (type: string, contractAddress: string) => {
    // Special case for the main Gen-Plasma collection
    if (contractAddress === '0xB10d640B74016ed2b8E1f59CA931467D16534D08') {
      return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30';
    }
    
    switch (type) {
      case 'basic': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pro': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'editions': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getDisplayType = (type: string, contractAddress: string) => {
    // Special case for the main Gen-Plasma collection
    if (contractAddress === '0xB10d640B74016ed2b8E1f59CA931467D16534D08') {
      return 'CUSTOM';
    }
    return type.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 plasma-gradient-text">
              Explore Collections
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover amazing NFT collections deployed on the Plasma network
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 glass-card p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                />
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                {(['all', 'basic', 'pro', 'editions'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      filterType === type
                        ? 'bg-forest-500/30 text-forest-300 border border-forest-500/50'
                        : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
                className="p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white'
                }}
              >
                <option value="newest" style={{ backgroundColor: '#1f2937', color: 'white' }}>Newest First</option>
                <option value="oldest" style={{ backgroundColor: '#1f2937', color: 'white' }}>Oldest First</option>
                <option value="name" style={{ backgroundColor: '#1f2937', color: 'white' }}>Name A-Z</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-400">
              {isLoading ? 'Loading...' : `${sortedContracts.length} collection${sortedContracts.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Collections Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="w-full h-48 bg-white/10 rounded-lg mb-4"></div>
                  <div className="h-4 bg-white/10 rounded mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : sortedContracts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-white mb-2">No Collections Found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedContracts.map((contract) => (
                <div key={contract.contractAddress} className="glass-card p-6 hover:bg-white/10 transition-all duration-200 group flex flex-col h-full">
                  {/* Collection Image */}
                  <div className="w-full h-48 bg-white/10 rounded-lg mb-4 overflow-hidden">
                    {contract.collectionImage ? (
                      <img
                        src={contract.collectionImage}
                        alt={contract.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Collection Info - Flex grow to push button to bottom */}
                  <div className="flex flex-col flex-grow space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-white group-hover:text-forest-300 transition-colors">
                            {contract.name}
                          </h3>
                          {contract.featured && contract.contractAddress !== '0xB10d640B74016ed2b8E1f59CA931467D16534D08' && (
                            <span title="Verified Collection">
                              <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                          {contract.contractAddress === '0xB10d640B74016ed2b8E1f59CA931467D16534D08' && (
                            <span className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-medium">
                              OFFICIAL
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{contract.symbol}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(contract.type, contract.contractAddress)}`}>
                          {getDisplayType(contract.type, contract.contractAddress)}
                        </span>
                        {contract.hasWhitelist && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium border bg-orange-500/20 text-orange-300 border-orange-500/30">
                            WHITELISTED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {contract.pageDescription && (
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {contract.pageDescription}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>{contract.totalSupply} / {contract.maxSupply} minted</span>
                      <span>{contract.mintPrice} XPL</span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        contract.mintingActive 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {contract.mintingActive ? 'Active' : 'Paused'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(contract.deployedAt)}
                      </span>
                    </div>

                    {/* Spacer to push social links and button to bottom */}
                    <div className="flex-grow"></div>

                    {/* Social Links - Always at bottom before button */}
                    {(contract.websiteUrl || contract.xProfileUrl) && (
                      <div className="flex space-x-2 pt-2 mb-3">
                        {contract.websiteUrl && (
                          <a
                            href={contract.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200"
                            title="Visit Website"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                          </a>
                        )}
                        {contract.xProfileUrl && (
                          <a
                            href={contract.xProfileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200"
                            title="Follow on X"
                          >
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    )}

                    {/* View Collection Button - Always at very bottom */}
                    <a
                      href={contract.contractAddress === '0xB10d640B74016ed2b8E1f59CA931467D16534D08' 
                        ? 'https://www.gen-plasma.com/' 
                        : `/mint/${contract.contractAddress}`}
                      className="block w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white text-center py-2 px-4 rounded-lg font-medium transition-all duration-200"
                    >
                      View Collection
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
