"use client";

import { FormEvent, useEffect, useState } from "react";

import { HookScene, SceneState } from "@/components/HookScene";
import { Logo, LogoMark } from "@/components/Logo";
import { Engine, Lang, STRINGS, Verdict } from "@/lib/i18n";
import { OWNER, REPO_URL } from "@/lib/site";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ScanResult = {
  url: string;
  risk_score: number;
  verdict: Verdict;
  reasons: string[];
  engine: Engine;
  domain_age_days: number | null;
  safe_browsing: "clean" | "match" | "skipped";
};

type Mode = "url" | "text";

const SEVERITY: Record<Verdict, number> = { safe: 0, suspicious: 1, dangerous: 2 };
const SLOW_AFTER_MS = 4000;
const REQUEST_TIMEOUT_MS = 90_000;

const TONE: Record<Verdict, { text: string; fill: string }> = {
  safe: { text: "text-sea", fill: "bg-sea" },
  suspicious: { text: "text-sand", fill: "bg-sand" },
  dangerous: { text: "text-bobber", fill: "bg-bobber" },
};

const EXAMPLES = [
  "https://www.garantibbva.com.tr",
  "https://ptt-kargo-teslimat.click/odeme",
  "http://paypal.com.secure-login.verify-account.xyz/signin",
];

function hostOf(url: string) {
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `http://${url}`).hostname;
  } catch {
    return url;
  }
}

function formatAge(days: number | null, lang: Lang) {
  if (days === null) return "—";
  const u = STRINGS[lang].units;
  if (days < 60) return `${days} ${u.day}`;
  if (days < 730) return `${Math.round(days / 30)} ${u.month}`;
  return `${Math.floor(days / 365)} ${u.year}`;
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (document.hidden) {
      setValue(target);
      return;
    }
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

/** Adds `is-in` to .reveal / .reveal-line elements as they scroll into view. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-line");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function HookUnderline() {
  return (
    <svg
      className="pointer-events-none absolute -bottom-2 left-0 h-4 w-full overflow-visible sm:-bottom-3 sm:h-5"
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="draw"
        style={{ ["--len" as string]: 260, ["--delay" as string]: "0.5s", ["--dur" as string]: "1.1s" }}
        d="M2 12 C 50 16, 130 16, 184 11 C 196 10, 198 2, 191 1 C 186 0, 184 5, 188 7"
        fill="none"
        stroke="var(--color-bobber)"
        strokeWidth="3.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 4.3 18.3 4.6 18.3 4.6c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex items-center font-mono text-xs">
      {(["tr", "en"] as const).map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="px-1 text-faint">/</span>}
          <button
            type="button"
            onClick={() => onChange(l)}
            aria-pressed={lang === l}
            className={`uppercase transition-colors ${lang === l ? "text-paper" : "text-faint hover:text-muted"}`}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
      <span className="h-px w-6 bg-bobber" />
      {children}
    </p>
  );
}

function ResultCard({ result, ms, lang }: { result: ScanResult; ms: number; lang: Lang }) {
  const t = STRINGS[lang];
  const tone = TONE[result.verdict];
  const v = t.verdict[result.verdict];
  const score = useCountUp(result.risk_score);
  const ticks = 25;

  return (
    <section aria-live="polite" className="card-in mt-8 border border-line bg-deep/70">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] ${tone.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${tone.fill}`} />
            {v.label}
          </p>
          <h3 className="mt-3 font-display text-2xl font-semibold text-paper">{v.title}</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{v.desc}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">{t.result.riskScore}</p>
          <p className={`font-display text-6xl font-semibold leading-none tabular-nums ${tone.text}`}>{score}</p>
        </div>
      </div>

      {/* ruler-style meter */}
      <div className="flex gap-[3px] px-6" aria-hidden="true">
        {Array.from({ length: ticks }, (_, i) => (
          <span
            key={i}
            className={`h-3 flex-1 transition-colors duration-300 ${(i + 1) / ticks <= score / 100 ? tone.fill : "bg-line"}`}
          />
        ))}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px border-t border-line bg-line font-mono text-xs sm:grid-cols-[1.4fr_1.2fr_1fr_0.7fr]">
        {[
          [t.result.domain, hostOf(result.url)],
          [t.result.method, t.engine[result.engine]],
          [t.result.age, formatAge(result.domain_age_days, lang)],
          [t.result.duration, `${ms} ms`],
        ].map(([k, val]) => (
          <div key={k} className="min-w-0 bg-[#0d1522] px-6 py-3">
            <dt className="text-faint">{k}</dt>
            <dd className="mt-1 truncate text-paper" title={val}>
              {val}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-line px-6 py-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">{t.result.signals}</p>
        {result.reasons.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t.result.noSignals}</p>
        ) : (
          <ol className="mt-3 space-y-2.5">
            {result.reasons.map((r, i) => (
              <li key={r} className="line-in flex gap-4 text-sm text-paper/90" style={{ animationDelay: `${0.25 + i * 0.08}s` }}>
                <span className="w-5 shrink-0 font-mono text-xs leading-5 text-faint">{String(i + 1).padStart(2, "0")}</span>
                {r}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

/** Links found in a pasted message; the selected one is shown in full below. */
function LinkList({
  links,
  selected,
  onSelect,
  lang,
}: {
  links: ScanResult[];
  selected: number;
  onSelect: (i: number) => void;
  lang: Lang;
}) {
  const t = STRINGS[lang];
  return (
    <section className="card-in mt-8 border border-line bg-deep/70">
      <p className="border-b border-line px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
        {t.linksFound.replace("{n}", String(links.length))}
      </p>
      <ul>
        {links.map((l, i) => {
          const tone = TONE[l.verdict];
          return (
            <li key={l.url} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-pressed={selected === i}
                className={`line-in flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-paper/[0.03] ${
                  selected === i ? "bg-paper/[0.04]" : ""
                }`}
                style={{ animationDelay: `${0.1 + i * 0.07}s` }}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${tone.fill}`} />
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-paper">{l.url}</span>
                <span className={`hidden font-mono text-[11px] uppercase tracking-[0.15em] sm:inline ${tone.text}`}>
                  {t.verdict[l.verdict].label}
                </span>
                <span className={`w-8 text-right font-display text-lg font-semibold tabular-nums ${tone.text}`}>{l.risk_score}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function worstIndex(links: ScanResult[]) {
  return links.reduce(
    (best, l, i) =>
      SEVERITY[l.verdict] > SEVERITY[links[best].verdict] ||
      (SEVERITY[l.verdict] === SEVERITY[links[best].verdict] && l.risk_score > links[best].risk_score)
        ? i
        : best,
    0,
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("tr");
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<"invalid" | "failed" | "noLinks" | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [links, setLinks] = useState<ScanResult[] | null>(null);
  const [selected, setSelected] = useState(0);
  const [ms, setMs] = useState(0);
  const [scanId, setScanId] = useState(0);
  const t = STRINGS[lang];

  useReveal();

  // Wake the API as soon as the page opens: on the free plan it sleeps after
  // 15 idle minutes, and waking takes ~50 s. By the time a link is pasted it
  // is usually ready.
  useEffect(() => {
    fetch(`${API_URL}/api/health`).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const id = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(id);
  }, [loading]);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("lang");
    } catch {}
    if (saved === "tr" || saved === "en") setLang(saved);
    else if (!navigator.language.toLowerCase().startsWith("tr")) setLang("en");
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  async function post<T>(path: string, body: object): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function scan(target: string, scanLang: Lang = lang) {
    const value = target.trim();
    if (value.length < 3) {
      setError("invalid");
      return;
    }
    setPending(value);
    setLoading(true);
    setError(null);
    setLinks(null);
    const started = performance.now();
    try {
      setResult(await post<ScanResult>("/api/scan/url", { url: value, lang: scanLang }));
      setMs(Math.round(performance.now() - started));
      setScanId((n) => n + 1);
    } catch {
      setResult(null);
      setError("failed");
    } finally {
      setLoading(false);
    }
  }

  async function scanMessage(message: string, scanLang: Lang = lang, keep = -1) {
    const value = message.trim();
    if (value.length < 3) {
      setError("invalid");
      return;
    }
    setPending("");
    setLoading(true);
    setError(null);
    setResult(null);
    const started = performance.now();
    try {
      const data = await post<{ links: ScanResult[] }>("/api/scan/text", { text: value, lang: scanLang });
      setMs(Math.round(performance.now() - started));
      if (data.links.length === 0) {
        setLinks(null);
        setError("noLinks");
        return;
      }
      setLinks(data.links);
      setSelected(keep >= 0 && keep < data.links.length ? keep : worstIndex(data.links));
      setScanId((n) => n + 1);
    } catch {
      setLinks(null);
      setError("failed");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(m: Mode) {
    if (m === mode) return;
    setMode(m);
    setError(null);
    setResult(null);
    setLinks(null);
  }

  function changeLang(l: Lang) {
    setLang(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
    // Re-run the last scan so the reasons come back in the new language.
    if (mode === "url" && result) scan(result.url, l);
    if (mode === "text" && links) scanMessage(text, l, selected);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "url") scan(url);
    else scanMessage(text);
  }

  const shown = mode === "text" ? (links?.[selected] ?? null) : result;
  const worst = links ? links[worstIndex(links)] : null;
  const sceneState: SceneState = loading
    ? "checking"
    : mode === "text" && worst
      ? worst.verdict
      : shown
        ? shown.verdict
        : "idle";
  const sceneHost = loading
    ? pending
      ? hostOf(pending)
      : "…"
    : shown
      ? hostOf(shown.url)
      : mode === "url" && url.trim()
        ? hostOf(url.trim())
        : "ptt-kargo-teslimat.click";

  const footerLinks = [
    OWNER.github && { href: OWNER.github, label: "GitHub" },
    OWNER.linkedin && { href: OWNER.linkedin, label: "LinkedIn" },
    OWNER.email && { href: `mailto:${OWNER.email}`, label: OWNER.email },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="relative z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#" aria-label="Kanca">
            <Logo />
          </a>
          <nav className="flex items-center gap-5 text-sm sm:gap-7">
            <a href="#how" className="hidden text-muted transition-colors hover:text-paper sm:block">
              {t.nav.how}
            </a>
            <a href="#model" className="hidden text-muted transition-colors hover:text-paper sm:block">
              {t.nav.model}
            </a>
            {REPO_URL && (
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.nav.source}
                className="text-muted transition-colors hover:text-paper"
              >
                <GitHubIcon />
              </a>
            )}
            <LangToggle lang={lang} onChange={changeLang} />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------- hero ---------- */}
        <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
          <div className="min-w-0">
            <div className="rise-in">
              <Kicker>{t.kicker}</Kicker>
            </div>
            <h1
              className="rise-in mt-6 font-display text-[2.4rem] font-semibold leading-[1.08] tracking-tight text-paper sm:text-6xl sm:leading-[1.05]"
              style={{ animationDelay: "0.08s" }}
            >
              {t.titleLead}
              <span className="relative inline-block">
                {t.titleMark}
                <HookUnderline key={lang} />
              </span>
              {t.titleTail}
            </h1>
            <p className="rise-in mt-7 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base" style={{ animationDelay: "0.16s" }}>
              {t.subtitle}
            </p>

            <form onSubmit={onSubmit} className="rise-in mt-9" style={{ animationDelay: "0.24s" }}>
              <div role="tablist" className="flex gap-6 font-mono text-xs uppercase tracking-[0.15em]">
                {(["url", "text"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => changeMode(m)}
                    className={`-mb-px border-b-2 pb-2 transition-colors ${
                      mode === m ? "border-bobber text-paper" : "border-transparent text-faint hover:text-muted"
                    }`}
                  >
                    {t.modes[m]}
                  </button>
                ))}
              </div>
              <div
                className={`flex flex-col border border-line bg-deep/80 transition-colors focus-within:border-paper/30 ${
                  mode === "url" ? "sm:flex-row" : ""
                }`}
              >
                <label className="flex-1">
                  <span className="sr-only">{t.inputLabel}</span>
                  {mode === "url" ? (
                    <input
                      type="text"
                      inputMode="url"
                      autoComplete="off"
                      spellCheck={false}
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={t.placeholder}
                      className="w-full bg-transparent px-4 py-4 font-mono text-sm text-paper outline-none placeholder:text-faint"
                    />
                  ) : (
                    <textarea
                      rows={4}
                      maxLength={5000}
                      spellCheck={false}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={t.textPlaceholder}
                      className="block w-full resize-y bg-transparent px-4 py-4 text-sm leading-relaxed text-paper outline-none placeholder:text-faint"
                    />
                  )}
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex items-center justify-center gap-2 bg-bobber px-6 py-4 text-sm font-semibold text-ink transition-colors hover:bg-[#ff7a52] disabled:cursor-wait"
                >
                  {loading ? t.scanning : mode === "url" ? t.scan : t.scanText}
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className={`relative h-px overflow-hidden ${loading ? "sweep" : ""}`} />
            </form>

            <div className="rise-in mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs" style={{ animationDelay: "0.3s" }}>
              <span className="text-faint">{t.examples}:</span>
              {mode === "url" ? (
                EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setUrl(ex);
                      scan(ex);
                    }}
                    className="max-w-full truncate text-muted underline decoration-faint underline-offset-4 transition-colors hover:text-paper hover:decoration-bobber"
                  >
                    {hostOf(ex)}
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setText(t.textExample);
                    scanMessage(t.textExample);
                  }}
                  className="text-muted underline decoration-faint underline-offset-4 transition-colors hover:text-paper hover:decoration-bobber"
                >
                  {t.textExampleLabel}
                </button>
              )}
            </div>

            {loading && slow && (
              <p role="status" className="card-in mt-6 flex items-start gap-3 text-sm text-muted">
                <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-sand" />
                {t.slow}
              </p>
            )}

            <p className="rise-in mt-8 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-faint" style={{ animationDelay: "0.36s" }}>
              {[...t.proof, t.privacy].map((p, i) => (
                <span key={p} className="flex items-center gap-3">
                  {i > 0 && <span className="text-faint/60">·</span>}
                  {p}
                </span>
              ))}
            </p>

            {error && (
              <p role="alert" className="card-in mt-8 border-l-2 border-bobber bg-bobber/5 px-4 py-3 text-sm text-paper">
                {t[error]}
              </p>
            )}

            {mode === "text" && links && links.length > 1 && (
              <LinkList key={`list-${scanId}`} links={links} selected={selected} onSelect={setSelected} lang={lang} />
            )}

            {shown && <ResultCard key={`${scanId}-${selected}`} result={shown} ms={ms} lang={lang} />}
          </div>

          <div className="hidden lg:block">
            <HookScene state={sceneState} host={sceneHost} label={t.scene[sceneState]} />
          </div>
        </section>

        {/* ---------- how it works ---------- */}
        <section id="how" className="scroll-mt-4 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="reveal lg:sticky lg:top-12 lg:self-start">
              <Kicker>{t.howKicker}</Kicker>
              <h2 className="mt-5 max-w-sm font-display text-3xl font-semibold leading-tight text-paper sm:text-4xl">{t.howTitle}</h2>
            </div>
            <ol className="relative">
              <span className="reveal-line absolute bottom-2 left-[5px] top-2 w-px bg-gradient-to-b from-sea/60 via-sea/25 to-transparent" aria-hidden="true" />
              {t.how.map(([depth, title, desc], i) => (
                <li key={title} className="reveal relative pb-14 pl-12 last:pb-0" style={{ transitionDelay: `${i * 0.12}s` }}>
                  <span
                    className={`absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 ${
                      i === 0 ? "border-bobber bg-bobber" : "border-sea/70 bg-ink"
                    }`}
                    aria-hidden="true"
                  />
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                    {String(i * 12).padStart(2, "0")} m · {depth}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-paper">{title}</h3>
                  <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">{desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- model ---------- */}
        <section id="model" className="scroll-mt-4 border-t border-line bg-deep/40">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2">
            <div className="reveal">
              <Kicker>{t.modelKicker}</Kicker>
              <h2 className="mt-5 max-w-md font-display text-3xl font-semibold leading-tight text-paper sm:text-4xl">{t.modelTitle}</h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">{t.modelSubtitle}</p>
              <dl className="mt-10 border-t border-line">
                {t.metrics.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between border-b border-line py-4">
                    <dt className="text-sm text-muted">{k}</dt>
                    <dd className="font-display text-xl font-medium tabular-nums text-paper">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="reveal self-end" style={{ transitionDelay: "0.15s" }}>
              <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                <div>
                  <p className="font-display text-4xl font-semibold text-faint line-through decoration-bobber decoration-[3px] sm:text-5xl xl:text-6xl">
                    {lang === "tr" ? "%99,6" : "99.6%"}
                  </p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">{t.v1}</p>
                </div>
                <svg viewBox="0 0 40 16" className="mb-8 h-4 w-10 shrink-0 text-faint" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M0 8h36M30 2l6 6-6 6" />
                </svg>
                <div>
                  <p className="font-display text-4xl font-semibold text-paper sm:text-5xl xl:text-6xl">{lang === "tr" ? "%85,4" : "85.4%"}</p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-sea">{t.v2}</p>
                </div>
              </div>
              <h3 className="mt-10 font-display text-lg font-semibold text-paper">{t.leakTitle}</h3>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">{t.leakBody}</p>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 pt-14 sm:grid-cols-[1fr_auto_auto] sm:gap-16 sm:px-8">
          <div>
            <LogoMark className="h-8 w-8" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-faint">{t.disclaimer}</p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">{t.builtBy}</p>
            <p className="mt-3 text-paper">{OWNER.name}</p>
            <p className="mt-0.5 text-sm text-muted">{t.role}</p>
          </div>
          {footerLinks.length > 0 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">{t.contact}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {footerLinks.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="text-muted underline decoration-transparent underline-offset-4 transition-colors hover:text-paper hover:decoration-bobber"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="mx-auto max-w-6xl overflow-hidden px-5 sm:px-8">
          <p className="select-none font-display text-[26vw] font-semibold leading-[0.8] tracking-tighter text-paper/[0.035] lg:text-[17rem]" aria-hidden="true">
            kanca
          </p>
        </div>
      </footer>
    </div>
  );
}
