'use client';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-cyan-400/20 bg-black py-14">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-cyan-400/5 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          
          {/* Brand */}
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

            <p className="max-w-md text-base leading-relaxed text-white/70">
              Give any place a simple three-word address that people can
              remember, share, and use to find you anywhere.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://social.3wordpin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 px-5 py-3 text-sm font-semibold text-cyan-300 transition-all duration-300 hover:border-cyan-300/60 hover:bg-cyan-400/10 hover:text-white hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]"
              >
                💬 3 Word Pin Social
              </a>

              <a
                href="/create"
                className="rounded-xl border border-pink-400/30 bg-pink-400/5 px-5 py-3 text-sm font-semibold text-pink-300 transition-all duration-300 hover:border-pink-300/60 hover:bg-pink-400/10 hover:text-white hover:shadow-[0_0_25px_rgba(236,72,153,0.15)]"
              >
                Create a Pin
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-6 text-base font-semibold text-cyan-300">
              Resources
            </h4>

            <div className="space-y-4">
              <a
                href="/"
                className="block text-sm font-medium text-white/70 transition-colors hover:text-cyan-300"
              >
                Find a Place
              </a>

              <a
                href="/create"
                className="block text-sm font-medium text-white/70 transition-colors hover:text-cyan-300"
              >
                Create a 3 Word Pin
              </a>

              <a
                href="https://social.3wordpin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-medium text-white/70 transition-colors hover:text-pink-300"
              >
                3 Word Pin Social ↗
              </a>
            </div>
          </div>

          {/* 3 Word Pin */}
          <div>
            <h4 className="mb-6 text-base font-semibold text-pink-300">
              3 Word Pin
            </h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/60">
                  Format
                </span>
                <span className="font-mono text-sm font-semibold text-cyan-300">
                  word.word.word
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/60">
                  Simple
                </span>
                <span className="text-sm font-semibold text-white">
                  3 Words
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/60">
                  Share
                </span>
                <span className="text-sm font-semibold text-pink-300">
                  Anywhere
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/60">
                  Purpose
                </span>
                <span className="text-sm font-semibold text-cyan-300">
                  Find You
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-sm text-white/50">
              © 2026 3 Word Pin. Every place. Three words.
            </p>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/40">
                /// KEEP
              </span>
              <span className="font-semibold text-cyan-300">
                IT
              </span>
              <span className="text-white/40">
                .
              </span>
              <span className="font-semibold text-pink-300">
                SIMPLE
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
