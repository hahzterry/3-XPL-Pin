'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface NFTPreviewGridProps {
  quantity: number;
}

export default function NFTPreviewGrid({ quantity }: NFTPreviewGridProps) {
  const [previewTokenIds, setPreviewTokenIds] = useState<number[]>([]);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([]);
  const [errorStates, setErrorStates] = useState<boolean[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh key

  // Generate random token IDs for preview
  const generateRandomTokenIds = (count: number): number[] => {
    const tokenIds: number[] = [];
    for (let i = 0; i < count; i++) {
      // Generate random token IDs between 1 and 10000
      const randomId = Math.floor(Math.random() * 10000) + 1;
      tokenIds.push(randomId);
    }
    return tokenIds;
  };

  // Initialize preview token IDs
  useEffect(() => {
    const tokenIds = generateRandomTokenIds(quantity);
    setPreviewTokenIds(tokenIds);
    setLoadingStates(new Array(quantity).fill(true));
    setErrorStates(new Array(quantity).fill(false));
  }, [quantity]);

  // Handle refresh button click
  const handleRefresh = () => {
    setIsRefreshing(true);
    setLoadingStates(new Array(quantity).fill(true));
    setErrorStates(new Array(quantity).fill(false));
    
    // Add a small delay for better UX and increment refresh key for cache busting
    setTimeout(() => {
      const newTokenIds = generateRandomTokenIds(quantity);
      setPreviewTokenIds(newTokenIds);
      setRefreshKey(prev => prev + 1); // Force new requests
      setIsRefreshing(false);
    }, 300);
  };

  // Handle individual image load
  const handleImageLoad = (index: number) => {
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });
  };

  // Handle individual image error
  const handleImageError = (index: number) => {
    const failedTokenId = previewTokenIds[index];
    console.warn(`Image failed to load for tokenId: ${failedTokenId}, refreshKey: ${refreshKey}`);
    
    // Try to generate a new tokenId automatically for this slot
    const newTokenIds = [...previewTokenIds];
    let newTokenId;
    let attempts = 0;
    
    // Try to find a different tokenId (avoid the failed one)
    do {
      newTokenId = Math.floor(Math.random() * 10000) + 1;
      attempts++;
    } while (newTokenId === failedTokenId && attempts < 10);
    
    newTokenIds[index] = newTokenId;
    setPreviewTokenIds(newTokenIds);
    
    // Reset states for this image
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[index] = true; // Set to loading to try the new tokenId
      return newStates;
    });
    setErrorStates(prev => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });
    
    // If this is the second failure for this slot, then show error
    setTimeout(() => {
      setLoadingStates(prev => {
        const newStates = [...prev];
        if (newStates[index] === true) { // Still loading after timeout
          newStates[index] = false;
          setErrorStates(errorPrev => {
            const errorStates = [...errorPrev];
            errorStates[index] = true;
            return errorStates;
          });
        }
        return newStates;
      });
    }, 5000); // 5 second timeout
  };

  // Retry loading a specific image
  const retryImage = (index: number) => {
    setErrorStates(prev => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[index] = true;
      return newStates;
    });
    
    // Generate a new token ID for this specific image and force refresh
    const newTokenIds = [...previewTokenIds];
    newTokenIds[index] = Math.floor(Math.random() * 10000) + 1;
    setPreviewTokenIds(newTokenIds);
    setRefreshKey(prev => prev + 1); // Force cache bust
  };

  return (
    <div className="mb-8">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h4 className="text-xl font-semibold text-gray-300 mb-2">Preview Your NFTs</h4>
          <p className="text-sm text-gray-400">Live generative previews</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-forest-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Generate new previews"
        >
          <ArrowPathIcon className={`w-6 h-6 text-forest-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Preview Grid - Full width horizontal layout */}
      <div className={`grid gap-4 ${
        quantity === 1 ? 'grid-cols-1 max-w-80 mx-auto' :
        quantity === 2 ? 'grid-cols-2' :
        quantity === 3 ? 'grid-cols-3' :
        quantity === 4 ? 'grid-cols-4' :
        'grid-cols-5'
      }`}>
        {previewTokenIds.map((tokenId, index) => (
          <div key={`${tokenId}-${index}`} className="group">
            <div className="aspect-square bg-gradient-to-br from-forest-500/20 to-forest-700/30 rounded-lg overflow-hidden relative border border-white/10 hover:border-forest-400/30 transition-all duration-300">
              {/* Loading spinner */}
              {loadingStates[index] && !errorStates[index] && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-forest-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Error state with retry button */}
              {errorStates[index] && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-sm">
                  <div className="text-red-400 text-xs mb-2 text-center px-2">
                    Failed to load
                  </div>
                  <button
                    onClick={() => retryImage(index)}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded text-xs text-red-300 transition-all duration-200"
                  >
                    Retry
                  </button>
                </div>
              )}
              
              {/* NFT Image */}
              {!errorStates[index] && (
                <Image
                  key={`${tokenId}-${refreshKey}`} // Force re-render on refresh
                  src={`/api/image/${tokenId}?v=${refreshKey}`} // Add version parameter for cache busting
                  alt={`Preview NFT #${tokenId}`}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className={`object-cover transition-all duration-300 ${
                    loadingStates[index] ? 'opacity-0' : 'opacity-100'
                  } group-hover:scale-105`}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                  priority={index < 2} // Prioritize loading first 2 images
                  unoptimized // Disable Next.js image optimization for SVGs
                />
              )}
              
              {/* Token ID overlay */}
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                #{tokenId}
              </div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Info text */}
      <p className="text-xs text-gray-500 text-center mt-4">
        These are random previews. Your actual NFTs will be different and generated at mint time.
      </p>
    </div>
  );
}
