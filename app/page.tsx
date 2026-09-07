'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [wordPin, setWordPin] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = wordPin.replace(/^\/\/\//, '').trim().toLowerCase();
    if (!normalized) return;
    router.push(`/p/${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="min-h-screen overflow-hidden text-white bg-black">

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-350px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-cyan-500/10 rounded-full blur-[180px]" />
        <div className="absolute top-[35%] right-[-300px] w-[700px] h-[700px] bg-violet-500/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-350px] left-[-250px] w-[700px] h-[700px] bg-pink-500/10 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10">

        {/* HEADER – simplified */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-2xl">
          <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-300 via-white to-pink-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <span className="text-lg font-black text-black">X</span>
              </div>
              <div>
                <div className="text-xl font-black tracking-tight">XPL.</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/70">Built on Plasma</div>
              </div>
            </Link>
            <nav className="items-center hidden gap-8 text-sm md:flex">
              <Link href="/explore" className="px-5 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-cyan-100 transition">
                Explore
              </Link>
            </nav>
          </div>
        </header>

        <main>

          {/* HERO – new simplified version */}
          <section className="px-6 pt-24 mx-auto max-w-7xl pb-28 md:pt-36 md:pb-36">
            <div className="max-w-6xl mx-auto text-center">

              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-full border-cyan-400/20 bg-cyan-400/5 text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                No middleman fees
              </div>

              {/* H1 */}
              <h1 className="mt-8 text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]">
                Turn a 16x16 ft unique
                <br />
                <span className="text-transparent bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text">
                  3-word address
                </span>
                <br />
                into digital real estate
                <span className="block mt-2 font-mono text-4xl text-cyan-300 md:text-6xl">
                  ///keep.it.simple
                </span>
              </h1>

              {/* Description */}
              <p className="max-w-4xl mx-auto mt-8 text-xl font-semibold leading-relaxed text-gray-200 md:text-2xl lg:text-3xl">
                Be the first to own your 3 Word Pin. Rent it for passive income,
                flip it to the highest bidder, or spend it as{' '}
                <a href="https://www.plasma.org/" target="_blank" rel="noopener noreferrer" className="underline text-cyan-300">
                  XPL
                </a>
                , all for just pennies per transaction.
              </p>

              {/* Three Buttons */}
              <div className="flex flex-wrap justify-center gap-4 mt-10">
                <a
                  href="https://3wordpin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 font-bold text-white transition border rounded-xl bg-white/10 border-white/20 hover:bg-white/20"
                >
                  🗺️ Find a 3 Word Pin
                </a>
                <Link
                  href="/create"
                  className="px-8 py-4 font-black text-black transition rounded-xl bg-gradient-to-r from-cyan-300 to-pink-400 hover:opacity-90"
                >
                  🪙 Own a 3 Word Pin
                </Link>
                <a
                  href="https://social.3wordpin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 font-bold text-pink-300 transition border rounded-xl bg-pink-400/20 border-pink-400/30 hover:bg-pink-400/30"
                >
                  💬 Create 3 Word Pin Social
                </a>
                                <a
                  href="https://matcha.xyz/?preset=popular&networks=9745"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 font-bold text-pink-300 transition border rounded-xl bg-pink-400/20 border-pink-400/30 hover:bg-pink-400/30"
                >
                  🔁 Swap
                </a>
                                <a
                  href="https://stargate.finance/?dstChain=plasma&dstToken=0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 font-bold text-pink-300 transition border rounded-xl bg-pink-400/20 border-pink-400/30 hover:bg-pink-400/30"
                >
                  🌉 Bridge
                </a>
              </div>

              {/* Quick stats or trust? */}
              <p className="mt-6 text-sm text-gray-500">
                Own a piece of the new 3 Word Pin address economy.
              </p>
            </div>
          </section>

          {/* USE CASES: Hosts, Drivers, Delivery, POS */}
          <section className="px-6 mx-auto max-w-7xl pb-28">
            <div className="grid gap-6 md:grid-cols-2">

              <UseCaseCard
                icon="🏠"
                title="Hosts"
                traditional="Airbnb charges hosts up to 15.5% in service fees, plus guests pay additional fees at checkout."
                xpl="XPLbnb charges hosts and guests 0.1% in transaction fees."
                color="cyan"
              />

              <UseCaseCard
                icon="🚗"
                title="Drivers & Riders"
                traditional="Uber pays drivers a 70/30 split for every rideshare."
                xpl="XPL Drivers keep 100% for every rideshare and their customers pay 0.1% in transaction fees."
                color="violet"
              />

              <UseCaseCard
                icon="📦"
                title="Delivery"
                traditional="DoorDash merchant delivery commissions range from 15% to 30% depending on the plan. Delivery drivers earn $12-18 per hour using their own car."
                xpl="XPL Dash merchant has $0 commissions and drivers earn 100% of the delivery fee."
                color="pink"
              />

              <UseCaseCard
                icon="🏪"
                title="POS"
                traditional="Traditional business owners pay $3.00 per $100 sale."
                xpl="XPL business owners pay just $0.10."
                color="cyan"
              />

            </div>
          </section>

          {/* SOCIAL */}
          <section className="border-y border-white/10 bg-white/[0.02]">
            <div className="max-w-5xl px-6 py-24 mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 text-sm font-semibold text-pink-300 border rounded-full border-pink-400/20 bg-pink-400/5">
                💬 SOCIAL
              </div>
              <h2 className="mt-6 text-4xl font-black md:text-6xl">
                The communication layer for
                <br />
                <span className="text-transparent bg-gradient-to-r from-cyan-300 to-pink-400 bg-clip-text">
                  any 3-word address
                </span>
              </h2>
              <p className="max-w-3xl mx-auto mt-6 text-xl leading-relaxed text-gray-400">
                Turn any 3 Word Pin into a forum, feed, Q&A or ideas channel.
                Every post reaches followers in real time. Embed TikTok video reviews
                directly into any social channel.
              </p>
              <div className="mt-10">
                <a
                  href="https://social.3wordpin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 font-bold text-pink-300 transition border rounded-xl bg-pink-400/20 border-pink-400/30 hover:bg-pink-400/30"
                >
                  💬 3 Word Pin Social
                </a>
              </div>
            </div>
          </section>

          {/* VERIFY */}
          <section className="max-w-5xl px-6 py-24 mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 text-sm font-semibold border rounded-full border-cyan-400/20 bg-cyan-400/5 text-cyan-300">
              🔎 VERIFY
            </div>
            <h2 className="mt-6 text-4xl font-black md:text-6xl">
              Verify any payment transaction
            </h2>
            <div className="mt-10">
              <a
                href="https://plasmascan.to/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 font-bold transition border rounded-xl bg-cyan-400/20 border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/30"
              >
                🔎 https://plasmascan.to/
              </a>
            </div>
          </section>

          {/* APP DOWNLOAD — with background video */}
          <section className="relative overflow-hidden border-y border-white/10">
            {/* Background Video */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="object-cover w-full h-full opacity-20"
                poster="https://img.pikbest.com/backgrounds/20211015/abstract-neon-lights-dark-background-video_6229031.jpg"
              >
                <source
                  src="https://x.com/Plasma/status/2067215787945779394/video/1"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
              {/* Dark overlay for readability */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl px-6 py-24 mx-auto text-center">
              <h2 className="text-4xl font-black md:text-6xl">
                Get the XPL app
              </h2>
              <p className="mt-6 text-xl text-gray-300">
                Download the app and get a card.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-10">
                <a
                  href="https://www.plasma.org/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 font-black text-black transition bg-white rounded-xl hover:bg-gray-200"
                >
                  Download App
                </a>
                <a
                  href="https://www.plasma.org/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 font-bold text-white transition border rounded-xl border-white/20 bg-white/5 hover:bg-white/10"
                >
                  Get a Card
                </a>
              </div>
              <p className="mt-6 text-2xl font-bold text-cyan-300">
                20% back on flights, hotels, and more
              </p>
              <p className="mt-2 text-sm text-gray-400">
                <a href="https://www.plasma.org/download/travel" target="_blank" rel="noopener noreferrer" className="underline transition hover:text-white">
                  https://www.plasma.org/download/travel
                </a>
              </p>
            </div>
          </section>

        </main>

        {/* FOOTER */}
        <footer className="border-t border-white/10">
          <div className="flex flex-col items-center justify-between gap-4 px-6 py-10 mx-auto max-w-7xl md:flex-row">
            <div>
              <div className="font-black">XPL.</div>
              <div className="text-sm text-gray-600">Find it. Own it. Sell it.</div>
            </div>
            <div className="text-sm text-gray-600">
              Built on Plasma • © {new Date().getFullYear()} XPL.3WordPin.com
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

/* Helper Component: UseCaseCard */
function UseCaseCard({
  icon,
  title,
  traditional,
  xpl,
  color,
}: {
  icon: string;
  title: string;
  traditional: string;
  xpl: string;
  color: 'cyan' | 'violet' | 'pink';
}) {
  const colorMap = {
    cyan: 'border-cyan-400/20 bg-cyan-400/[0.04] text-cyan-300',
    violet: 'border-violet-400/20 bg-violet-400/[0.04] text-violet-300',
    pink: 'border-pink-400/20 bg-pink-400/[0.04] text-pink-300',
  };
  return (
    <div className={`rounded-3xl border p-8 ${colorMap[color]}`}>
      <div className="flex items-center gap-4">
        <div className="text-4xl">{icon}</div>
        <h3 className="text-2xl font-black">{title}</h3>
      </div>
      <p className="mt-6 leading-relaxed text-gray-400">
        <span className="font-semibold text-white">Traditional:</span> {traditional}
      </p>
      <p className="mt-4 leading-relaxed text-gray-300">
        <span className={`font-semibold ${colorMap[color].split(' ').find(c => c.startsWith('text-'))}`}>
          XPL:
        </span>{' '}
        {xpl}
      </p>
    </div>
  );
}