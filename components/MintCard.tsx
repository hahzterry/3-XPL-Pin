'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CollectibleImageProps {
  src: string;
  alt: string;
  size: number;
  type?: string;
  className?: string;
}

export default function CollectibleImage({
  src,
  alt,
  size,
  type = 'unknown',
  className = ''
}: CollectibleImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Determine if this is an SVG (including data URLs)
  const isSVG =
    type?.includes('svg') ||
    src?.toLowerCase().includes('.svg') ||
    src?.includes('data:image/svg+xml');

  const handleImageError = (e: any) => {
    console.error(
      `Failed to load collectible image: ${src}`,
      e
    );

    console.error('Image error details:', {
      src,
      type,
      size,
      error: e
    });

    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(
      `Successfully loaded collectible image: ${src}`
    );

    setImageLoaded(true);
  };

  /*
   * Error state
   */
  if (imageError) {
    return (
      <div
        className={`
          relative
          flex
          items-center
          justify-center
          overflow-hidden
          rounded-xl
          border
          border-cyan-400/20
          bg-black
          shadow-[0_0_30px_rgba(34,211,238,0.08)]
          ${className}
        `}
        style={{
          width: size,
          height: size
        }}
      >
        {/* Cyan glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.08),transparent_45%)]" />

        {/* Pink glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.08),transparent_45%)]" />

        <div className="relative z-10 text-center">
          <div className="mb-2 text-2xl">
            🖼️
          </div>

          <div className="text-xs font-medium text-white/40">
            No Image
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        group
        relative
        overflow-hidden
        rounded-xl
        border
        border-cyan-400/20
        bg-black
        shadow-[0_0_25px_rgba(34,211,238,0.08)]
        transition-all
        duration-500
        hover:border-cyan-400/40
        hover:shadow-[0_0_40px_rgba(34,211,238,0.14)]
        ${className}
      `}
      style={{
        width: size,
        height: size
      }}
    >

      {/* =====================================================
          LOADING STATE
      ====================================================== */}

      {!imageLoaded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">

          {/* Cyan / pink loading glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.10),transparent_45%)]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.10),transparent_45%)]" />

          {/* Loading spinner */}
          <div
            className="
              relative
              h-7
              w-7
              rounded-full
              border-2
              border-cyan-400/20
              border-t-cyan-400
              animate-spin
            "
          />
        </div>
      )}

      {/* =====================================================
          IMAGE
      ====================================================== */}

      {isSVG ? (
        /*
         * SVG images use regular img tag to avoid
         * Next.js optimization issues.
         */
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className={`
            relative
            z-10
            h-full
            w-full
            object-cover
            transition-all
            duration-700
            group-hover:scale-[1.02]
            ${
              imageLoaded
                ? 'opacity-100'
                : 'opacity-0'
            }
          `}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        /*
         * Other formats use Next.js Image.
         */
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className={`
            relative
            z-10
            h-full
            w-full
            object-cover
            transition-all
            duration-700
            group-hover:scale-[1.02]
            ${
              imageLoaded
                ? 'opacity-100'
                : 'opacity-0'
            }
          `}
          onLoad={handleImageLoad}
          onError={handleImageError}
          unoptimized
        />
      )}

      {/* =====================================================
          CYAN / PINK BRAND OVERLAY
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-20
          bg-gradient-to-br
          from-cyan-400/5
          via-transparent
          to-pink-500/5
          opacity-0
          transition-opacity
          duration-500
          group-hover:opacity-100
        "
      />

      {/* =====================================================
          TOP HIGHLIGHT
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          left-0
          right-0
          top-0
          z-30
          h-px
          bg-gradient-to-r
          from-transparent
          via-cyan-300/60
          to-transparent
          opacity-60
        "
      />

      {/* =====================================================
          BOTTOM HIGHLIGHT
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-0
          right-0
          z-30
          h-px
          bg-gradient-to-r
          from-transparent
          via-pink-400/50
          to-transparent
          opacity-50
        "
      />

    </div>
  );
}
