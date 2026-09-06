'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  description?: string;
}

export default function StatsCard({
  title,
  value,
  description,
}: StatsCardProps) {
  return (
    <div
      className="
        relative
        overflow-hidden
        bg-black/70
        backdrop-blur-xl
        border border-cyan-400/20
        rounded-2xl
        p-5
        text-center
        transition-all
        duration-300
        hover:bg-white/[0.06]
        hover:border-cyan-400/40
        hover:shadow-[0_0_30px_rgba(0,242,234,0.10)]
        group
      "
    >
      {/* Cyan glow */}
      <div
        className="
          pointer-events-none
          absolute
          -top-10
          -right-10
          w-24
          h-24
          rounded-full
          bg-cyan-400/10
          blur-2xl
          group-hover:bg-cyan-400/20
          transition-all
          duration-500
        "
      />

      {/* Pink glow */}
      <div
        className="
          pointer-events-none
          absolute
          -bottom-10
          -left-10
          w-24
          h-24
          rounded-full
          bg-pink-500/10
          blur-2xl
          group-hover:bg-pink-500/20
          transition-all
          duration-500
        "
      />

      <div className="relative z-10">

        {/* Label */}
        <h3
          className="
            text-[10px]
            font-bold
            text-gray-500
            mb-3
            uppercase
            tracking-[0.2em]
          "
        >
          {title}
        </h3>

        {/* 3 Word Pin */}
        <div className="flex items-center justify-center">
          <p
            className="
              text-xl
              sm:text-2xl
              font-black
              tracking-tight
              bg-gradient-to-r
              from-cyan-300
              via-white
              to-pink-400
              bg-clip-text
              text-transparent
              break-all
            "
          >
            {typeof value === 'string' && !value.startsWith('///')
              ? `///${value}`
              : value}
          </p>
        </div>

        {/* Optional description */}
        {description && (
          <p
            className="
              mt-3
              text-xs
              text-gray-400
              font-medium
              leading-relaxed
            "
          >
            {description}
          </p>
        )}

      </div>
    </div>
  );
}
