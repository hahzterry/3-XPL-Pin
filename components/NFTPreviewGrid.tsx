'use client';

import { useState } from 'react';
import Image from 'next/image';

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

interface WalletNFTCardProps {
  nft: NFTMetadata;
  onTransfer: (tokenId: number) => void;
}

export default function WalletNFTCard({
  nft,
  onTransfer,
}: WalletNFTCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Keep the existing metadata compatibility.
  // The values are displayed using neutral 3 Word Pin terminology.
  const locationType =
    nft.attributes?.find(
      (attr) => attr.trait_type === 'Energy Level'
    )?.value || '3 Word Pin';

  const energyScore =
    nft.properties?.shader_properties?.energy_score || 0;

  const getLocationTypeStyle = (level: string) => {
    switch (level) {
      case 'Fusion Core':
        return 'text-pink-300 border-pink-400/30 bg-pink-500/10';

      case 'Plasma State':
        return 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10';

      case 'High Energy':
        return 'text-white border-white/20 bg-white/10';

      case 'Medium Energy':
        return 'text-cyan-200 border-cyan-400/20 bg-cyan-400/10';

      default:
        return 'text-gray-300 border-white/15 bg-white/5';
    }
  };

  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        bg-black/80
        backdrop-blur-xl
        border border-white/10
        p-4
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-cyan-400/30
        hover:shadow-[0_0_35px_rgba(0,242,234,0.10)]
      "
    >
      {/* Ambient glow */}
      <div
        className="
          pointer-events-none
          absolute
          -top-16
          -right-16
          w-32
          h-32
          rounded-full
          bg-cyan-400/10
          blur-3xl
          opacity-0
          group-hover:opacity-100
          transition-opacity
          duration-500
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-16
          -left-16
          w-32
          h-32
          rounded-full
          bg-pink-500/10
          blur-3xl
          opacity-0
          group-hover:opacity-100
          transition-opacity
          duration-500
        "
      />

      {/* =========================================================
          IMAGE
      ========================================================== */}
      <div
        className="
          relative
          aspect-square
          rounded-xl
          overflow-hidden
          mb-4
          bg-black
          border border-cyan-400/15
          shadow-[inset_0_0_30px_rgba(0,242,234,0.04)]
        "
      >
        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              bg-gradient-to-br
              from-cyan-400/10
              via-black
              to-pink-500/10
            "
          >
            <div
              className="
                w-7
                h-7
                rounded-full
                border-2
                border-cyan-300/30
                border-t-cyan-300
                border-r-pink-400
                animate-spin
              "
            />
          </div>
        )}

        {/* Image Error */}
        {imageError ? (
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              bg-gradient-to-br
              from-cyan-400/5
              via-black
              to-pink-500/5
            "
          >
            <div className="text-center text-gray-400">
              <div className="text-3xl mb-2">🖼️</div>

              <div className="text-xs font-semibold text-gray-300">
                Image Unavailable
              </div>

              <div className="text-xs mt-1 text-gray-500">
                Pin #{nft.tokenId}
              </div>
            </div>
          </div>
        ) : (
          <Image
            src={`/api/image/${nft.tokenId}?v=wallet`}
            alt={nft.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className={`
              object-cover
              transition-all
              duration-500
              ${
                imageLoaded
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105'
              }
              group-hover:scale-110
            `}
            onLoad={() => {
              console.log(
                `Image loaded successfully for token ${nft.tokenId}`
              );
              setImageLoaded(true);
            }}
            onError={(e) => {
              console.error(
                `Failed to load image for token ${nft.tokenId}:`,
                e
              );
              setImageError(true);
            }}
            unoptimized
          />
        )}

        {/* Image Overlay */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-br
            from-cyan-400/5
            via-transparent
            to-pink-500/10
            opacity-60
          "
        />

        {/* Top Cyan Highlight */}
        <div
          className="
            pointer-events-none
            absolute
            top-0
            left-0
            right-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-cyan-300
            to-transparent
            opacity-60
          "
        />

        {/* Bottom Pink Highlight */}
        <div
          className="
            pointer-events-none
            absolute
            bottom-0
            left-0
            right-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-pink-400
            to-transparent
            opacity-60
          "
        />

        {/* Pin Type Badge */}
        <div
          className={`
            absolute
            top-2
            right-2
            px-2.5
            py-1
            rounded-lg
            text-[10px]
            font-bold
            uppercase
            tracking-wider
            border
            backdrop-blur-md
            ${getLocationTypeStyle(locationType)}
          `}
        >
          3 Word Pin
        </div>

        {/* Pin ID */}
        <div
          className="
            absolute
            bottom-2
            left-2
            bg-black/70
            backdrop-blur-md
            px-2.5
            py-1
            rounded-lg
            text-xs
            text-cyan-300
            font-bold
            border border-cyan-400/20
          "
        >
          #{nft.tokenId}
        </div>
      </div>

      {/* =========================================================
          PIN INFORMATION
      ========================================================== */}
      <div className="relative z-10 space-y-4">

        {/* Name / Description */}
        <div>
          <h3
            className="
              font-bold
              text-white
              text-lg
              leading-tight
              group-hover:text-cyan-300
              transition-colors
              duration-300
            "
          >
            {nft.name}
          </h3>

          <p className="text-sm text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
            {nft.description}
          </p>
        </div>

        {/* Pin Identifier */}
        <div
          className="
            rounded-xl
            px-4
            py-3
            bg-gradient-to-r
            from-cyan-400/[0.06]
            via-white/[0.02]
            to-pink-500/[0.06]
            border border-white/10
          "
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Location Identity
            </span>

            <span className="text-xs font-bold text-cyan-300">
              3 WORD PIN
            </span>
          </div>

          <div className="mt-2 text-sm font-semibold text-white">
            /// KEEP.IT.SIMPLE
          </div>
        </div>

        {/* Internal Score */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Pin Score
          </span>

          <span
            className="
              text-sm
              font-bold
              bg-gradient-to-r
              from-cyan-300
              to-pink-400
              bg-clip-text
              text-transparent
            "
          >
            {energyScore.toFixed(3)}
          </span>
        </div>

        {/* =====================================================
            ATTRIBUTES
        ====================================================== */}
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="space-y-2">

            <div
              className="
                cursor-pointer
                rounded-xl
                border border-white/5
                bg-white/[0.02]
                p-3
                hover:bg-white/[0.04]
                transition-colors
              "
              onClick={() => setShowDetails(!showDetails)}
            >
              {nft.attributes
                .slice(
                  0,
                  showDetails ? undefined : 2
                )
                .map((attr, index) => (
                  <div
                    key={index}
                    className="
                      flex
                      justify-between
                      items-center
                      text-xs
                      py-1
                    "
                  >
                    <span className="text-gray-500">
                      {attr.trait_type}
                    </span>

                    <span className="text-gray-300 font-medium text-right">
                      {attr.value}
                    </span>
                  </div>
                ))}

              {nft.attributes.length > 2 && (
                <div
                  className="
                    text-[10px]
                    text-cyan-300
                    text-center
                    mt-2
                    font-semibold
                    uppercase
                    tracking-wider
                  "
                >
                  {showDetails
                    ? '▲ Show Less'
                    : `▼ +${nft.attributes.length - 2} More`}
                </div>
              )}
            </div>

          </div>
        )}

        {/* =====================================================
            TRANSFER
        ====================================================== */}
        <button
          type="button"
          onClick={() => onTransfer(nft.tokenId)}
          className="
            group/button
            relative
            overflow-hidden
            w-full
            px-4
            py-3
            rounded-xl
            font-bold
            text-sm
            text-black
            bg-gradient-to-r
            from-cyan-300
            via-white
            to-pink-400
            transition-all
            duration-300
            hover:scale-[1.02]
            hover:shadow-[0_0_30px_rgba(0,242,234,0.20)]
          "
        >
          <span className="relative z-10">
            Share / Transfer Pin
          </span>

          <span
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-pink-400
              via-white
              to-cyan-300
              opacity-0
              group-hover/button:opacity-100
              transition-opacity
              duration-300
            "
          />
        </button>

      </div>
    </div>
  );
}
