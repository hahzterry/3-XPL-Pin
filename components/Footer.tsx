'use client';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-black border-t border-cyan-400/20 py-14">
      {/* Ambient cyan + pink glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 rounded-full -left-32 h-72 w-72 bg-cyan-400/10 blur-3xl" />
        <div className="absolute top-0 rounded-full -right-32 h-72 w-72 bg-pink-500/10 blur-3xl" />
        <div className="absolute top-0 h-40 -translate-x-1/2 rounded-full left-1/2 w-96 bg-cyan-400/5 blur-3xl" />
      </div>

      <div className="container relative z-10 px-6 mx-auto">

        {/* Main footer */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">

          {/* Brand + Mission */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-6 space-x-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-white/5 shadow-[0_0_25px_rgba(34,211,238,0.15)] backdrop-blur-xl">
                <img
                  src="/logo.png"
                  alt="3 Word Pin"
                  className="w-8 h-8 brightness-0 invert"
                />
              </div>

              <div>
                <span className="text-2xl font-bold tracking-tight text-white">
                  3 WORD PIN XPL
                </span>
                <span className="ml-2 text-sm font-light text-cyan-300">
                  /// KEEP.IT.SIMPLE
                </span>
              </div>
            </div>

            <p className="max-w-xl mb-5 text-lg font-semibold leading-relaxed text-white">
              Three word digital real estate
            </p>

            <p className="max-w-xl text-base leading-relaxed text-white/65">
              3 Word Pin XPL makes it simple to give any 16x16 ft location
              a memorable three word address that anyone can monetize.
  
            </p>

            {/* XPLBNB value proposition */}
            <div className="mt-7 rounded-2xl border border-cyan-400/20 bg-white/[0.03] p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚡</span>
                <h3 className="font-bold text-white">
                  XPL.3WORDPIN
                </h3>
              </div>

              <p className="text-sm leading-relaxed text-white/60">
                A simpler way to promote and connect businesses, creators,
                and locations directly with the people they want to reach
                without relying on a middleman to control the relationship
                or take a middleman fee.
              </p>

              <p className="mt-3 text-sm font-semibold text-cyan-300">
                No middleman fees.
              </p>
            </div>

            {/* Social CTA */}
            <a
              href="https://social.3wordpin.com/pin/s/xpl/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-pink-400/30 bg-pink-400/5 px-5 py-3 text-sm font-semibold text-pink-300 transition-all duration-300 hover:border-pink-300/60 hover:bg-pink-400/10 hover:text-white hover:shadow-[0_0_30px_rgba(236,72,153,0.18)]"
            >
              💬 3 Word Pin Social
              <span className="text-white/50">—</span>
              <span>No algorithms ↗</span>
            </a>
          </div>

          {/* 3 Word Pin */}
          <div>
            <h4 className="mb-6 text-base font-semibold text-cyan-300">
              3 Word Pin
            </h4>

            <div className="space-y-4">
              <a
                href="/inscriptions"
                className="block text-sm font-medium transition-colors text-white/65 hover:text-cyan-300"
              >
                🎨 Customize a 3 Word Pin
              </a>

              <a
                href="/create"
                className="block text-sm font-medium transition-colors text-white/65 hover:text-cyan-300"
              >
                🪙 Own a 3 Word Pin
              </a>

              <a
                href="https://tiktok.com/@3wordpin"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-medium transition-colors text-white/65 hover:text-pink-300"
              >
                📲 Follow on TikTok ↗
              </a>
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <p className="font-mono text-xs text-cyan-300">
                ///your.place.here
              </p>

              <p className="mt-2 text-xs leading-relaxed text-white/45">
                57 trillion 3 Word Pins to claim.
              </p>
            </div>
          </div>

          {/* XRPLBNB */}
          <div>
            <h4 className="mb-6 text-base font-semibold text-pink-300">
              XPL.3WORDPIN
            </h4>

            <p className="mb-5 text-sm leading-relaxed text-white/60">
              🪙 Own it 💬 Sell it 📲 TikTok review it 🔄.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-cyan-300">✓</span>
                <span className="text-sm text-white/65">
                  No middleman economy
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-cyan-300">✓</span>
                <span className="text-sm text-white/65">
                  No middleman fees
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-cyan-300">✓</span>
                <span className="text-sm text-white/65">
                  No middleman real estate
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-cyan-300">✓</span>
                <span className="text-sm text-white/65">
                  No middleman social media
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pt-8 border-t mt-14 border-white/10">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">

            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-white">
                Sell digital real estate.
              </p>

              <p className="mt-1 text-sm text-white/40">
                You can share in three words.
              </p>
            </div>

            <a
              href="/create"
              className="rounded-xl bg-gradient-to-r from-cyan-400 via-white to-pink-400 px-6 py-3 text-sm font-bold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]"
            >
              🪙 Own a 3 Word Pin
            </a>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 mt-8 text-center md:flex-row">
            <p className="text-xs text-white/35">
              © 2026 3 Word Pin XPL.3WORDPIN
            </p>

            <div className="font-mono text-xs">
              <span className="text-white/35">/// KEEP.IT.</span>
              <span className="text-cyan-300">SIMPLE</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
