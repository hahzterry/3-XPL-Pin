'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [wordPin, setWordPin] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const normalized = wordPin
      .replace(/^\/\/\//, '')
      .trim()
      .toLowerCase();

    if (!normalized) return;

    window.location.href = `/p/${encodeURIComponent(normalized)}`;
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-300px] right-[-200px] w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10">

        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-xl bg-black/40">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center font-black text-black">
                3
              </div>

              <div>
                <div className="text-xl font-bold tracking-tight">
                  3WORDPIN
                </div>
                <div className="text-xs text-gray-500">
                  Find it. Share it. Book it.
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
              <a href="#how-it-works" className="hover:text-white transition">
                How It Works
              </a>

              <a href="#marketplace" className="hover:text-white transition">
                Marketplace
              </a>

              <a href="#providers" className="hover:text-white transition">
                List Something
              </a>

              <Link
                href="/explore"
                className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
              >
                Explore
              </Link>
            </nav>

          </div>
        </header>

        <main>

          {/* HERO */}
          <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-32">

            <div className="max-w-4xl mx-auto text-center">

              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 text-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                A simpler way to find places and services
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95]">
                Every place.
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent">
                  Three words.
                </span>
              </h1>

              <p className="mt-8 text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                One simple 3-word address for a place, rental,
                vehicle, service, business, event or anything
                you want people to find.
              </p>

              {/* Search */}
              <form
                onSubmit={handleSearch}
                className="mt-10 max-w-2xl mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">

                  <div className="flex-1 flex items-center px-4">
                    <span className="text-cyan-400 font-mono text-lg mr-2">
                      ///
                    </span>

                    <input
                      type="text"
                      value={wordPin}
                      onChange={(e) => setWordPin(e.target.value)}
                      placeholder="word.word.word"
                      className="w-full bg-transparent outline-none text-white placeholder-gray-600 text-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-7 py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-bold hover:opacity-90 transition"
                  >
                    Find It
                  </button>

                </div>

                <p className="mt-3 text-sm text-gray-600">
                  Example: ///house.blue.atlanta
                </p>
              </form>

            </div>

            {/* Simple visual */}
            <div className="mt-20 max-w-5xl mx-auto">

              <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10 overflow-hidden">

                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-pink-500/5" />

                <div className="relative grid md:grid-cols-3 gap-5">

                  <ExampleCard
                    pin="///home.blue.atlanta"
                    icon="🏠"
                    title="Stay"
                    description="Find a place to stay."
                  />

                  <ExampleCard
                    pin="///ride.fast.atlanta"
                    icon="🚗"
                    title="Ride"
                    description="Find a vehicle or driver."
                  />

                  <ExampleCard
                    pin="///help.fix.memphis"
                    icon="🛠️"
                    title="Service"
                    description="Find someone who can help."
                  />

                </div>

              </div>

            </div>

          </section>

          {/* HOW IT WORKS */}
          <section
            id="how-it-works"
            className="border-y border-white/10 bg-white/[0.02]"
          >
            <div className="max-w-6xl mx-auto px-6 py-24">

              <div className="text-center max-w-3xl mx-auto mb-16">

                <p className="text-cyan-400 font-semibold uppercase tracking-widest text-sm mb-4">
                  How it works
                </p>

                <h2 className="text-4xl md:text-6xl font-black">
                  Three words.
                  <br />
                  That's it.
                </h2>

                <p className="mt-6 text-xl text-gray-400">
                  No complicated addresses. No guessing where
                  someone is. Just share three words.
                </p>

              </div>

              <div className="grid md:grid-cols-3 gap-8">

                <Step
                  number="01"
                  icon="📍"
                  title="Create a place"
                  description="Give any location a simple three-word address."
                />

                <Step
                  number="02"
                  icon="🎥"
                  title="Show it"
                  description="Add TikTok videos so people can see the place, product or service for themselves."
                />

                <Step
                  number="03"
                  icon="🤝"
                  title="Book it"
                  description="Let people request rentals, rides, deliveries and services directly from the listing."
                />

              </div>

            </div>
          </section>

          {/* MARKETPLACE */}
          <section id="marketplace" className="max-w-6xl mx-auto px-6 py-24">

            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div>

                <p className="text-pink-400 font-semibold uppercase tracking-widest text-sm mb-4">
                  One location. Many possibilities.
                </p>

                <h2 className="text-4xl md:text-6xl font-black leading-tight">
                  Your address becomes your marketplace.
                </h2>

                <p className="mt-6 text-lg text-gray-400 leading-relaxed">
                  A 3WORDPIN can connect people to almost anything
                  happening at a location.
                </p>

                <div className="mt-8 space-y-4">

                  <Feature icon="🏠" text="Homes, apartments & rooms" />
                  <Feature icon="🚙" text="Vehicles & equipment" />
                  <Feature icon="🚗" text="Drivers & rides" />
                  <Feature icon="📦" text="Pickup & delivery" />
                  <Feature icon="🛠️" text="Local services" />
                  <Feature icon="🎉" text="Businesses & events" />

                </div>

              </div>

              <div className="relative">

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">

                  <div className="text-sm text-gray-500 mb-3">
                    LOCATION
                  </div>

                  <div className="text-2xl md:text-3xl font-mono text-cyan-300 break-all">
                    ///house.blue.atlanta
                  </div>

                  <div className="mt-8 h-px bg-white/10" />

                  <div className="mt-8 grid grid-cols-2 gap-4">

                    <MiniCard
                      icon="🏠"
                      title="Rental"
                      text="Available"
                    />

                    <MiniCard
                      icon="🎥"
                      title="TikTok"
                      text="12 videos"
                    />

                    <MiniCard
                      icon="📅"
                      title="Availability"
                      text="View dates"
                    />

                    <MiniCard
                      icon="📍"
                      title="Location"
                      text="Find it"
                    />

                  </div>

                  <button className="mt-6 w-full py-4 rounded-xl bg-white text-black font-bold">
                    View Place
                  </button>

                </div>

              </div>

            </div>

          </section>

          {/* TIKTOK DIFFERENTIATOR */}
          <section className="border-y border-white/10 bg-gradient-to-b from-pink-500/[0.04] to-transparent">

            <div className="max-w-6xl mx-auto px-6 py-24">

              <div className="max-w-3xl mx-auto text-center">

                <div className="text-6xl mb-6">
                  🎥
                </div>

                <h2 className="text-4xl md:text-6xl font-black">
                  See it before you book it.
                </h2>

                <p className="mt-6 text-xl text-gray-400 leading-relaxed">
                  Instead of relying on stars and written reviews,
                  listings can show real TikTok videos from people
                  who have actually experienced the place, product
                  or service.
                </p>

                <div className="mt-10 inline-flex items-center gap-3 px-6 py-4 rounded-2xl border border-pink-400/20 bg-pink-400/5">
                  <span className="text-2xl">▶️</span>
                  <span className="font-semibold">
                    Watch. Decide. Book.
                  </span>
                </div>

              </div>

            </div>

          </section>

          {/* PROVIDERS */}
          <section id="providers" className="max-w-6xl mx-auto px-6 py-24">

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-16 text-center">

              <div className="text-5xl mb-6">
                🚀
              </div>

              <h2 className="text-4xl md:text-6xl font-black">
                Have something to offer?
              </h2>

              <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
                Create a 3WORDPIN listing and give people one simple
                place to discover what you offer.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">

                <Link
                  href="/create"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-bold"
                >
                  Create a Listing
                </Link>

                <Link
                  href="/explore"
                  className="px-8 py-4 rounded-xl border border-white/15 hover:bg-white/5 font-semibold"
                >
                  Explore Listings
                </Link>

              </div>

            </div>

          </section>

          {/* FINAL CTA */}
          <section className="max-w-4xl mx-auto px-6 pb-32 text-center">

            <h2 className="text-5xl md:text-7xl font-black">
              Stop explaining
              <br />
              where you are.
            </h2>

            <p className="mt-6 text-xl text-gray-400">
              Just share three words.
            </p>

            <div className="mt-10">

              <Link
                href="/create"
                className="inline-flex px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition"
              >
                Create Your 3WORDPIN
              </Link>

            </div>

          </section>

        </main>

        {/* FOOTER */}
        <footer className="border-t border-white/10">

          <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">

            <div>
              <div className="font-bold">
                3WORDPIN
              </div>

              <div className="text-sm text-gray-600">
                Find it. Share it. Book it.
              </div>
            </div>

            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} 3WORDPIN
            </div>

          </div>

        </footer>

      </div>
    </div>
  );
}


/* ----------------------------- */
/* Components                    */
/* ----------------------------- */

function ExampleCard({
  pin,
  icon,
  title,
  description,
}: {
  pin: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-6 hover:border-cyan-400/30 transition">

      <div className="text-4xl mb-5">
        {icon}
      </div>

      <div className="text-sm text-gray-500 mb-2">
        {title}
      </div>

      <div className="font-mono text-cyan-300 text-sm break-all">
        {pin}
      </div>

      <p className="mt-4 text-gray-500 text-sm">
        {description}
      </p>

    </div>
  );
}


function Step({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-black/30 p-8">

      <div className="flex items-center justify-between mb-8">

        <span className="text-sm font-mono text-gray-600">
          {number}
        </span>

        <span className="text-4xl">
          {icon}
        </span>

      </div>

      <h3 className="text-2xl font-bold mb-3">
        {title}
      </h3>

      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>

    </div>
  );
}


function Feature({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4">

      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
        {icon}
      </div>

      <span className="text-gray-300">
        {text}
      </span>

    </div>
  );
}


function MiniCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 p-4">

      <div className="text-xl mb-2">
        {icon}
      </div>

      <div className="font-semibold">
        {title}
      </div>

      <div className="text-sm text-gray-500 mt-1">
        {text}
      </div>

    </div>
  );
}
