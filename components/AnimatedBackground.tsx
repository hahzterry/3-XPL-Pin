'use client';

import { useState, useEffect } from 'react';

export default function AnimatedBackground() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Array of token IDs to use for background images
  const backgroundTokens = [
    1111, 2222, 3333, 4444, 5555, 6666, 7777, 8888, 9999, 1000,
    2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 1234, 5678
  ];

  // Preload next image for smooth transitions
  const preloadImage = (tokenId: number) => {
    const img = new Image();
    const imageUrl = `/api/image/${tokenId}?v=bg&t=${Date.now()}`;
    console.log(`🖼️ AnimatedBackground: Preloading image for token ${tokenId}: ${imageUrl}`);
    img.src = imageUrl;
    return img;
  };

  useEffect(() => {
    console.log('🎨 AnimatedBackground: Starting initialization...');
    
    // Preload first few images
    const firstImage = preloadImage(backgroundTokens[0]);
    firstImage.onload = () => {
      console.log('✅ AnimatedBackground: First image loaded successfully');
      setIsLoaded(true);
    };
    firstImage.onerror = (error) => {
      console.error('❌ AnimatedBackground: First image failed to load:', error);
    };
    preloadImage(backgroundTokens[1]);

    // Set up interval to change background every 15 seconds
    const interval = setInterval(() => {
      console.log('🔄 AnimatedBackground: Starting transition...');
      // Start transition
      setIsTransitioning(true);
      
      // After transition starts, update indices
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundTokens.length);
        setNextImageIndex((prevIndex) => (prevIndex + 2) % backgroundTokens.length);
        
        // Preload the image after next
        const afterNextIndex = (currentImageIndex + 3) % backgroundTokens.length;
        preloadImage(backgroundTokens[afterNextIndex]);
        
        // End transition
        setTimeout(() => {
          setIsTransitioning(false);
          console.log('✅ AnimatedBackground: Transition completed');
        }, 100);
      }, 2500); // Half of the transition duration
      
    }, 15000); // 15 seconds

    return () => {
      console.log('🧹 AnimatedBackground: Cleaning up intervals');
      clearInterval(interval);
    };
  }, [currentImageIndex]);

  const currentTokenId = backgroundTokens[currentImageIndex];
  const nextTokenId = backgroundTokens[nextImageIndex];

  console.log('🎨 AnimatedBackground: Render state:', {
    currentTokenId,
    nextTokenId,
    isLoaded,
    isTransitioning,
    currentImageIndex,
    nextImageIndex
  });

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">
      {/* Base black background */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Current Background Image */}
      <div 
        key={`bg-current-${currentTokenId}`}
        className="absolute inset-0 transition-opacity duration-5000 ease-in-out"
        style={{
          opacity: isLoaded && !isTransitioning ? 1 : 0,
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-110 animate-slow-zoom"
          style={{
            backgroundImage: `url('/api/image/${currentTokenId}?v=bg&t=${Date.now()}')`,
            filter: 'blur(1px)',
          }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
      </div>

      {/* Next Background Image (for crossfade) */}
      <div 
        key={`bg-next-${nextTokenId}`}
        className="absolute inset-0 transition-opacity duration-5000 ease-in-out"
        style={{
          opacity: isTransitioning ? 1 : 0,
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-110 animate-slow-zoom"
          style={{
            backgroundImage: `url('/api/image/${nextTokenId}?v=bg&t=${Date.now()}')`,
            filter: 'blur(1px)',
          }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
      </div>

      {/* Subtle animation overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-forest-500/10 via-transparent to-forest-600/10 animate-pulse" />
      </div>
    </div>
  );
}
