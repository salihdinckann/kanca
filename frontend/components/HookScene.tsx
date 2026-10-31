import type { Verdict } from "@/lib/i18n";

export type SceneState = "idle" | "checking" | Verdict;

const DOT: Record<SceneState, string> = {
  idle: "bg-faint",
  checking: "bg-sand animate-pulse",
  safe: "bg-sea",
  suspicious: "bg-sand",
  dangerous: "bg-bobber",
};

const BORDER: Record<SceneState, string> = {
  idle: "border-line",
  checking: "border-sand/40",
  safe: "border-sea/50",
  suspicious: "border-sand/50",
  dangerous: "border-bobber",
};

const BUBBLES = [
  { left: "38%", size: 6, t: "7s", d: "0s" },
  { left: "44%", size: 4, t: "5.5s", d: "1.8s" },
  { left: "57%", size: 5, t: "6.5s", d: "3.2s" },
  { left: "62%", size: 3, t: "5s", d: "0.9s" },
  { left: "50%", size: 4, t: "8s", d: "4.4s" },
];

/**
 * A fishing rig hanging into the water: bobber on the surface, hook below,
 * with the scanned link tied on as bait. Reacts to the scan state.
 */
export function HookScene({ state, host, label }: { state: SceneState; host: string; label: string }) {
  const motion = state === "checking" ? "nibble" : state === "dangerous" ? "tug" : "drift";

  return (
    <div
      className="relative h-[460px] w-full select-none overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 22%, black 78%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 22%, black 78%, transparent)",
      }}
      aria-hidden="true"
    >
      {/* water */}
      <div className="absolute inset-x-0 bottom-0 top-[128px] bg-gradient-to-b from-sea/[0.07] via-sea/[0.02] to-transparent" />
      <svg className="wave absolute left-0 top-[118px] h-5 w-[200%]" viewBox="0 0 800 20" preserveAspectRatio="none">
        <path
          d="M0 10 Q 50 2 100 10 T 200 10 T 300 10 T 400 10 T 500 10 T 600 10 T 700 10 T 800 10"
          fill="none"
          stroke="rgba(79,209,184,0.45)"
          strokeWidth="1.5"
        />
      </svg>
      <svg className="wave-slow absolute left-0 top-[124px] h-5 w-[200%]" viewBox="0 0 800 20" preserveAspectRatio="none">
        <path
          d="M0 10 Q 66 16 133 10 T 266 10 T 400 10 T 533 10 T 666 10 T 800 10"
          fill="none"
          stroke="rgba(79,209,184,0.18)"
          strokeWidth="1"
        />
      </svg>

      {/* ripple where the bobber sits */}
      {state !== "checking" && (
        <svg className="absolute left-1/2 top-[120px] h-6 w-40 -translate-x-1/2" viewBox="0 0 160 24">
          <ellipse className="ripple" cx="80" cy="12" rx="30" ry="4" fill="none" stroke="rgba(236,230,217,0.35)" />
        </svg>
      )}

      {/* bubbles */}
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="bubble absolute bottom-6 rounded-full border border-paper/30"
          style={{ left: b.left, width: b.size, height: b.size, ["--t" as string]: b.t, ["--d" as string]: b.d }}
        />
      ))}

      {/* rig */}
      <div className="lower absolute top-0" style={{ left: "calc(50% - 100px)", width: 200 }}>
        <div className="swing">
          <div key={state} className={motion}>
            <svg viewBox="0 0 200 400" width="200" height="400" overflow="visible">
              <defs>
                <linearGradient id="hook-metal" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f6f2ea" />
                  <stop offset="1" stopColor="#8c95a5" />
                </linearGradient>
              </defs>
              {/* line */}
              <path d="M100 -300 V 300" stroke="rgba(236,230,217,0.55)" strokeWidth="1" />
              {/* bobber */}
              <g transform="translate(100 122)">
                <line x1="0" y1="-14" x2="0" y2="-24" stroke="#ece6d9" strokeWidth="2" strokeLinecap="round" />
                <path d="M-11 0 a11 14 0 0 1 22 0 Z" fill="#ff5b2e" />
                <path d="M-11 0 a11 14 0 0 0 22 0 Z" fill="#ece6d9" />
                <line x1="-11" y1="0" x2="11" y2="0" stroke="#0a1019" strokeWidth="1.5" />
              </g>
              {/* swivel eye */}
              <circle cx="100" cy="306" r="5" fill="none" stroke="url(#hook-metal)" strokeWidth="2.5" />
              {/* hook */}
              <path
                d="M100 311 V 352 a 26 26 0 0 1 -52 0 V 338"
                fill="none"
                stroke="url(#hook-metal)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M48 338 l 9 10" fill="none" stroke="url(#hook-metal)" strokeWidth="4" strokeLinecap="round" />
              {/* bait string */}
              <path d="M74 378 V 392" stroke="rgba(236,230,217,0.4)" strokeWidth="1" />
            </svg>

            {/* bait: the link */}
            <div className="absolute" style={{ top: 390, left: 74, transform: "translateX(-50%)" }}>
              <div
                key={host + state}
                className={`chip-in whitespace-nowrap rounded-md border bg-deep/95 px-2.5 py-1.5 font-mono text-[11px] shadow-lg shadow-black/40 ${BORDER[state]}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${DOT[state]}`} />
                  <span className="max-w-[180px] truncate text-paper">{host}</span>
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{label}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
