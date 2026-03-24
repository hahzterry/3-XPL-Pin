import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { injectedWallet, metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';

// Define Plasma Mainnet
export const plasmaMainnet = {
  id: 9745,
  name: 'Plasma Mainnet Beta',
  network: 'plasma',
  nativeCurrency: {
    decimals: 18,
    name: 'XPL',
    symbol: 'XPL',
  },
  rpcUrls: {
    public: { http: ['https://rpc.plasma.to'] },
    default: { http: ['https://rpc.plasma.to'] },
  },
  blockExplorers: {
    default: { name: 'Plasmascan', url: 'https://plasmascan.to' },
  },
} as const;

// Define Plasma Testnet
export const plasmaTestnet = {
  id: 9746,
  name: 'Plasma Testnet',
  network: 'plasma-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'XPL',
    symbol: 'XPL',
  },
  rpcUrls: {
    public: { http: ['https://testnet-rpc.plasma.to'] },
    default: { http: ['https://testnet-rpc.plasma.to'] },
  },
  blockExplorers: {
    default: { name: 'Plasmascan Testnet', url: 'https://testnet-plasmascan.to' },
  },
} as const;

const { chains, publicClient } = configureChains(
  [plasmaMainnet, plasmaTestnet],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Gen-Plasma NFT Collection',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'fallback-project-id',
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains };
