import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingScreen from '../components/LoadingScreen';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gen-Plasma | Generative Plasma Art Collection',
  description: 'Gen-Plasma: A unique generative art collection inspired by plasma physics. Each NFT is a one-of-a-kind manifestation of fluid energy fields, turbulent flows, and volumetric light on the Plasma blockchain.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' }
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LoadingScreen />
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
