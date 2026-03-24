'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import CustomConnectButton from './CustomConnectButton';

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the subtitle based on current route
  const getSubtitle = () => {
    if (pathname?.startsWith('/create')) {
      return 'Create';
    }
    if (pathname?.startsWith('/explore')) {
      return 'Explore';
    }
    if (pathname?.startsWith('/wallet')) {
      return 'Wallet';
    }
    if (pathname?.startsWith('/inscriptions')) {
      return 'Inscriptions';
    }
    return 'Collection';
  };
  return (
    <header className="border-b border-white/5 backdrop-blur-xl bg-black/10">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/20">
              <img 
                src="/logo.svg" 
                alt="Gen-Plasma Logo" 
                className="w-8 h-8 filter brightness-0 invert"
              />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">Gen-Plasma</span>
              <span className="text-forest-300 ml-2 font-light text-sm">{getSubtitle()}</span>
            </div>
          </div>
          
              <nav className="hidden md:flex items-center space-x-8">
                <a href="/#mint" className="text-gray-300 hover:text-forest-300 transition-colors font-medium">
                  Mint
                </a>
                <a href="/collection" className="text-gray-300 hover:text-forest-300 transition-colors font-medium">
                  Collection
                </a>
                <a href="/create" className="text-yellow-300 hover:text-yellow-200 transition-colors font-medium drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5), 0 0 8px rgba(252, 211, 77, 0.3)' }}>
                  Create
                </a>
                <a href="/explore" className="text-orange-600 hover:text-orange-500 transition-colors font-medium drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5), 0 0 8px rgba(234, 88, 12, 0.3)' }}>
                  Explore
                </a>
                <a href="/inscriptions" className="text-purple-400 hover:text-purple-300 transition-colors font-medium drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5), 0 0 8px rgba(192, 132, 252, 0.3)' }}>
                  Inscriptions
                </a>
                <a href="https://matcha.xyz/?preset=popular&networks=9745" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-forest-300 transition-colors font-medium">
                  Swap
                </a>
                <a href="https://stargate.finance/bridge?dstChain=plasma&dstToken=0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-forest-300 transition-colors font-medium">
                  Bridge
                </a>
              </nav>

          <div className="flex items-center space-x-4">
            {mounted && isConnected && (
              <Link href="/wallet">
                <button className="px-4 py-2 bg-forest-500/20 hover:bg-forest-500/30 border border-forest-500/30 rounded-lg text-forest-300 hover:text-forest-200 transition-all duration-200 font-medium backdrop-blur-sm">
                  My Wallet
                </button>
              </Link>
            )}
            {mounted && <CustomConnectButton />}
          </div>
        </div>
      </div>
    </header>
  );
}
