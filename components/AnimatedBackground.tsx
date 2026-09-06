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

    console.log(
      `🖼️ AnimatedBackground: Preloading image for token ${tokenId}: ${imageUrl}`
    );

    img.src = imageUrl;
    return img;
  };

  useEffect(() => {
    console.log('🎨 AnimatedBackground: Starting initialization...');
    
    // Preload first few images
    const firstImage = preloadImage(backgroundTokens[0]);

    firstImage.onload = () => {
      console.log(
        '✅ AnimatedBackground: First image loaded successfully'
      );

      setIsLoaded(true);
    };

    firstImage.onerror = (error) => {
      console.error(
        '❌ AnimatedBackground: First image failed to load:',
        error
      );
    };

    preloadImage(backgroundTokens[1]);

    // Set up interval to change background every 15 seconds
    const interval = setInterval(() => {
      console.log(
        '🔄 AnimatedBackground: Starting transition...'
      );

      // Start transition
      setIsTransitioning(true);
      
      // After transition starts, update indices
      setTimeout(() => {
        setCurrentImageIndex(
          (prevIndex) =>
            (prevIndex + 1) % backgroundTokens.length
        );

        setNextImageIndex(
          (prevIndex) =>
            (prevIndex + 2) % backgroundTokens.length
        );
        
        // Preload the image after next
        const afterNextIndex =
          (currentImageIndex + 3) %
          backgroundTokens.length;

        preloadImage(
          backgroundTokens[afterNextIndex]
        );
        
        // End transition
        setTimeout(() => {
          setIsTransitioning(false);

          console.log(
            '✅ AnimatedBackground: Transition completed'
          );
        }, 100);

      }, 2500); // Half of the transition duration
      
    }, 15000); // 15 seconds

    return () => {
      console.log(
        '🧹 AnimatedBackground: Cleaning up intervals'
      );

      clearInterval(interval);
    };
  }, [currentImageIndex]);

  const currentTokenId =
    backgroundTokens[currentImageIndex];

  const nextTokenId =
    backgroundTokens[nextImageIndex];

  console.log(
    '🎨 AnimatedBackground: Render state:',
    {
      currentTokenId,
      nextTokenId,
      isLoaded,
      isTransitioning,
      currentImageIndex,
      nextImageIndex
    }
  );

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">

      {/* =====================================================
          BASE BLACK BACKGROUND
      ====================================================== */}

      <div className="absolute inset-0 bg-black" />

      {/* =====================================================
          CYAN ATMOSPHERIC GLOW
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-32
          top-1/4
          h-96
          w-96
          rounded-full
          bg-cyan-400/10
          blur-[120px]
        "
      />

      {/* =====================================================
          PINK ATMOSPHERIC GLOW
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -right-32
          bottom-1/4
          h-96
          w-96
          rounded-full
          bg-pink-500/10
          blur-[120px]
        "
      />
      
      {/* =====================================================
          CURRENT BACKGROUND IMAGE
      ====================================================== */}

      <div 
        key={`bg-current-${currentTokenId}`}
        className="
          absolute
          inset-0
          transition-opacity
          duration-5000
          ease-in-out
        "
        style={{
          opacity:
            isLoaded && !isTransitioning
              ? 1
              : 0,
        }}
      >
        <div
          className="
            absolute
            inset-0
            transform
            scale-110
            animate-slow-zoom
            bg-cover
            bg-center
            bg-no-repeat
          "
          style={{
            backgroundImage:
              `url('/api/image/${currentTokenId}?v=bg&t=${Date.now()}')`,
            filter: 'blur(1px)',
          }}
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/65" />

        {/* Cyan / Pink brand gradient */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-cyan-400/10
            via-transparent
            to-pink-500/10
          "
        />

        {/* Vertical gradient for text readability */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-black/35
            via-black/40
            to-black/75
          "
        />
      </div>

      {/* =====================================================
          NEXT BACKGROUND IMAGE
          FOR CROSSFADE
      ====================================================== */}

      <div 
        key={`bg-next-${nextTokenId}`}
        className="
          absolute
          inset-0
          transition-opacity
          duration-5000
          ease-in-out
        "
        style={{
          opacity:
            isTransitioning
              ? 1
              : 0,
        }}
      >
        <div
          className="
            absolute
            inset-0
            transform
            scale-110
            animate-slow-zoom
            bg-cover
            bg-center
            bg-no-repeat
          "
          style={{
            backgroundImage:
              `url('/api/image/${nextTokenId}?v=bg&t=${Date.now()}')`,
            filter: 'blur(1px)',
          }}
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/65" />

        {/* Cyan / Pink brand gradient */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-cyan-400/10
            via-transparent
            to-pink-500/10
          "
        />

        {/* Vertical gradient for text readability */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-black/35
            via-black/40
            to-black/75
          "
        />
      </div>

      {/* =====================================================
          SUBTLE 3 WORD PIN ANIMATION OVERLAY
      ====================================================== */}

      <div className="absolute inset-0 opacity-20">

        {/* Cyan → transparent → pink */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-cyan-400/15
            via-transparent
            to-pink-500/15
            animate-pulse
          "
        />

        {/* Soft center glow */}
        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.06),transparent_55%,rgba(236,72,153,0.05))]
          "
        />
      </div>

      {/* =====================================================
          SUBTLE LOCATION GRID
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.025]
          bg-[linear-gradient(rgba(34,211,238,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.8)_1px,transparent_1px)]
          bg-[size:90px_90px]
        "
      />

      {/* =====================================================
          FINAL VIGNETTE
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.55)_100%)]
        "
      />

      {/* Bottom fade */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          h-1/3
          bg-gradient-to-t
          from-black/70
          to-transparent
        "
      />

    </div>
  );
}
