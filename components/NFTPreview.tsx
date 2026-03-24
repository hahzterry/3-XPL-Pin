'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface NFTPreviewProps {
  tokenId: number;
}

export default function NFTPreview({ tokenId }: NFTPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  const loadMetadata = async () => {
    try {
      const response = await fetch(`/api/metadata/${tokenId}?v=fluid3d&t=${Date.now()}`);
      const data = await response.json();
      setMetadata(data);
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, [tokenId]);

  return (
    <div className="nft-card group">
      <div className="aspect-square bg-gradient-to-br from-forest-500/20 to-forest-700/30 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-forest-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <Image
          src={`/api/image/${tokenId}?v=fluid3d&t=${Date.now()}`}
          alt={`Plasma NFT #${tokenId}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover rounded-xl transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          unoptimized // Disable Next.js image optimization for SVGs
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-400/10 to-forest-600/10 group-hover:opacity-70 transition-opacity duration-500"></div>
      </div>
      
      <h3 className="text-xl font-bold mb-3 text-forest-300">
        {metadata ? metadata.name : `Plasma NFT #${tokenId}`}
      </h3>
      
      <p className="text-gray-400 text-sm leading-relaxed mb-4">
        {metadata ? metadata.description : 'Exclusive digital collectible powered by Plasma blockchain'}
      </p>

      {metadata && metadata.attributes && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-forest-300">Traits:</h4>
          <div className="grid grid-cols-2 gap-2">
            {metadata.attributes.slice(0, 4).map((trait: any, index: number) => (
              <div key={index} className="bg-white/5 rounded-lg p-2">
                <div className="text-xs text-gray-400">{trait.trait_type}</div>
                <div className="text-sm font-medium text-white">{trait.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
