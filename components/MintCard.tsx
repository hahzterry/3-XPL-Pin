'use client';

import { useState } from 'react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import NFTPreviewGrid from './NFTPreviewGrid';

interface MintCardProps {
  mintQuantity: number;
  setMintQuantity: (quantity: number) => void;
  onMint: () => void;
  canMint: boolean;
  isLoading: boolean;
  mintPrice: string;
  mintingActive?: boolean;
  isConnected: boolean;
}

export default function MintCard({
  mintQuantity,
  setMintQuantity,
  onMint,
  canMint,
  isLoading,
  mintPrice,
  mintingActive,
  isConnected,
}: MintCardProps) {
  const [mintAnimation, setMintAnimation] = useState(false);

  const handleMint = () => {
    setMintAnimation(true);
    onMint();
    setTimeout(() => setMintAnimation(false), 600);
  };

  const incrementQuantity = () => {
    if (mintQuantity < 5) {
      setMintQuantity(mintQuantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (mintQuantity > 1) {
      setMintQuantity(mintQuantity - 1);
    }
  };

  // Format price to remove unnecessary trailing zeros
  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    // Convert to string and remove trailing zeros
    return num.toFixed(4).replace(/\.?0+$/, '');
  };

  const totalPrice = formatPrice((parseFloat(mintPrice) * mintQuantity).toString());

  const getMintButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (!mintingActive) return 'Minting Not Active';
    if (isLoading) return 'Minting...';
    return `Mint ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''}`;
  };

  const getMintButtonDisabled = () => {
    return !canMint || isLoading;
  };

  return (
    <div className={`glass-card p-16 ${mintAnimation ? 'mint-animation' : ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
        
        {/* Left Side - NFT Preview Section */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <h3 className="text-4xl lg:text-5xl font-bold mb-6 plasma-gradient-text leading-tight">Mint Your Gen-Plasma</h3>
            <p className="text-gray-300 text-xl mb-6 leading-relaxed">
              Generate your unique plasma formations through advanced mathematical algorithms
            </p>
            <p className="text-base text-gray-400 leading-relaxed">
              Each NFT is a one-of-a-kind manifestation of fluid dynamics and energy fields
            </p>
          </div>
          
          {/* Preview Grid */}
          <div className="bg-black/20 rounded-2xl p-8 border border-white/5">
            <NFTPreviewGrid quantity={mintQuantity} />
          </div>
        </div>

        {/* Right Side - Mint Controls */}
        <div className="space-y-8">
          
          {/* Quantity Selector */}
          <div>
            <label className="block text-base font-medium mb-6 text-gray-300 uppercase tracking-wider">
              Quantity (Max 5 per transaction)
            </label>
            <div className="flex items-center space-x-6">
              <button
                onClick={decrementQuantity}
                disabled={mintQuantity <= 1}
                className="w-16 h-16 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-forest-400/50"
              >
                <MinusIcon className="w-8 h-8" />
              </button>
              
              <div className="flex-1 max-w-24 h-20 bg-gradient-to-br from-forest-500/20 to-forest-700/20 rounded-xl flex items-center justify-center text-3xl font-bold border border-forest-400/30">
                {mintQuantity}
              </div>
              
              <button
                onClick={incrementQuantity}
                disabled={mintQuantity >= 5}
                className="w-16 h-16 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-forest-400/50"
              >
                <PlusIcon className="w-8 h-8" />
              </button>
            </div>
          </div>

          {/* Price Display */}
          <div className="p-8 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-300 font-medium text-lg">Price per NFT:</span>
              <span className="font-semibold text-white text-lg">{formatPrice(mintPrice)} XPL</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <span className="text-gray-300 font-medium text-lg">Total Cost:</span>
              <span className="text-3xl font-bold text-forest-400">{totalPrice} XPL</span>
            </div>
          </div>

          {/* Mint Button */}
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="w-full btn-primary text-xl py-6"
                >
                  Connect Wallet to Mint
                </button>
              )}
            </ConnectButton.Custom>
          ) : (
            <button
              onClick={handleMint}
              disabled={getMintButtonDisabled()}
              className={`w-full btn-primary text-xl py-6 ${
                isLoading ? 'pulse-glow' : ''
              } ${!canMint ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {getMintButtonText()}
            </button>
          )}

          {/* Status Messages */}
          {!mintingActive && isConnected && (
            <div className="p-6 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
              <p className="text-yellow-300 text-base text-center">
                Minting is currently not active. Please check back later.
              </p>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
}
