'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useContractRead } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract';

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
}

interface CollectionItemProps {
  nft: NFTMetadata;
  rarity: {
    rarity: string;
    rarityScore: number;
  };
}

export default function CollectionItem({ nft, rarity }: CollectionItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch owner of this NFT
  const { data: owner } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'ownerOf',
    args: [BigInt(nft.tokenId)],
  });

  const getRarityColor = (rarityLevel: string) => {
    switch (rarityLevel) {
      case 'Legendary': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'Epic': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'Rare': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'Uncommon': return 'text-green-400 border-green-400/30 bg-green-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  return (
    <div className="glass-card p-4 group hover:scale-105 transition-all duration-300 cursor-pointer"
         onClick={() => setShowDetails(!showDetails)}>
      
      {/* NFT Image */}
      <div className="aspect-square bg-gradient-to-br from-forest-500/20 to-forest-700/30 rounded-xl overflow-hidden relative mb-4 border border-white/10">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-forest-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <Image
          src={`/api/image/${nft.tokenId}?v=collection`}
          alt={nft.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } group-hover:scale-110 transition-transform duration-500`}
          onLoad={() => setImageLoaded(true)}
          unoptimized
        />
        
        {/* Rarity Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium border ${getRarityColor(rarity.rarity)}`}>
          {rarity.rarity}
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

        {/* Rarity Score */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Rarity Score</span>
          <span className="text-sm font-medium text-forest-400">{rarity.rarityScore}</span>
        </div>

        {/* Owner Information */}
        {owner && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Owner</span>
              <a 
                href={`https://plasmascan.to/address/${owner}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-forest-400 hover:text-forest-300 transition-colors hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {`${String(owner).slice(0, 6)}...${String(owner).slice(-4)}`}
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Token</span>
              <a 
                href={`https://plasmascan.to/token/${CONTRACT_ADDRESS}?a=${nft.tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-forest-400 hover:text-forest-300 transition-colors hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                View on Explorer
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* Attributes Preview */}
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="space-y-2">
            {nft.attributes.slice(0, showDetails ? undefined : 2).map((attr, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-gray-400">{attr.trait_type}</span>
                <span className="text-gray-300 font-medium">{attr.value}</span>
              </div>
            ))}
            
            {nft.attributes.length > 2 && !showDetails && (
              <div className="text-xs text-forest-400 text-center">
                +{nft.attributes.length - 2} more traits
              </div>
            )}
          </div>
        )}

        {/* Expand/Collapse Indicator */}
        <div className="text-center">
          <div className="text-xs text-gray-500">
            {showDetails ? '▲ Less details' : '▼ More details'}
          </div>
        </div>
      </div>
    </div>
  );
}
