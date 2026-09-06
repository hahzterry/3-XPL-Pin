'use client';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-cyan-400/20 bg-black py-14">
      {/* Ambient cyan + pink glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-cyan-400/5 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-6">

        {/* Main footer */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">

          {/* Brand + Mission */}
          <div className="md:col-span-2">
            <div className="mb-6 flex items-center space-x-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-white/5 shadow-[0_0_25px_rgba(34,211,238,0.15)] backdrop-blur-xl">
                <img
                  src="/logo.svg"
                  alt="3 Word Pin"
                  className="h-8 w-8 brightness-0 invert"
                />
              </div>

              <div>
                <span className="text-2xl font-bold tracking-tight text-white">
                  3 WORD PIN
                </span>
                <span className="ml-2 text-sm font-light text-cyan-300">
                  /// KEEP.IT.SIMPLE
                </span>
              </div>
            </div>

            <p className="mb-5 max-w-xl text-lg font-semibold leading-relaxed text-white">
              Every place. Three words.
            </p>

            <p className="max-w-xl text-base leading-relaxed text-white/65">
              3 Word Pin makes it simple to give any location a memorable
              three-word address that anyone can share, search, and use to
              find you anywhere.
            </p>

            {/* XRPLBNB value proposition */}
            <div className="mt-7 rounded-2xl border border-cyan-400/20 bg-white/[0.03] p-5 backdrop-blur-xl">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h3 className="font-bold text-white">
                  XRPLBNB
                </h3>
              </div>

              <p className="text-sm leading-relaxed text-white/60">
                A simpler way to promote and connect businesses, creators,
                and locations directly with the people they want to reach —
                without relying on a middleman to control the relationship
                or take a middleman fee.
              </p>

              <p className="mt-3 text-sm font-semibold text-cyan-300">
                Direct connection. No middleman fees.
              </p>
            </div>

            {/* Social CTA */}
            <a
              href="https://social.3wordpin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-pink-400/30 bg-pink-400/5 px-5 py-3 text-sm font-semibold text-pink-300 transition-all duration-300 hover:border-pink-300/60 hover:bg-pink-400/10 hover:text-white hover:shadow-[0_0_30px_rgba(236,72,153,0.18)]"
            >
              💬 3 Word Pin Social
              <span className="text-white/50">—</span>
              <span>Promote Your XRPLBNB ↗</span>
            </a>
          </div>

          {/* 3 Word Pin */}
          <div>
            <h4 className="mb-6 text-base font-semibold text-cyan-300">
              3 Word Pin
            </h4>

            <div className="space-y-4">
              <a
                href="/"
                className="block text-sm font-medium text-white/65 transition-colors hover:text-cyan-300"
              >
                Find a Place
              </a>

              <a
                href="/create"
                className="block text-sm font-medium text-white/65 transition-colors hover:text-cyan-300"
              >
                Create a 3 Word Pin
              </a>

              <a
                href="https://social.3wordpin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-medium text-white/65 transition-colors hover:text-pink-300"
              >
                3 Word Pin Social ↗
              </a>
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <p className="font-mono text-xs text-cyan-300">
                /// your.place.here
              </p>

              <p className="mt-2 text-xs leading-relaxed text-white/45">
                One simple address that can be shared anywhere.
              </p>
            </div>
          </div>

          {/* XRPLBNB */}
          <div>
            <h4 className="mb-6 text-base font-semibold text-pink-300">
              XRPLBNB
            </h4>

            <p className="mb-5 text-sm leading-relaxed text-white/60">
              Built around a simple idea: connect people directly instead of
              putting another layer between them.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-cyan-300">✓</span>
                <span className="text-sm text-white/65">
                  Direct connections
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
                  Shareable 3 Word Pins
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-cyan-300">✓</span>
                <span className="text-sm text-white/65">
                  Built for businesses & creators
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">

            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-white">
                Stop sending complicated directions.
              </p>

              <p className="mt-1 text-sm text-white/40">
                Share three words instead.
              </p>
            </div>

            <a
              href="/create"
              className="rounded-xl bg-gradient-to-r from-cyan-400 via-white to-pink-400 px-6 py-3 text-sm font-bold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]"
            >
              Create Your 3 Word Pin
            </a>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 text-center md:flex-row">
            <p className="text-xs text-white/35">
              © 2026 3 Word Pin XRPLBNB. Every place. Three words.
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
