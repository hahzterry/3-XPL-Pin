'use client';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import CustomConnectButton from './CustomConnectButton';
export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const pathname = usePathname();
  useEffect(() => {
    setMounted(true);
  }, []);
  const getSubtitle = () => {
    if (pathname?.startsWith('/create')) return 'Create';
    if (pathname?.startsWith('/explore')) return 'Explore';
    if (pathname?.startsWith('/wallet')) return 'Wallet';
    if (pathname?.startsWith('/inscriptions')) return 'Inscriptions';
    return 'Collection';
  };
  const isActive = (path: string) => {
    if (path === '/collection') {
      return pathname === '/collection' || pathname === '/';
    }
    return pathname?.startsWith(path);
  };
  const navItems = [
    { label: 'Mint', href: '/#mint' },
    { label: 'Collection', href: '/collection' },
    { label: 'Create', href: '/create' },
    { label: 'Explore', href: '/explore' },
    { label: 'Inscriptions', href: '/inscriptions' },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/10 bg-black/70 backdrop-blur-2xl">
      {/* Plasma glow */}
      <div className="absolute inset-x-0 h-px pointer-events-none -bottom-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
      <div className="container px-6 py-4 mx-auto">
        <div className="flex items-center justify-between gap-6">
          {/* BRAND */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="relative">
              <div className="absolute inset-0 transition-opacity duration-300 opacity-0 rounded-xl bg-cyan-400/30 blur-xl group-hover:opacity-100" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/15 via-white/5 to-violet-500/15 shadow-[0_0_25px_rgba(34,211,238,0.12)]">
                <img
                  src="/logo.svg"
                  alt="Gen-Plasma Logo"
                  className="w-8 h-8 filter brightness-0 invert"
                />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  XPL.3WORDPIN
                </span>
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80 sm:inline">
                  {getSubtitle()}
                </span>
              </div>
              <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.28em] text-white/35">
                RWA
              </span>
            </div>
          </Link>
          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-1 rounded-2xl border border-white/5 bg-white/[0.025] p-1.5 backdrop-blur-xl">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-cyan-400/10 text-cyan-300 shadow-[inset_0_0_20px_rgba(34,211,238,0.06)]'
                      : 'text-white/55 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  )}
                </Link>
              );
            })}
            <a
              href="https://matcha.xyz/?preset=popular&networks=9745"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white/55 transition-all hover:bg-violet-400/10 hover:text-violet-300"
            >
              Swap
            </a>
            <a
              href="https://stargate.finance/bridge?dstChain=plasma&dstToken=0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white/55 transition-all hover:bg-cyan-400/10 hover:text-cyan-300"
            >
              Bridge
            </a>
          </nav>
          {/* WALLET ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {mounted && isConnected && (
              <Link href="/wallet">
                <button className="group relative overflow-hidden rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition-all duration-200 hover:border-cyan-300/50 hover:bg-cyan-400/15 hover:text-cyan-200 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)]">
                  <span className="relative z-10">My Wallet</span>
                  <span className="absolute inset-0 transition-transform duration-500 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full" />
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
