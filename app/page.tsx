'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [wordPin, setWordPin] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const normalized = wordPin
      .replace(/^\/\/\//, '')
      .trim()
      .toLowerCase();

    if (!normalized) return;

    router.push(`/p/${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-350px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-cyan-500/10 rounded-full blur-[180px]" />
        <div className="absolute top-[35%] right-[-300px] w-[700px] h-[700px] bg-violet-500/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-350px] left-[-250px] w-[700px] h-[700px] bg-pink-500/10 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10">

        {/* HEADER */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-2xl">

          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

            <Link href="/" className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-300 via-white to-pink-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <span className="text-black font-black text-lg">
                  X
                </span>
              </div>

              <div>
                <div className="text-xl font-black tracking-tight">
                  XPLBNB
                </div>

                <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/70">
                  Built on Plasma
                </div>
              </div>

            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm">

              <a
                href="#problem"
                className="text-gray-400 hover:text-white transition"
              >
                Why XPLBNB
              </a>

              <a
                href="#solutions"
                className="text-gray-400 hover:text-white transition"
              >
                Solutions
              </a>

              <a
                href="#how-it-works"
                className="text-gray-400 hover:text-white transition"
              >
                How It Works
              </a>

              <Link
                href="/explore"
                className="px-5 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-cyan-100 transition"
              >
                Explore
              </Link>

            </nav>

          </div>
        </header>

        <main>

          {/* HERO */}
          <section className="max-w-7xl mx-auto px-6 pt-24 pb-28 md:pt-36 md:pb-36">

            <div className="max-w-5xl mx-auto text-center">

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 text-sm font-medium">

                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />

                The next generation of location-based commerce

              </div>

              <h1 className="mt-8 text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.92]">

                Airbnb.
                <br />

                Uber.
                <br />

                DoorDash.

                <br />

                <span className="bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent">
                  Reimagined around the place.
                </span>

              </h1>

              <p className="mt-8 max-w-3xl mx-auto text-xl md:text-2xl text-gray-400 leading-relaxed">

                XPLBNB connects the <span className="text-white font-semibold">person,
                place, service, booking and payment</span> in one simple
                experience — powered by Plasma and 3-word locations.

              </p>

              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">

                <Link
                  href="/explore"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-300 to-pink-400 text-black font-black text-lg hover:opacity-90 transition"
                >
                  Explore the Marketplace
                </Link>

                <Link
                  href="/create"
                  className="px-8 py-4 rounded-xl border border-white/15 bg-white/5 font-bold text-lg hover:bg-white/10 transition"
                >
                  List Your Business
                </Link>

              </div>

              <p className="mt-5 text-sm text-gray-600">
                Built for hosts, drivers, passengers, delivery providers and customers.
              </p>

            </div>


            {/* VALUE STRIP */}
            <div className="mt-20 grid md:grid-cols-4 gap-4 max-w-6xl mx-auto">

              <ValueCard
                icon="🏠"
                title="Hosts"
                text="Own the relationship with your guests."
              />

              <ValueCard
                icon="🚗"
                title="Drivers"
                text="Make pickup and drop-off locations precise."
              />

              <ValueCard
                icon="📦"
                title="Delivery"
                text="Send customers directly to the right place."
              />

              <ValueCard
                icon="👤"
                title="Customers"
                text="Find, verify and book with less friction."
              />

            </div>

          </section>


          {/* PROBLEM */}
          <section
            id="problem"
            className="border-y border-white/10 bg-white/[0.025]"
          >

            <div className="max-w-6xl mx-auto px-6 py-24">

              <div className="max-w-3xl">

                <p className="text-pink-400 font-bold uppercase tracking-[0.2em] text-sm">
                  The problem
                </p>

                <h2 className="mt-4 text-4xl md:text-6xl font-black leading-tight">
                  Today's marketplaces
                  <span className="text-gray-500"> are fragmented.</span>
                </h2>

                <p className="mt-6 text-xl text-gray-400 leading-relaxed">
                  You need one app to discover a place, another to communicate,
                  another to navigate, another to book and another to move money.
                </p>

              </div>


              <div className="mt-16 grid md:grid-cols-2 gap-6">

                <Problem
                  icon="🏠"
                  title="Hosts"
                  problem="Depend on a platform to control the customer relationship."
                  solution="XPLBNB gives the property a persistent digital location that can connect discovery, media, availability and booking."
                />

                <Problem
                  icon="🚗"
                  title="Drivers & Riders"
                  problem="Pickup locations are often vague, confusing or difficult to communicate."
                  solution="A 3-word location gives everyone a simple destination they can share."
                />

                <Problem
                  icon="📦"
                  title="Delivery"
                  problem="Addresses don't always tell a driver exactly where to meet someone."
                  solution="Share a precise 3-word destination for the handoff."
                />

                <Problem
                  icon="💳"
                  title="Payments"
                  problem="Traditional platforms sit between users and their transactions."
                  solution="Plasma provides blockchain infrastructure designed for digital transactions and stablecoin payments."
                />

              </div>

            </div>

          </section>


          {/* SOLUTIONS */}
          <section
            id="solutions"
            className="max-w-7xl mx-auto px-6 py-28"
          >

            <div className="text-center max-w-4xl mx-auto">

              <p className="text-cyan-400 font-bold uppercase tracking-[0.2em] text-sm">
                One infrastructure
              </p>

              <h2 className="mt-4 text-4xl md:text-6xl font-black">
                One place can power
                <br />
                <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                  an entire local economy.
                </span>
              </h2>

              <p className="mt-6 text-xl text-gray-400">
                The same 3-word location can represent a home, a vehicle,
                a restaurant, a delivery point, a business or an event.
              </p>

            </div>


            <div className="mt-20 grid lg:grid-cols-3 gap-6">

              <SolutionCard
                icon="🏠"
                title="XPLBNB"
                headline="A new way to book stays."
                points={[
                  'Persistent 3-word property address',
                  'Direct discovery',
                  'Availability and booking',
                  'Video-first property discovery',
                  'Digital payments',
                ]}
              />

              <SolutionCard
                icon="🚗"
                title="XPL Ride"
                headline="A better pickup experience."
                points={[
                  'Share your exact pickup location',
                  'Passenger and driver use the same destination',
                  'Reduce location confusion',
                  'Connect rides to digital payments',
                  'Portable location identity',
                ]}
              />

              <SolutionCard
                icon="📦"
                title="XPL Delivery"
                headline="Know exactly where it goes."
                points={[
                  'Precise delivery destinations',
                  'Simple customer sharing',
                  'Better handoffs',
                  'Connect delivery to a place',
                  'Digital transaction infrastructure',
                ]}
              />

            </div>

          </section>


          {/* SWITCH MOMENT */}
          <section className="border-y border-white/10 bg-gradient-to-b from-cyan-400/[0.04] to-transparent">

            <div className="max-w-5xl mx-auto px-6 py-28 text-center">

              <p className="text-cyan-400 font-bold uppercase tracking-[0.2em] text-sm">
                The reason to switch
              </p>

              <h2 className="mt-5 text-4xl md:text-6xl font-black leading-tight">
                Don't just list your business.
                <br />

                <span className="text-gray-400">
                  Own the place people find you.
                </span>
              </h2>

              <p className="mt-8 max-w-3xl mx-auto text-xl text-gray-400 leading-relaxed">
                Your 3WORDPIN can become the digital doorway to your
                property, vehicle, service, delivery point or business.
                Share one address everywhere.
              </p>

              <div className="mt-12 grid sm:grid-cols-3 gap-4 text-left">

                <SwitchCard
                  before="Airbnb"
                  after="XPLBNB"
                  text="Discover → verify → book"
                />

                <SwitchCard
                  before="Ride apps"
                  after="XPL Ride"
                  text="Find → navigate → meet"
                />

                <SwitchCard
                  before="Delivery apps"
                  after="XPL Delivery"
                  text="Order → locate → deliver"
                />

              </div>

            </div>

          </section>


          {/* 3 WORD PIN */}
          <section className="max-w-6xl mx-auto px-6 py-28">

            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div>

                <p className="text-pink-400 font-bold uppercase tracking-[0.2em] text-sm">
                  The simple layer
                </p>

                <h2 className="mt-4 text-4xl md:text-6xl font-black leading-tight">
                  Three words
                  <br />
                  become the
                  <br />
                  <span className="text-cyan-300">
                    destination.
                  </span>
                </h2>

                <p className="mt-6 text-lg text-gray-400 leading-relaxed">
                  Instead of explaining where a person, property,
                  vehicle or delivery is located, simply share a
                  3-word address.
                </p>

                <div className="mt-8">

                  <form onSubmit={handleSearch}>

                    <div className="flex gap-3 p-2 rounded-2xl border border-white/10 bg-white/[0.03]">

                      <div className="flex-1 flex items-center px-4">

                        <span className="text-cyan-400 font-mono mr-2">
                          ///
                        </span>

                        <input
                          type="text"
                          value={wordPin}
                          onChange={(e) => setWordPin(e.target.value)}
                          placeholder="word.word.word"
                          className="w-full bg-transparent outline-none text-white placeholder-gray-600"
                        />

                      </div>

                      <button
                        type="submit"
                        className="px-6 py-3 rounded-xl bg-cyan-300 text-black font-black hover:bg-cyan-200 transition"
                      >
                        Find
                      </button>

                    </div>

                  </form>

                </div>

              </div>


              <div className="relative">

                <div className="absolute inset-0 bg-cyan-400/10 blur-[100px]" />

                <div className="relative rounded-3xl border border-cyan-400/20 bg-black/70 p-8 md:p-10 shadow-[0_0_80px_rgba(34,211,238,0.08)]">

                  <div className="text-xs uppercase tracking-[0.2em] text-gray-600">
                    Digital destination
                  </div>

                  <div className="mt-5 text-3xl md:text-4xl font-mono font-bold text-cyan-300 break-all">
                    ///home.blue.atlanta
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">

                    <Mini
                      icon="🏠"
                      title="Property"
                      text="Available"
                    />

                    <Mini
                      icon="🎥"
                      title="Media"
                      text="Watch"
                    />

                    <Mini
                      icon="📅"
                      title="Booking"
                      text="Reserve"
                    />

                    <Mini
                      icon="💳"
                      title="Payment"
                      text="Digital"
                    />

                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-cyan-400/5 border border-cyan-400/10 text-sm text-gray-400">
                    One location can connect discovery, navigation,
                    booking and transactions.
                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* PLASMA */}
          <section className="border-y border-white/10 bg-white/[0.02]">

            <div className="max-w-5xl mx-auto px-6 py-24 text-center">

              <div className="inline-flex items-center px-4 py-2 rounded-full border border-violet-400/20 bg-violet-400/5 text-violet-300 text-sm font-semibold">
                Powered by Plasma
              </div>

              <h2 className="mt-6 text-4xl md:text-6xl font-black">
                Built for a world where
                <br />
                <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                  money moves digitally.
                </span>
              </h2>

              <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-400 leading-relaxed">
                XPLBNB uses Plasma infrastructure to bring
                blockchain-native transactions underneath a
                familiar marketplace experience.
              </p>

              <div className="mt-12 grid md:grid-cols-3 gap-5 text-left">

                <PlasmaCard
                  title="Digital Payments"
                  text="Connect marketplace transactions with blockchain-native payment infrastructure."
                />

                <PlasmaCard
                  title="Global Rails"
                  text="Designed for digital money movement without forcing users to understand the underlying technology."
                />

                <PlasmaCard
                  title="XPL Ecosystem"
                  text="Build location-based applications on infrastructure designed for the next generation of digital finance."
                />

              </div>

            </div>

          </section>


          {/* HOW IT WORKS */}
          <section
            id="how-it-works"
            className="max-w-6xl mx-auto px-6 py-28"
          >

            <div className="text-center">

              <p className="text-cyan-400 font-bold uppercase tracking-[0.2em] text-sm">
                How it works
              </p>

              <h2 className="mt-4 text-4xl md:text-6xl font-black">
                Find. Connect. Book.
              </h2>

            </div>


            <div className="mt-16 grid md:grid-cols-4 gap-5">

              <Step
                number="01"
                title="Create"
                text="Give a real-world place a 3-word address."
              />

              <Step
                number="02"
                title="Discover"
                text="Show the property, vehicle, service or business."
              />

              <Step
                number="03"
                title="Connect"
                text="Let customers navigate, communicate and request."
              />

              <Step
                number="04"
                title="Transact"
                text="Connect bookings and transactions through digital infrastructure."
              />

            </div>

          </section>


          {/* FINAL CTA */}
          <section className="max-w-5xl mx-auto px-6 pb-32">

            <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-white/[0.03] to-pink-400/10 p-10 md:p-20 text-center">

              <div className="absolute inset-0 bg-cyan-400/[0.03] blur-3xl" />

              <div className="relative">

                <p className="text-cyan-300 font-bold uppercase tracking-[0.2em] text-sm">
                  The marketplace is changing
                </p>

                <h2 className="mt-5 text-4xl md:text-7xl font-black leading-tight">
                  What if your
                  <br />
                  location was your
                  <br />
                  <span className="bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent">
                    marketplace?
                  </span>
                </h2>

                <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-400">
                  Create a place. Give it three words.
                  Connect people, services, bookings and transactions.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">

                  <Link
                    href="/create"
                    className="px-8 py-4 rounded-xl bg-white text-black font-black text-lg hover:bg-gray-200 transition"
                  >
                    Create Your 3WORDPIN
                  </Link>

                  <Link
                    href="/explore"
                    className="px-8 py-4 rounded-xl border border-white/15 bg-black/30 font-bold text-lg hover:bg-white/10 transition"
                  >
                    Explore XPLBNB
                  </Link>

                </div>

              </div>

            </div>

          </section>

        </main>


        {/* FOOTER */}
        <footer className="border-t border-white/10">

          <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">

            <div>

              <div className="font-black">
                XPLBNB
              </div>

              <div className="text-sm text-gray-600">
                Find it. Share it. Book it.
              </div>

            </div>

            <div className="text-sm text-gray-600">
              Built on Plasma • © {new Date().getFullYear()} XPLBNB
            </div>

          </div>

        </footer>

      </div>
    </div>
  );
}


/* COMPONENTS */

function ValueCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-cyan-400/20 transition">
      <div className="text-3xl mb-4">{icon}</div>
      <div className="font-bold text-lg">{title}</div>
      <p className="mt-2 text-sm text-gray-500">{text}</p>
    </div>
  );
}


function Problem({
  icon,
  title,
  problem,
  solution,
}: {
  icon: string;
  title: string;
  problem: string;
  solution: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-8">

      <div className="flex items-center gap-4">
        <div className="text-4xl">{icon}</div>
        <h3 className="text-2xl font-black">{title}</h3>
      </div>

      <p className="mt-6 text-gray-500">
        <span className="text-white font-semibold">
          Today:
        </span>{' '}
        {problem}
      </p>

      <p className="mt-4 text-gray-300 leading-relaxed">
        <span className="text-cyan-300 font-semibold">
          XPLBNB:
        </span>{' '}
        {solution}
      </p>

    </div>
  );
}


function SolutionCard({
  icon,
  title,
  headline,
  points,
}: {
  icon: string;
  title: string;
  headline: string;
  points: string[];
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 hover:border-cyan-400/20 transition">

      <div className="text-5xl mb-6">{icon}</div>

      <div className="text-sm uppercase tracking-widest text-cyan-300 font-bold">
        {title}
      </div>

      <h3 className="mt-3 text-2xl font-black">
        {headline}
      </h3>

      <div className="mt-8 space-y-4">

        {points.map((point) => (
          <div key={point} className="flex gap-3 text-gray-400">
            <span className="text-cyan-300">✓</span>
            <span>{point}</span>
          </div>
        ))}

      </div>

    </div>
  );
}


function SwitchCard({
  before,
  after,
  text,
}: {
  before: string;
  after: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">

      <div className="text-sm text-gray-600">
        Instead of
      </div>

      <div className="mt-1 text-gray-500 font-semibold">
        {before}
      </div>

      <div className="my-3 text-cyan-300 text-xl">
        ↓
      </div>

      <div className="text-xl font-black">
        {after}
      </div>

      <div className="mt-2 text-sm text-gray-500">
        {text}
      </div>

    </div>
  );
}


function Mini({
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
      <div className="text-xl">{icon}</div>
      <div className="mt-2 font-bold">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{text}</div>
    </div>
  );
}


function PlasmaCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-violet-400/10 bg-violet-400/[0.03] p-6">

      <div className="text-lg font-bold text-violet-300">
        {title}
      </div>

      <p className="mt-3 text-gray-500 leading-relaxed">
        {text}
      </p>

    </div>
  );
}


function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">

      <div className="font-mono text-cyan-400 text-sm">
        {number}
      </div>

      <h3 className="mt-6 text-2xl font-black">
        {title}
      </h3>

      <p className="mt-3 text-gray-500 leading-relaxed">
        {text}
      </p>

    </div>
  );
}
