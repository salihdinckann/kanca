"use client";

import { useEffect, useRef, useState } from "react";

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

type Bubble = { id: number; x: number; y: number };

/**
 * Pointer play: the rig leans toward the cursor, the cursor leaves bubbles in
 * the water, and bringing it near the hook makes the bobber bite. Mouse only.
 */
function usePointerPlay(scene: React.RefObject<HTMLDivElement | null>, hook: React.RefObject<HTMLDivElement | null>) {
  const rig = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let target = 0;
    let angle = 0;
    let frame = 0;
    let lastBubble = 0;
    let id = 0;

    const tick = () => {
      angle += (target - angle) * 0.06; // spring toward the cursor
      if (rig.current) rig.current.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const move = (e: PointerEvent) => {
      const box = scene.current?.getBoundingClientRect();
      if (!box) return;
      const dx = (e.clientX - (box.left + box.width / 2)) / (box.width / 2);
      target = Math.max(-1, Math.min(1, dx)) * -9; // the hook swings toward the cursor

      const h = hook.current?.getBoundingClientRect();
      if (h) setNear(Math.hypot(e.clientX - (h.left + h.width / 2), e.clientY - (h.top + h.height / 2)) < 90);

      // Bubbles where the cursor moves through the water.
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;
      const inWater = x > 0 && x < box.width && y > 140 && y < box.height;
      if (inWater && e.timeStamp - lastBubble > 140) {
        lastBubble = e.timeStamp;
        const b = { id: id++, x, y };
        setBubbles((list) => [...list.slice(-10), b]);
        setTimeout(() => setBubbles((list) => list.filter((i) => i.id !== b.id)), 1600);
      }
    };
    const leave = () => {
      target = 0;
      setNear(false);
    };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [scene, hook]);

  return { rig, near, bubbles };
}

/**
 * A fishing rig hanging into the water: bobber on the surface, hook below,
 * with the scanned link tied on as bait. Reacts to the scan state and the pointer.
 */
export function HookScene({ state, host, label, tease }: { state: SceneState; host: string; label: string; tease: string }) {
  const scene = useRef<HTMLDivElement>(null);
  const hook = useRef<HTMLDivElement>(null);
  const { rig, near, bubbles } = usePointerPlay(scene, hook);
  const biting = near && (state === "idle" || state === "safe");
  const motion = state === "checking" || biting ? "nibble" : state === "dangerous" ? "tug" : "drift";

  return (
    <div
      ref={scene}
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

      {/* bubbles left by the cursor */}
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="cursor-bubble absolute h-2 w-2 rounded-full border border-paper/40"
          style={{ left: b.x - 4, top: b.y - 4 }}
        />
      ))}

      {/* ripple rings when something bites */}
      {biting && (
        <svg className="absolute left-1/2 top-[120px] h-6 w-40 -translate-x-1/2" viewBox="0 0 160 24">
          <ellipse className="ripple" cx="80" cy="12" rx="30" ry="4" fill="none" stroke="rgba(242,184,75,0.6)" />
          <ellipse className="ripple" style={{ animationDelay: "0.6s" }} cx="80" cy="12" rx="30" ry="4" fill="none" stroke="rgba(242,184,75,0.4)" />
        </svg>
      )}

      {/* safe: a fish sniffs the bait and swims away */}
      {state === "safe" && (
        <svg key={host} className="swim-away absolute left-[30%] top-[330px] h-8 w-14 text-sea" viewBox="0 0 56 32" fill="currentColor">
          <path d="M6 16c8-11 26-13 36-2l9-8-2 10 2 10-9-8C32 29 14 27 6 16Z" opacity="0.85" />
          <circle cx="15" cy="14" r="1.8" fill="#0a1019" />
        </svg>
      )}

      {/* dangerous: the water flushes orange for a moment */}
      {state === "dangerous" && (
        <div key={host} className="danger-flash absolute inset-x-0 bottom-0 top-[128px]" style={{ position: "absolute", background: "linear-gradient(to bottom, rgba(255,91,46,0.18), transparent)" }} />
      )}

      {/* rig */}
      <div className="lower absolute top-0" style={{ left: "calc(50% - 100px)", width: 200 }}>
        <div ref={rig} style={{ transformOrigin: "50% -300px", willChange: "transform" }}>
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

            {/* invisible target for the "near the hook" check */}
            <div ref={hook} className="absolute h-16 w-16" style={{ top: 316, left: 42 }} />
            {biting && (
              <div className="chip-in absolute whitespace-nowrap rounded-full bg-sand px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink" style={{ top: 300, left: 112 }}>
                {tease}
              </div>
            )}

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
    </div>
  );
}
