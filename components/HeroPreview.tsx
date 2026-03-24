'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function HeroPreview() {
  const [tokenId, setTokenId] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Generate initial random tokenId
  useEffect(() => {
    setTokenId(Math.floor(Math.random() * 10000) + 1);
  }, []);

  const handleRefresh = () => {
    setImageLoaded(false);
    setImageError(false);
    setTokenId(Math.floor(Math.random() * 10000) + 1);
    setRefreshKey(prev => prev + 1);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.warn(`Hero preview image failed to load for tokenId: ${tokenId}, refreshKey: ${refreshKey}`);
    setImageError(true);
    setImageLoaded(false);
    
    // Auto-retry with a new tokenId after 2 seconds
    setTimeout(() => {
      const newTokenId = Math.floor(Math.random() * 10000) + 1;
      setTokenId(newTokenId);
      setRefreshKey(prev => prev + 1);
      setImageError(false);
    }, 2000);
  };

  return (
    <div className="relative group">
      {/* Main preview container */}
      <div className="relative w-80 h-80 rounded-2xl overflow-hidden border border-forest-400/20 bg-black/20 backdrop-blur-sm">
        {/* Loading state */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-forest-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error state */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-red-400/50 rounded-full flex items-center justify-center mb-2">
                <span className="text-red-400">!</span>
              </div>
              <p className="text-sm text-gray-400">Retrying...</p>
            </div>
          </div>
        )}

        {/* Preview image */}
        {tokenId > 0 && (
          <Image
            key={`hero-${tokenId}-${refreshKey}`}
            src={`/api/image/${tokenId}?v=hero3d&t=${refreshKey}`}
            alt={`Gen-Plasma Preview #${tokenId}`}
            fill
            sizes="320px"
            className={`object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority
            unoptimized
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        
        {/* Token ID label */}
        {imageLoaded && (
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-xs text-forest-300 font-medium">#{tokenId}</span>
          </div>
        )}
      </div>

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        className="absolute -top-2 -right-2 w-10 h-10 bg-forest-500 hover:bg-forest-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg border border-forest-400/30"
        title="Generate new preview"
      >
        <svg 
          className="w-5 h-5 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
      </button>

      {/* Mathematical formula watermark */}
      <div className="absolute top-4 left-4 opacity-30">
        <img 
          src="/logo.svg" 
          alt="Mathematical Formula" 
          className="w-6 h-6 filter brightness-0 invert"
        />
      </div>

      {/* Floating description */}
      <div className="absolute -bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-gray-500">
          Live generative preview • Click refresh for new pattern
        </p>
      </div>
    </div>
  );
}
