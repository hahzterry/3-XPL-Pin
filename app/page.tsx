'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract';
import MintCard from '../components/MintCard';
import StatsCard from '../components/StatsCard';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NFTPreview from '../components/NFTPreview';
import HeroPreview from '../components/HeroPreview';
import CollectionDescription from '../components/CollectionDescription';
import AnimatedBackground from '../components/AnimatedBackground';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Contract reads - only when mounted and contract address exists
  const contractEnabled = mounted && CONTRACT_ADDRESS && CONTRACT_ADDRESS.length > 10;
  
  const { data: mintPrice } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'mintPrice',
    enabled: contractEnabled,
  });

  const { data: totalSupply } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'totalSupply',
    enabled: contractEnabled,
  });

  const { data: maxSupply } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'MAX_SUPPLY',
    enabled: contractEnabled,
  });

  const { data: mintingActive } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'mintingActive',
    enabled: contractEnabled,
  });

  const { data: mintedByUser } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'mintedByAddress',
    args: [address as `0x${string}`],
    enabled: contractEnabled && !!address,
  });

  const { data: maxPerWallet } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'MAX_PER_WALLET',
    enabled: contractEnabled,
  });

  // Contract write
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'mint',
    args: [BigInt(mintQuantity)],
    value: mintPrice ? BigInt(mintPrice) * BigInt(mintQuantity) : undefined,
    enabled: contractEnabled && !!mintPrice && mintQuantity > 0,
  });

  const { data: mintData, write: mint } = useContractWrite(config);

  const { isLoading: isMinting, isSuccess: mintSuccess } = useWaitForTransaction({
    hash: mintData?.hash,
  });

  useEffect(() => {
    if (mintSuccess) {
      setIsLoading(false);
      // You could add a success animation or notification here
    }
  }, [mintSuccess]);

  const handleMint = () => {
    if (mint) {
      setIsLoading(true);
      mint();
    }
  };

  const canMint = Boolean(
    isConnected && 
    mintingActive && 
    mintPrice && 
    totalSupply !== undefined && 
    maxSupply !== undefined && 
    Number(totalSupply || 0) + mintQuantity <= Number(maxSupply || 0) &&
    (!mintedByUser || Number(mintedByUser) + mintQuantity <= Number(maxPerWallet || 10))
  );

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="border-b border-white/5 backdrop-blur-xl bg-black/10">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-forest-400 to-forest-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">Plasma</span>
                  <span className="text-forest-300 ml-2 font-light">NFT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-forest-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-forest-300">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 flex flex-col">
        <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="mb-16">
            <div className="hero-glow rounded-3xl p-12 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left side - Text content */}
                <div className="text-center lg:text-left">
                  <div className="mb-6 flex items-center justify-center lg:justify-start">
                    <div className="mr-3 flex-shrink-0">
                      <img 
                        src="/logo-hero.webp" 
                        alt="Gen-Plasma Logo" 
                        className="w-6 h-6 md:w-8 md:h-8 object-contain"
                      />
                    </div>
                    <span className="text-lg md:text-xl text-forest-400 font-semibold tracking-wider uppercase">
                      Generative Collection
                    </span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold mb-8 plasma-gradient-text leading-tight">
                    Gen-Plasma
                  </h1>
                  <p className="text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
                    <span className="text-forest-300 font-semibold">Inspired by the fourth state of matter</span>, Gen-Plasma captures the 
                    ethereal beauty of plasma dynamics through generative art. Each piece is a unique manifestation of 
                    <span className="text-forest-300 font-semibold"> fluid energy fields</span>, <span className="text-forest-300 font-semibold">turbulent flows</span>, and 
                    <span className="text-forest-300 font-semibold"> volumetric light</span>.
                  </p>
                  <div className="mb-6">
                    <p className="text-base text-gray-400 leading-relaxed">
                      From the <span className="text-forest-400">swirling vortexes</span> of stellar nurseries to the 
                      <span className="text-forest-400"> flowing particle streams</span> of solar wind, each Gen-Plasma NFT 
                      embodies the raw power and beauty of ionized matter dancing through space.
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 mb-6">
                    <span className="text-forest-300">Minted on Plasma blockchain</span> • 
                    <span className="text-forest-300"> Near instant</span> • 
                    <span className="text-forest-300"> Fee-free minting</span>
                  </div>
                </div>

                {/* Right side - Preview image */}
                <div className="flex justify-center lg:justify-end">
                  <HeroPreview />
                </div>
              </div>
            </div>
            
          </div>


          {/* Mint Section - Full Width */}
          <div id="mint" className="mb-20">
            <MintCard
              mintQuantity={mintQuantity}
              setMintQuantity={setMintQuantity}
              onMint={handleMint}
              canMint={canMint}
              isLoading={isLoading || isMinting}
              mintPrice={mintPrice ? formatEther(BigInt(mintPrice)) : '1'}
              mintingActive={mintingActive}
              isConnected={isConnected}
            />
          </div>

          {/* Collection Preview - Horizontal Layout */}
          <div className="glass-card p-16 mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              
              {/* Left Side - Collection Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl lg:text-5xl font-bold mb-6 plasma-gradient-text leading-tight">Gen-Plasma Collection</h2>
                  <p className="text-xl text-gray-300 mb-4 leading-relaxed">
                    Each Gen-Plasma NFT is a unique digital manifestation of plasma physics, 
                    generated through advanced mathematical algorithms.
                  </p>
                  
                  {/* Expandable Description */}
                  <CollectionDescription />
                </div>
                
                {/* Feature Tags */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-forest-900/30 px-6 py-4 rounded-xl border border-forest-400/20 text-center">
                    <div className="text-2xl mb-2">🌀</div>
                    <div className="text-sm text-gray-300 font-medium">3D Volumetric Spirals</div>
                  </div>
                  <div className="bg-forest-900/30 px-6 py-4 rounded-xl border border-forest-400/20 text-center">
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="text-sm text-gray-300 font-medium">Fluid Energy Fields</div>
                  </div>
                  <div className="bg-forest-900/30 px-6 py-4 rounded-xl border border-forest-400/20 text-center">
                    <div className="text-2xl mb-2">🌊</div>
                    <div className="text-sm text-gray-300 font-medium">Turbulent Dynamics</div>
                  </div>
                  <div className="bg-forest-900/30 px-6 py-4 rounded-xl border border-forest-400/20 text-center">
                    <div className="text-2xl mb-2">✨</div>
                    <div className="text-sm text-gray-300 font-medium">Particle Interactions</div>
                  </div>
                </div>
              </div>

              {/* Right Side - Collection Examples */}
              <div className="space-y-4">
                <div className="text-center lg:text-left">
                  <h3 className="text-xl font-bold mb-2 text-gray-300">Collection Examples</h3>
                  <p className="text-xs text-gray-400 mb-4">Live examples from the Gen-Plasma collection</p>
                </div>
                
                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                  <div className="grid grid-cols-2 gap-3">
                    {[1234, 5678, 2468, 9876].map((tokenId) => (
                      <div key={`${tokenId}-fluid`} className="group">
                        <div className="aspect-square bg-gradient-to-br from-forest-500/20 to-forest-700/30 rounded-lg overflow-hidden relative border border-white/10 hover:border-forest-400/30 transition-all duration-300">
                          <img
                            src={`/api/image/${tokenId}?v=fluid3d&t=${Date.now()}`}
                            alt={`Gen-Plasma #${tokenId}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs text-forest-300">
                            #{tokenId}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Collection Stats */}
                <div className="mt-6">
                  <div className="grid grid-cols-2 gap-3">
                    <StatsCard
                      title="Total Minted"
                      value={`${totalSupply ? Number(totalSupply) : 0}`}
                      description={`/ ${maxSupply ? Number(maxSupply) : 10000}`}
                    />
                    <StatsCard
                      title="Mint Price"
                      value={`${mintPrice ? formatEther(BigInt(mintPrice)) : '1'}`}
                      description="XPL"
                    />
                    <StatsCard
                      title="Your Collection"
                      value={`${mintedByUser ? Number(mintedByUser) : 0}`}
                      description={`/ ${maxPerWallet ? Number(maxPerWallet) : 10} max`}
                    />
                    <StatsCard
                      title="Network"
                      value="Plasma"
                      description="Mainnet Beta"
                    />
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          {/* Under the Hood Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 plasma-gradient-text">
                Under the Hood
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Discover the advanced mathematics and physics simulation powering each unique Gen-Plasma NFT
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left Side - Technical Overview */}
              <div className="space-y-8">
                <div className="glass-card p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-forest-300 mb-2">Real Physics Simulation</h3>
                    <p className="text-gray-400">Based on Maxwell's electromagnetic field equations</p>
                  </div>
                  <div className="space-y-4 text-gray-300">
                    <p>Each Gen-Plasma NFT is generated using authentic plasma physics simulation, implementing Maxwell's equations for electromagnetic fields:</p>
                    <div className="bg-black/40 rounded-lg p-4 font-mono text-sm border border-forest-500/20">
                      <div className="text-forest-400 mb-2">// Maxwell's Equations Implementation</div>
                      <div className="text-gray-300">∇ × E = -∂B/∂t &nbsp;&nbsp;<span className="text-gray-500">// Faraday's Law</span></div>
                      <div className="text-gray-300">∇ × B = μ₀(J + ε₀∂E/∂t) &nbsp;&nbsp;<span className="text-gray-500">// Ampère-Maxwell</span></div>
                      <div className="text-gray-300">∇ · E = ρ/ε₀ &nbsp;&nbsp;<span className="text-gray-500">// Gauss's Law</span></div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-forest-300 mb-2">Fluid Turbulence Model</h3>
                    <p className="text-gray-400">Multi-octave noise with turbulent flow equations</p>
                  </div>
                  <div className="space-y-4 text-gray-300">
                    <p>Advanced turbulence simulation creates organic, flowing patterns using multi-layered noise functions:</p>
                    <div className="bg-black/40 rounded-lg p-4 font-mono text-sm border border-forest-500/20">
                      <div className="text-forest-400 mb-2">// Turbulence Function</div>
                      <div className="text-gray-300">turbulence(x, y, t) = Σ(i=1→6) [</div>
                      <div className="text-gray-300 ml-4">amplitude/i * sin(x*freq + t + i)</div>
                      <div className="text-gray-300 ml-4">* cos(y*freq + t*0.7 + i)</div>
                      <div className="text-gray-300">]</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Pattern Types */}
              <div className="space-y-8">
                <div className="glass-card p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-forest-300 mb-2">7 Advanced Pattern Types</h3>
                    <p className="text-gray-400">Each with unique mathematical foundations</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: "Flowing Particle Streams", desc: "Turbulent flow field navigation with Euler integration" },
                      { name: "3D Swirling Vortex", desc: "Multi-layered spiral with 3D perspective and depth" },
                      { name: "Particle Field Interactions", desc: "N-body system with inverse square law forces" },
                      { name: "Flowing Particle Ribbons", desc: "Bézier curves with turbulent modulation" },
                      { name: "Radial Particle Burst", desc: "Polar coordinates with organic variation" },
                      { name: "Volumetric Energy Cloud", desc: "3D volumetric rendering using distance fields" },
                      { name: "Conic Distortion", desc: "Non-linear transformations with plasma dynamics" }
                    ].map((pattern, index) => (
                      <div key={index} className="border-l-2 border-forest-500/30 pl-4 py-2">
                        <div className="font-semibold text-forest-300">{pattern.name}</div>
                        <div className="text-sm text-gray-400">{pattern.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-forest-300 mb-2">Volumetric Rendering</h3>
                    <p className="text-gray-400">3D depth simulation with distance fields</p>
                  </div>
                  <div className="space-y-4 text-gray-300">
                    <p>True 3D volumetric effects using mathematical distance field calculations:</p>
                    <div className="bg-black/40 rounded-lg p-4 font-mono text-sm border border-forest-500/20">
                      <div className="text-forest-400 mb-2">// Volumetric Field Equation</div>
                      <div className="text-gray-300">distance = √[(x-centerX)² + (y-centerY)²]</div>
                      <div className="text-gray-300">attenuation = 1.0 / (distance * 0.1 + 0.01)</div>
                      <div className="text-gray-300">field = attenuation * turbulence * depth</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center glass-card p-6">
                <div className="text-3xl font-bold text-forest-400 mb-2">7</div>
                <div className="text-sm text-gray-300">Pattern Types</div>
              </div>
              <div className="text-center glass-card p-6">
                <div className="text-3xl font-bold text-forest-400 mb-2">6</div>
                <div className="text-sm text-gray-300">Turbulence Octaves</div>
              </div>
              <div className="text-center glass-card p-6">
                <div className="text-3xl font-bold text-forest-400 mb-2">5</div>
                <div className="text-sm text-gray-300">Depth Layers</div>
              </div>
              <div className="text-center glass-card p-6">
                <div className="text-3xl font-bold text-forest-400 mb-2">∞</div>
                <div className="text-sm text-gray-300">Unique Variations</div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 plasma-gradient-text">
                Built for the Future
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Experience the power of Plasma's high-performance blockchain
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card p-8 text-center">
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="text-2xl font-bold mb-4 text-forest-300">Lightning Fast</h3>
                <p className="text-gray-300">Near-instant minting with sub-second block times on Plasma network</p>
              </div>
              <div className="glass-card p-8 text-center">
                <div className="text-5xl mb-4">💎</div>
                <h3 className="text-2xl font-bold mb-4 text-forest-300">Low Fees</h3>
                <p className="text-gray-300">Minimal gas costs thanks to Plasma's optimized infrastructure</p>
              </div>
              <div className="glass-card p-8 text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-2xl font-bold mb-4 text-forest-300">Secure</h3>
                <p className="text-gray-300">Institutional-grade security with full EVM compatibility</p>
              </div>
            </div>
          </div>

        </div>
      </main>

        <Footer />
      </div>
    </div>
  );
}
