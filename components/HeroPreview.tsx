'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function HeroPreview() {
  const [tokenId, setTokenId] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Generate initial random preview
  useEffect(() => {
    setTokenId(Math.floor(Math.random() * 10000) + 1);
  }, []);

  const handleRefresh = () => {
    setImageLoaded(false);
    setImageError(false);

    setTokenId(Math.floor(Math.random() * 10000) + 1);
    setRefreshKey((prev) => prev + 1);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.warn(
      `3 Word Pin preview failed for tokenId: ${tokenId}, refreshKey: ${refreshKey}`
    );

    setImageError(true);
    setImageLoaded(false);

    // Auto-retry with another preview
    setTimeout(() => {
      const newTokenId = Math.floor(Math.random() * 10000) + 1;

      setTokenId(newTokenId);
      setRefreshKey((prev) => prev + 1);
      setImageError(false);
    }, 2000);
  };

  return (
    <div className="relative group w-full flex justify-center">

      {/* =========================================================
          AMBIENT GLOW
      ========================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -top-20
          -left-20
          w-48
          h-48
          rounded-full
          bg-cyan-400/10
          blur-3xl
          transition-all
          duration-700
          group-hover:bg-cyan-400/20
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-20
          -right-20
          w-48
          h-48
          rounded-full
          bg-pink-500/10
          blur-3xl
          transition-all
          duration-700
          group-hover:bg-pink-500/20
        "
      />

      {/* =========================================================
          MAIN PREVIEW
      ========================================================== */}

      <div
        className="
          relative
          w-80
          h-80
          sm:w-96
          sm:h-96
          rounded-3xl
          overflow-hidden
          bg-black
          border
          border-cyan-400/20
          backdrop-blur-xl
          shadow-[0_0_60px_rgba(0,242,234,0.10)]
          transition-all
          duration-500
          group-hover:border-cyan-400/40
          group-hover:shadow-[0_0_80px_rgba(0,242,234,0.16)]
        "
      >

        {/* Inner border */}
        <div
          className="
            pointer-events-none
            absolute
            inset-2
            rounded-2xl
            border
            border-white/5
            z-20
          "
        />

        {/* =====================================================
            LOADING
        ====================================================== */}

        {!imageLoaded && !imageError && (
          <div
            className="
              absolute
              inset-0
              z-10
              flex
              items-center
              justify-center
              bg-gradient-to-br
              from-cyan-400/10
              via-black
              to-pink-500/10
            "
          >
            <div className="flex flex-col items-center">

              <div
                className="
                  w-10
                  h-10
                  rounded-full
                  border-2
                  border-cyan-300/20
                  border-t-cyan-300
                  border-r-pink-400
                  animate-spin
                "
              />

              <p
                className="
                  mt-4
                  text-[10px]
                  uppercase
                  tracking-[0.25em]
                  text-cyan-300/70
                "
              >
                Loading Pin
              </p>

            </div>
          </div>
        )}

        {/* =====================================================
            ERROR / RETRY
        ====================================================== */}

        {imageError && (
          <div
            className="
              absolute
              inset-0
              z-10
              flex
              items-center
              justify-center
              bg-black
            "
          >
            <div className="text-center">

              <div
                className="
                  mx-auto
                  w-14
                  h-14
                  rounded-full
                  border
                  border-pink-400/30
                  bg-pink-500/10
                  flex
                  items-center
                  justify-center
                  mb-4
                "
              >
                <span className="text-pink-300 text-xl">
                  !
                </span>
              </div>

              <p className="text-sm font-semibold text-white">
                Preview unavailable
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Trying another location preview...
              </p>

            </div>
          </div>
        )}

        {/* =====================================================
            PREVIEW IMAGE
        ====================================================== */}

        {tokenId > 0 && (
          <Image
            key={`hero-${tokenId}-${refreshKey}`}
            src={`/api/image/${tokenId}?v=hero3d&t=${refreshKey}`}
            alt={`3 Word Pin preview ${tokenId}`}
            fill
            sizes="(max-width: 640px) 320px, 384px"
            className={`
              object-cover
              transition-all
              duration-700
              ${
                imageLoaded
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105'
              }
              group-hover:scale-105
            `}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority
            unoptimized
          />
        )}

        {/* =====================================================
            IMAGE OVERLAYS
        ====================================================== */}

        {/* Dark readability gradient */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-10
            bg-gradient-to-t
            from-black/70
            via-black/5
            to-black/20
          "
        />

        {/* Cyan → Pink atmospheric overlay */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-10
            bg-gradient-to-br
            from-cyan-400/5
            via-transparent
            to-pink-500/10
            mix-blend-screen
          "
        />

        {/* Top highlight */}
        <div
          className="
            pointer-events-none
            absolute
            top-0
            left-0
            right-0
            h-px
            z-30
            bg-gradient-to-r
            from-transparent
            via-cyan-300
            to-transparent
            opacity-70
          "
        />

        {/* Bottom highlight */}
        <div
          className="
            pointer-events-none
            absolute
            bottom-0
            left-0
            right-0
            h-px
            z-30
            bg-gradient-to-r
            from-transparent
            via-pink-400
            to-transparent
            opacity-70
          "
        />

        {/* =====================================================
            3 WORD PIN BRANDING
        ====================================================== */}

        <div
          className="
            absolute
            top-5
            left-5
            z-30
            px-3
            py-1.5
            rounded-full
            bg-black/60
            backdrop-blur-md
            border border-cyan-400/20
          "
        >
          <span
            className="
              text-[9px]
              font-black
              tracking-[0.2em]
              text-cyan-300
            "
          >
            3 WORD PIN
          </span>
        </div>

        {/* =====================================================
            PIN ID
        ====================================================== */}

        {imageLoaded && (
          <div
            className="
              absolute
              bottom-5
              left-5
              z-30
              px-3
              py-2
              rounded-xl
              bg-black/70
              backdrop-blur-md
              border border-white/10
            "
          >
            <div
              className="
                text-[9px]
                uppercase
                tracking-[0.15em]
                text-gray-500
              "
            >
              Location Preview
            </div>

            <div
              className="
                mt-0.5
                text-sm
                font-black
                bg-gradient-to-r
                from-cyan-300
                via-white
                to-pink-400
                bg-clip-text
                text-transparent
              "
            >
              /// {tokenId}
            </div>
          </div>
        )}

        {/* =====================================================
            DECORATIVE CORNERS
        ====================================================== */}

        <div className="absolute top-4 right-4 z-30 w-5 h-5 border-t border-r border-cyan-300/50 rounded-tr-md" />

        <div className="absolute bottom-4 right-4 z-30 w-5 h-5 border-b border-r border-pink-400/50 rounded-br-md" />

      </div>

      {/* =========================================================
          REFRESH BUTTON
      ========================================================== */}

      <button
        type="button"
        onClick={handleRefresh}
        aria-label="Generate new 3 Word Pin preview"
        title="Generate new preview"
        className="
          absolute
          -top-3
          -right-3
          z-40
          w-12
          h-12
          rounded-full
          flex
          items-center
          justify-center
          bg-black
          border
          border-cyan-400/30
          text-cyan-300
          shadow-[0_0_25px_rgba(0,242,234,0.15)]
          transition-all
          duration-300
          hover:scale-110
          hover:border-cyan-300
          hover:bg-cyan-400/10
          hover:shadow-[0_0_35px_rgba(0,242,234,0.25)]
          active:scale-95
        "
      >
        <svg
          className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180"
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

      {/* =========================================================
          LOGO / BRAND MARK
      ========================================================== */}

      <div
        className="
          absolute
          top-5
          right-5
          z-30
          opacity-50
          group-hover:opacity-80
          transition-opacity
          duration-300
        "
      >
        <img
          src="/logo.svg"
          alt="3 Word Pin"
          className="w-6 h-6 brightness-0 invert"
        />
      </div>

      {/* =========================================================
          DESCRIPTION
      ========================================================== */}

      <div
        className="
          absolute
          -bottom-9
          left-0
          right-0
          text-center
        "
      >
        <p
          className="
            text-[10px]
            sm:text-xs
            text-gray-500
            uppercase
            tracking-[0.15em]
          "
        >
          Generate a new location preview
        </p>

        <p
          className="
            text-[10px]
            text-cyan-400/60
            mt-1
            font-semibold
          "
        >
          /// KEEP.IT.SIMPLE
        </p>
      </div>

    </div>
  );
}
