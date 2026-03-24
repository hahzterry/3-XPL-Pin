'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CollectibleImageProps {
  src: string;
  alt: string;
  size: number; // Make size required and consistent
  type?: string;
  className?: string;
}

export default function CollectibleImage({ 
  src, 
  alt, 
  size,
  type = 'unknown',
  className = ""
}: CollectibleImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Determine if this is an SVG (including data URLs)
  const isSVG = type?.includes('svg') || src?.toLowerCase().includes('.svg') || src?.includes('data:image/svg+xml');

  const handleImageError = (e: any) => {
    console.error(`Failed to load collectible image: ${src}`, e);
    console.error('Image error details:', {
      src,
      type,
      size,
      error: e
    });
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(`Successfully loaded collectible image: ${src}`);
    setImageLoaded(true);
  };

  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-gray-600/20 to-gray-800/30 rounded-lg border border-white/10 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-gray-500 text-xs text-center">
          <div className="text-lg mb-1">🖼️</div>
          <div>No Image</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-lg border border-white/10 ${className}`}
      style={{ width: size, height: size }}
    >
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-forest-500/10 to-forest-700/20">
          <div className="w-4 h-4 border-2 border-forest-400/50 border-t-forest-400 rounded-full animate-spin"></div>
        </div>
      )}
      
      {isSVG ? (
        // For SVG images (including data URLs), use regular img tag to avoid Next.js optimization issues
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        // For other formats, use Next.js Image component
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          unoptimized // Always unoptimized for external/data URLs
        />
      )}
    </div>
  );
}
