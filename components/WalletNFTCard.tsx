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

export default function WalletNFTCard({ nft, onTransfer }: WalletNFTCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Get energy level (rarity) from attributes
  const energyLevel = nft.attributes?.find(attr => attr.trait_type === 'Energy Level')?.value || 'Low Energy';
  const energyScore = nft.properties?.shader_properties?.energy_score || 0;

  const getEnergyLevelColor = (level: string) => {
    switch (level) {
      case 'Fusion Core': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'Plasma State': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'High Energy': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'Medium Energy': return 'text-green-400 border-green-400/30 bg-green-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  return (
    <div className="glass-card p-4 group hover:scale-105 transition-all duration-300">
      
      {/* NFT Image */}
      <div className="aspect-square bg-gradient-to-br from-forest-500/20 to-forest-700/30 rounded-xl overflow-hidden relative mb-4 border border-white/10">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-forest-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-600/20 to-gray-800/30">
            <div className="text-center text-gray-400">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="text-xs">Image Failed</div>
              <div className="text-xs mt-1">Token #{nft.tokenId}</div>
            </div>
          </div>
        ) : (
          <Image
            src={`/api/image/${nft.tokenId}?v=wallet`}
            alt={nft.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } group-hover:scale-110 transition-transform duration-500`}
            onLoad={() => {
              console.log(`Image loaded successfully for token ${nft.tokenId}`);
              setImageLoaded(true);
            }}
            onError={(e) => {
              console.error(`Failed to load image for token ${nft.tokenId}:`, e);
              setImageError(true);
            }}
            unoptimized
          />
        )}
        
        {/* Energy Level Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium border ${getEnergyLevelColor(energyLevel)}`}>
          {energyLevel}
        </div>
        
        {/* Token ID */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-forest-300 font-medium">
          #{nft.tokenId}
        </div>
      </div>

      {/* NFT Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-white text-lg group-hover:text-forest-300 transition-colors">
            {nft.name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {nft.description}
          </p>
        </div>

        {/* Energy Score */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Energy Score</span>
          <span className="text-sm font-medium text-forest-400">{energyScore.toFixed(3)}</span>
        </div>

        {/* Attributes Preview */}
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="space-y-2">
            <div 
              className="cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
            >
              {nft.attributes.slice(0, showDetails ? undefined : 2).map((attr, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">{attr.trait_type}</span>
                  <span className="text-gray-300 font-medium">{attr.value}</span>
                </div>
              ))}
              
              {nft.attributes.length > 2 && (
                <div className="text-xs text-forest-400 text-center mt-2">
                  {showDetails ? '▲ Less details' : `▼ +${nft.attributes.length - 2} more traits`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transfer Button */}
        <button
          onClick={() => onTransfer(nft.tokenId)}
          className="w-full px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg font-semibold transition-colors mt-4"
        >
          Transfer
        </button>
      </div>
    </div>
  );
}
