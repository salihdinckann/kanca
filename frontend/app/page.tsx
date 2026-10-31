"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

import { Engine, Lang, STRINGS, Verdict } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { OWNER, REPO_URL } from "@/lib/site";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ScanResult = {
  url: string;
  risk_score: number;
  verdict: Verdict;
  reasons: string[];
  engine: Engine;
};

const VERDICT_STYLE: Record<Verdict, { text: string; bar: string; badge: string; border: string }> = {
  safe: {
    text: "text-emerald-400",
    bar: "bg-emerald-400",
    badge: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
    border: "border-l-emerald-400",
  },
  suspicious: {
    text: "text-amber-400",
    bar: "bg-amber-400",
    badge: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
    border: "border-l-amber-400",
  },
  dangerous: {
    text: "text-rose-400",
    bar: "bg-rose-500",
    badge: "bg-rose-500/10 text-rose-300 ring-rose-500/25",
    border: "border-l-rose-500",
  },
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

function useCountUp(target: number, duration = 700) {
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

/* ---------- icons ---------- */

const Icon = {
  link: (cls = "h-4 w-4") => (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </svg>
  ),
  lock: (cls = "h-3.5 w-3.5") => (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  alert: (cls = "h-4 w-4") => (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 3 2.5 20h19L12 3Z" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  ),
  check: (cls = "h-4 w-4") => (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  ),
  globe: (cls = "h-5 w-5") => (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </svg>
  ),
  cpu: (cls = "h-5 w-5") => (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" strokeLinecap="round" />
    </svg>
  ),
  list: (cls = "h-5 w-5") => (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  ),
  github: (cls = "h-4 w-4") => (
    <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 4.3 18.3 4.6 18.3 4.6c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  ),
};

/* ---------- pieces ---------- */

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex rounded-md border border-white/10 p-0.5 text-xs font-medium">
      {(["tr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className={`rounded px-2.5 py-1 uppercase transition-colors ${
            lang === l ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-widest text-sky-400">{eyebrow}</p>
      <h2 className="font-display mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
      <p className="mt-3 text-slate-400">{subtitle}</p>
    </div>
  );
}

function ResultCard({ result, ms, lang }: { result: ScanResult; ms: number; lang: Lang }) {
  const t = STRINGS[lang];
  const s = VERDICT_STYLE[result.verdict];
  const v = t.verdict[result.verdict];
  const score = useCountUp(result.risk_score);

  const details: [string, ReactNode][] = [
    [t.result.domain, <span key="d" className="font-mono">{hostOf(result.url)}</span>],
    [t.result.method, t.engine[result.engine]],
    [t.result.duration, `${ms} ms`],
  ];

  return (
    <section aria-live="polite" className={`fade-in mt-6 overflow-hidden rounded-xl border border-white/10 border-l-4 ${s.border} bg-white/[0.02]`}>
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ring-1 ${s.badge}`}>
            {result.verdict === "safe" ? Icon.check("h-3.5 w-3.5") : Icon.alert("h-3.5 w-3.5")}
            {v.label}
          </span>
          <h3 className="mt-3 text-xl font-semibold text-white">{v.title}</h3>
          <p className="mt-1.5 max-w-lg text-sm text-slate-400">{v.desc}</p>
        </div>
        <div className="shrink-0 sm:w-44 sm:text-right">
          <p className="text-xs text-slate-500">{t.result.riskScore}</p>
          <p className={`mt-1 text-4xl font-semibold tabular-nums ${s.text}`}>
            {score}
            <span className="text-lg text-slate-600">/100</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-1 border-t border-white/10 text-sm sm:grid-cols-[2fr_1fr_1fr]">
        {details.map(([k, val], i) => (
          <div key={k} className={`min-w-0 px-6 py-3 ${i > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""}`}>
            <dt className="text-xs text-slate-500">{k}</dt>
            <dd className="mt-0.5 truncate text-slate-200">{val}</dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-white/10 px-6 py-5">
        <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500">{t.result.signals}</h4>
        {result.reasons.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">{t.result.noSignals}</p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {result.reasons.map((r) => (
              <li key={r} className="flex gap-2.5 text-sm text-slate-300">
                <span className={`mt-0.5 shrink-0 ${result.verdict === "safe" ? "text-emerald-400" : s.text}`}>
                  {result.verdict === "safe" ? Icon.check() : Icon.alert()}
                </span>
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Footer({ lang }: { lang: Lang }) {
  const t = STRINGS[lang];
  const links = [
    OWNER.github && { href: OWNER.github, label: "GitHub" },
    OWNER.linkedin && { href: OWNER.linkedin, label: "LinkedIn" },
    OWNER.email && { href: `mailto:${OWNER.email}`, label: OWNER.email },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-500">{t.disclaimer}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{t.builtBy}</p>
          <p className="mt-3 font-medium text-slate-200">{OWNER.name}</p>
          <p className="text-sm text-slate-500">{t.role}</p>
        </div>
        {links.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{t.contact}</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="text-slate-300 transition-colors hover:text-sky-300"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} {OWNER.name} · {t.rights}
      </div>
    </footer>
  );
}

/* ---------- page ---------- */

export default function Home() {
  const [lang, setLang] = useState<Lang>("tr");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"invalid" | "failed" | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [ms, setMs] = useState(0);
  const [scanId, setScanId] = useState(0);
  const t = STRINGS[lang];

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

  async function scan(target: string, scanLang: Lang = lang) {
    const value = target.trim();
    if (value.length < 3) {
      setError("invalid");
      return;
    }
    setLoading(true);
    setError(null);
    const started = performance.now();
    try {
      const res = await fetch(`${API_URL}/api/scan/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value, lang: scanLang }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
      setMs(Math.round(performance.now() - started));
      setScanId((n) => n + 1);
    } catch {
      setResult(null);
      setError("failed");
    } finally {
      setLoading(false);
    }
  }

  function changeLang(l: Lang) {
    setLang(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
    // Re-run the last scan so the reasons come back in the new language.
    if (result) scan(result.url, l);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    scan(url);
  }

  const howIcons = [Icon.globe, Icon.cpu, Icon.list];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0d14]/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" aria-label="Kanca">
            <Logo />
          </a>
          <nav className="flex items-center gap-1 text-sm sm:gap-5">
            <a href="#how" className="hidden text-slate-400 transition-colors hover:text-white sm:block">
              {t.nav.how}
            </a>
            <a href="#model" className="hidden text-slate-400 transition-colors hover:text-white sm:block">
              {t.nav.model}
            </a>
            {REPO_URL && (
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.nav.source}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-400 transition-colors hover:text-white"
              >
                {Icon.github()}
                <span className="hidden sm:inline">GitHub</span>
              </a>
            )}
            <LangToggle lang={lang} onChange={changeLang} />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero + scanner */}
        <section className="relative overflow-hidden">
          <div className="grid-bg pointer-events-none absolute inset-0" />
          <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
            <div className="text-center">
              <p className="fade-up inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {t.eyebrow}
              </p>
              <h1
                className="fade-up font-display mx-auto mt-6 max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl sm:leading-tight"
                style={{ animationDelay: "0.05s" }}
              >
                {t.title}
              </h1>
              <p className="fade-up mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400" style={{ animationDelay: "0.1s" }}>
                {t.subtitle}
              </p>
            </div>

            <div
              className="fade-up mt-10 rounded-xl border border-white/10 bg-[#0e121b] p-2 shadow-2xl shadow-black/40"
              style={{ animationDelay: "0.15s" }}
            >
              <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">{t.inputLabel}</span>
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{Icon.link()}</span>
                  <input
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.placeholder}
                    className="w-full rounded-lg border border-transparent bg-white/[0.03] py-3 pl-10 pr-3 font-mono text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500/50 focus:bg-white/[0.05]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-sky-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-400 disabled:cursor-wait disabled:opacity-70"
                >
                  {loading ? t.scanning : t.scan}
                </button>
              </form>
              <div className={`relative mx-1 mt-2 h-px overflow-hidden ${loading ? "progress-bar bg-white/10" : "bg-transparent"}`} />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-2 pb-1 pt-1 text-xs">
                <span className="text-slate-500">{t.examples}:</span>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setUrl(ex);
                      scan(ex);
                    }}
                    className="max-w-full truncate rounded border border-white/10 px-1.5 py-0.5 font-mono text-slate-400 transition-colors hover:border-white/20 hover:text-slate-200"
                  >
                    {hostOf(ex)}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              {Icon.lock()}
              {t.privacy}
            </p>

            {error && (
              <div role="alert" className="fade-in mt-6 flex gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
                <span className="mt-0.5 text-rose-400">{Icon.alert()}</span>
                {t[error]}
              </div>
            )}

            {result && <ResultCard key={scanId} result={result} ms={ms} lang={lang} />}
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/10 bg-white/[0.015]">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4">
            {t.stats.map(([value, label], i) => (
              <div
                key={label}
                className={`px-4 py-8 text-center sm:px-6 ${i % 2 === 1 ? "border-l border-white/10" : ""} ${
                  i >= 2 ? "border-t border-white/10 sm:border-t-0" : ""
                } ${i === 2 ? "sm:border-l" : ""}`}
              >
                <dd className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{value}</dd>
                <dt className="mt-1 text-xs text-slate-500 sm:text-sm">{label}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-14 px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="01" title={t.howTitle} subtitle={t.howSubtitle} />
          <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 md:grid-cols-3">
            {t.how.map(([title, desc], i) => (
              <li key={title} className="bg-[#0a0d14] p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sky-400">
                    {howIcons[i]()}
                  </span>
                  <span className="font-mono text-xs text-slate-600">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-medium text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Model transparency */}
        <section id="model" className="scroll-mt-14 border-t border-white/10">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading eyebrow="02" title={t.modelTitle} subtitle={t.modelSubtitle} />
              <dl className="mt-8 divide-y divide-white/10 rounded-xl border border-white/10">
                {t.metrics.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-5 py-3.5 text-sm">
                    <dt className="text-slate-400">{k}</dt>
                    <dd className="font-mono font-medium text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="self-end rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 text-amber-400">
                {Icon.alert()}
                <h3 className="font-medium text-white">{t.leakTitle}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{t.leakBody}</p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg border border-white/10 p-4">
                  <p className="font-mono text-2xl text-slate-500 line-through decoration-rose-500/70">{lang === "tr" ? "%99,6" : "99.6%"}</p>
                  <p className="mt-1 text-xs text-slate-500">v1 · full URL</p>
                </div>
                <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-4">
                  <p className="font-mono text-2xl text-white">{lang === "tr" ? "%85,4" : "85.4%"}</p>
                  <p className="mt-1 text-xs text-slate-400">v2 · hostname only</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer lang={lang} />
    </div>
  );
}
