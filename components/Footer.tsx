'use client';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Footer() {
  const addToMetaMask = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x2611', // 9745 in hex
            chainName: 'Plasma Mainnet Beta',
            nativeCurrency: {
              name: 'XPL',
              symbol: 'XPL',
              decimals: 18,
            },
            rpcUrls: ['https://rpc.plasma.to'],
            blockExplorerUrls: ['https://plasmascan.to'],
          }],
        });
      } else {
        alert('MetaMask not detected. Please install MetaMask to add the network.');
      }
    } catch (error) {
      console.error('Error adding network to MetaMask:', error);
    }
  };
  return (
    <footer className="border-t border-white/5 backdrop-blur-xl bg-black/10 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/20">
              <img 
                src="/logo.svg" 
                alt="Gen-Plasma Logo" 
                className="w-8 h-8 filter brightness-0 invert"
              />
            </div>
              <div>
                <span className="text-2xl font-bold text-white">Gen-Plasma</span>
                <span className="text-forest-300 ml-2 font-light text-sm">Collection</span>
              </div>
            </div>
            <p className="text-white text-base leading-relaxed max-w-md">
              Unique generative art collection inspired by plasma physics. 
              Each NFT is a one-of-a-kind manifestation of fluid dynamics and energy fields.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-6 text-forest-300 text-base">Resources</h4>
            <div className="space-y-3">
              <a href="https://docs.plasma.to" target="_blank" rel="noopener noreferrer" className="block text-white hover:text-forest-300 transition-colors font-medium text-sm">
                Documentation
              </a>
              <a href="https://plasmascan.to" target="_blank" rel="noopener noreferrer" className="block text-white hover:text-forest-300 transition-colors font-medium text-sm">
                Block Explorer
              </a>
              <a href="https://app.plasma.to/ecosystem" target="_blank" rel="noopener noreferrer" className="block text-white hover:text-forest-300 transition-colors font-medium text-sm">
                Ecosystem
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-6 text-forest-300 text-base">Network</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Chain ID</span>
                <span className="font-mono text-forest-400 text-sm font-medium">9745</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Currency</span>
                <span className="font-mono text-forest-400 text-sm font-medium">XPL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Network</span>
                <div className="flex items-center space-x-2">
                  <span className="text-forest-400 text-sm font-medium">Mainnet Beta</span>
                  <button
                    onClick={addToMetaMask}
                    className="group flex items-center justify-center w-6 h-6 bg-white/10 hover:bg-white/20 rounded-md transition-all duration-200 hover:scale-110"
                    title="Add Plasma Network to MetaMask"
                  >
                    <svg
                      className="w-4 h-4 group-hover:scale-110 transition-transform"
                      viewBox="0 0 507.83 470.86"
                    >
                      <defs>
                        <style>{`.a{fill:#e2761b;stroke:#e2761b;}.a,.b,.c,.d,.e,.f,.g,.h,.i,.j{stroke-linecap:round;stroke-linejoin:round;}.b{fill:#e4761b;stroke:#e4761b;}.c{fill:#d7c1b3;stroke:#d7c1b3;}.d{fill:#233447;stroke:#233447;}.e{fill:#cd6116;stroke:#cd6116;}.f{fill:#e4751f;stroke:#e4751f;}.g{fill:#f6851b;stroke:#f6851b;}.h{fill:#c0ad9e;stroke:#c0ad9e;}.i{fill:#161616;stroke:#161616;}.j{fill:#763d16;stroke:#763d16;}`}</style>
                      </defs>
                      <polygon className="a" points="482.09 0.5 284.32 147.38 320.9 60.72 482.09 0.5"/>
                      <polygon className="b" points="25.54 0.5 221.72 148.77 186.93 60.72 25.54 0.5"/>
                      <polygon className="b" points="410.93 340.97 358.26 421.67 470.96 452.67 503.36 342.76 410.93 340.97"/>
                      <polygon className="b" points="4.67 342.76 36.87 452.67 149.57 421.67 96.9 340.97 4.67 342.76"/>
                      <polygon className="b" points="143.21 204.62 111.8 252.13 223.7 257.1 219.73 136.85 143.21 204.62"/>
                      <polygon className="b" points="364.42 204.62 286.91 135.46 284.32 257.1 396.03 252.13 364.42 204.62"/>
                      <polygon className="b" points="149.57 421.67 216.75 388.87 158.71 343.55 149.57 421.67"/>
                      <polygon className="b" points="290.88 388.87 358.26 421.67 348.92 343.55 290.88 388.87"/>
                      <polygon className="c" points="358.26 421.67 290.88 388.87 296.25 432.8 295.65 451.28 358.26 421.67"/>
                      <polygon className="c" points="149.57 421.67 212.18 451.28 211.78 432.8 216.75 388.87 149.57 421.67"/>
                      <polygon className="d" points="213.17 314.54 157.12 298.04 196.67 279.95 213.17 314.54"/>
                      <polygon className="d" points="294.46 314.54 310.96 279.95 350.71 298.04 294.46 314.54"/>
                      <polygon className="e" points="149.57 421.67 159.11 340.97 96.9 342.76 149.57 421.67"/>
                      <polygon className="e" points="348.72 340.97 358.26 421.67 410.93 342.76 348.72 340.97"/>
                      <polygon className="e" points="396.03 252.13 284.32 257.1 294.66 314.54 311.16 279.95 350.91 298.04 396.03 252.13"/>
                      <polygon className="e" points="157.12 298.04 196.87 279.95 213.17 314.54 223.7 257.1 111.8 252.13 157.12 298.04"/>
                      <polygon className="f" points="111.8 252.13 158.71 343.55 157.12 298.04 111.8 252.13"/>
                      <polygon className="f" points="350.91 298.04 348.92 343.55 396.03 252.13 350.91 298.04"/>
                      <polygon className="f" points="223.7 257.1 213.17 314.54 226.29 382.31 229.27 293.07 223.7 257.1"/>
                      <polygon className="f" points="284.32 257.1 278.96 292.87 281.34 382.31 294.66 314.54 284.32 257.1"/>
                      <polygon className="g" points="294.66 314.54 281.34 382.31 290.88 388.87 348.92 343.55 350.91 298.04 294.66 314.54"/>
                      <polygon className="g" points="157.12 298.04 158.71 343.55 216.75 388.87 226.29 382.31 213.17 314.54 157.12 298.04"/>
                      <polygon className="h" points="295.65 451.28 296.25 432.8 291.28 428.42 216.35 428.42 211.78 432.8 212.18 451.28 149.57 421.67 171.43 439.55 215.75 470.36 291.88 470.36 336.4 439.55 358.26 421.67 295.65 451.28"/>
                      <polygon className="i" points="290.88 388.87 281.34 382.31 226.29 382.31 216.75 388.87 211.78 432.8 216.35 428.42 291.28 428.42 296.25 432.8 290.88 388.87"/>
                      <polygon className="j" points="490.44 156.92 507.33 75.83 482.09 0.5 290.88 142.41 364.42 204.62 468.37 235.03 491.43 208.2 481.49 201.05 497.39 186.54 485.07 177 500.97 164.87 490.44 156.92"/>
                      <polygon className="j" points="0.5 75.83 17.39 156.92 6.66 164.87 22.56 177 10.44 186.54 26.34 201.05 16.4 208.2 39.26 235.03 143.21 204.62 216.75 142.41 25.54 0.5 0.5 75.83"/>
                      <polygon className="g" points="468.37 235.03 364.42 204.62 396.03 252.13 348.92 343.55 410.93 342.76 503.36 342.76 468.37 235.03"/>
                      <polygon className="g" points="143.21 204.62 39.26 235.03 4.67 342.76 96.9 342.76 158.71 343.55 111.8 252.13 143.21 204.62"/>
                      <polygon className="g" points="284.32 257.1 290.88 142.41 321.1 60.72 186.93 60.72 216.75 142.41 223.7 257.1 226.09 293.27 226.29 382.31 281.34 382.31 281.74 293.27 284.32 257.1"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/5 mt-12 pt-8 text-center">
          <p className="text-white text-sm">
            © 2025 Gen-Plasma Collection. Powered by <a href="https://www.plasma.to" target="_blank" rel="noopener noreferrer" className="text-forest-300 hover:text-forest-400 transition-colors font-medium">Plasma</a> blockchain.
          </p>
        </div>
      </div>
    </footer>
  );
}
