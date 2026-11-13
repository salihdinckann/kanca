"use client";

import { useEffect, useRef, useState } from "react";

import { BRANDS, FAQ, STATS_TEXT } from "@/lib/extras";
import type { Lang } from "@/lib/i18n";

/** Counts from 0 to `value` once the element scrolls into view. */
function Counter({ value, lang, prefix = "", suffix = "" }: { value: number; lang: Lang; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const k = Math.min((now - start) / 1400, 1);
        setN(value * (1 - Math.pow(1 - k, 3)));
        if (k < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);
  const decimals = Number.isInteger(value) ? 0 : 1;
  const text = n.toLocaleString(lang === "tr" ? "tr-TR" : "en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

export function StatsBand({ lang }: { lang: Lang }) {
  const t = STATS_TEXT[lang];
  return (
    <div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {t.stats.map((s, i) => (
          <div key={s.label} className="reveal glass rounded-2xl p-6" style={{ transitionDelay: `${i * 0.08}s` }}>
            <dd className={`font-display text-4xl font-semibold sm:text-5xl ${i === 3 ? "text-sand" : i === 0 ? "text-bobber" : "text-paper"}`}>
              <Counter value={s.value} lang={lang} prefix={"prefix" in s ? (s.prefix as string) : ""} suffix={s.suffix} />
            </dd>
            <dt className="mt-3 text-sm leading-snug text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-4 font-mono text-[11px] text-faint">{t.source}</p>
    </div>
  );
}

/** Endless strip of the most impersonated brands, with fake-domain counts. */
export function BrandMarquee({ lang }: { lang: Lang }) {
  const t = STATS_TEXT[lang];
  const row = [...BRANDS, ...BRANDS];
  return (
    <div className="mt-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">{t.brandsTitle}</p>
      <div
        className="group relative mt-4 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <ul className="marquee flex w-max gap-3 group-hover:[animation-play-state:paused]">
          {row.map(([name, n, bg, fg, initial], i) => (
            <li
              key={i}
              aria-hidden={i >= BRANDS.length}
              className="flex items-center gap-2.5 rounded-full border border-line bg-deep/60 py-1.5 pl-1.5 pr-2 text-sm text-paper"
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-xs font-bold shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]"
                style={{ background: bg, color: fg }}
                aria-hidden="true"
              >
                {initial}
              </span>
              {name}
              <span className="rounded-full bg-bobber/15 px-2.5 py-0.5 font-mono text-xs text-bobber">
                {n} <span className="text-bobber/70">{t.brandsUnit}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Faq({ lang }: { lang: Lang }) {
  const t = FAQ[lang];
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="reveal">
        <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          <span className="h-px w-6 bg-bobber" />
          {t.kicker}
        </p>
        <h2 className="mt-5 max-w-sm font-display text-3xl font-semibold leading-tight text-paper sm:text-4xl">{t.title}</h2>
      </div>
      <div className="space-y-3">
        {t.items.map(([q, a], i) => (
          <details key={q} className="reveal faq glass group rounded-2xl" style={{ transitionDelay: `${i * 0.06}s` }}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-display text-base font-semibold text-paper">
              {q}
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform duration-300 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="px-6 pb-5 text-[15px] leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

/** A soft light that follows the pointer, like a torch under water. Pointer devices only. */
export function CursorLight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--x", `${e.clientX}px`);
        el.style.setProperty("--y", `${e.clientY}px`);
        el.style.opacity = "1";
      });
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <div ref={ref} className="cursor-light" aria-hidden="true" />;
}

/** One orange flash across the screen when a scan comes back dangerous. */
export function DangerFlash() {
  return <div className="danger-flash" aria-hidden="true" />;
}
