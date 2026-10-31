// Kanca brand mark: a fish hook inside a rounded tile, with a scan ring around the eye.

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="kanca-tile" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#kanca-tile)" />
      <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
        {/* eye of the hook */}
        <circle cx="19" cy="7.5" r="2.2" strokeWidth="2" />
        {/* shank and bend */}
        <path d="M19 9.7V18.5a5.5 5.5 0 0 1-11 0V15" strokeWidth="2.6" />
        {/* barb */}
        <path d="M8 15l3.2 2.6" strokeWidth="2.2" />
      </g>
      {/* scan ring */}
      <circle cx="19" cy="7.5" r="4.6" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const mark = size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const text = size === "lg" ? "text-2xl" : "text-[19px]";
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className={mark} />
      <span className={`font-display ${text} font-semibold lowercase leading-none tracking-tight text-white`}>
        kanca
      </span>
    </span>
  );
}
