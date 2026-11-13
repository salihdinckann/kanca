"use client";

import { useState } from "react";

import { SMS, SMS_TEXT } from "@/lib/extras";
import { Lang, STRINGS, Verdict } from "@/lib/i18n";

type Scan = { risk_score: number; verdict: Verdict; reasons: string[] };

const TONE: Record<Verdict, { text: string; bg: string; ring: string }> = {
  safe: { text: "text-sea", bg: "bg-sea", ring: "border-sea/60" },
  suspicious: { text: "text-sand", bg: "bg-sand", ring: "border-sand/60" },
  dangerous: { text: "text-bobber", bg: "bg-bobber", ring: "border-bobber" },
};

/** A phone showing a realistic phishing SMS; tapping the link scans it with the real API. */
export function SmsPhone({ lang, apiUrl }: { lang: Lang; apiUrl: string }) {
  const t = SMS_TEXT[lang];
  const [i, setI] = useState(0);
  const [state, setState] = useState<"idle" | "checking" | "done" | "failed">("idle");
  const [scan, setScan] = useState<Scan | null>(null);
  const sms = SMS[i];

  async function tap() {
    if (state === "checking") return;
    setState("checking");
    try {
      const res = await fetch(`${apiUrl}/api/scan/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sms.link, lang }),
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) throw new Error();
      setScan(await res.json());
      setState("done");
    } catch {
      setState("failed");
    }
  }

  function other() {
    setI((n) => (n + 1) % SMS.length);
    setScan(null);
    setState("idle");
  }

  const tone = scan ? TONE[scan.verdict] : null;

  return (
    <div className="flex flex-col items-center">
      {/* phone */}
      <div className="relative w-[300px] rounded-[44px] border border-paper/15 bg-[#05080d] p-3 shadow-[0_40px_120px_-40px_rgba(79,209,184,0.35),inset_0_0_0_1px_rgba(236,230,217,0.04)]">
        <div className="relative h-[540px] overflow-hidden rounded-[34px] bg-gradient-to-b from-[#121c2b] to-[#0b121c]">
          {/* status bar + notch */}
          <div className="flex items-center justify-between px-6 pt-3 font-mono text-[11px] text-paper/80">
            <span>{sms.time}</span>
            <span className="absolute left-1/2 top-2.5 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
            <span className="flex items-center gap-1">
              <span className="flex items-end gap-px" aria-hidden="true">
                {[4, 6, 8, 10].map((h) => (
                  <span key={h} className="w-[3px] rounded-sm bg-paper/80" style={{ height: h }} />
                ))}
              </span>
              <span className="ml-1 h-2.5 w-5 rounded-[3px] border border-paper/60 p-px">
                <span className="block h-full w-3/4 rounded-[1px] bg-paper/80" />
              </span>
            </span>
          </div>

          {/* chat header */}
          <div className="mt-5 flex flex-col items-center border-b border-paper/10 pb-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-paper/25 to-paper/10 font-display text-sm font-semibold text-paper">
              {sms.sender.slice(0, 1)}
            </span>
            <span className="mt-1.5 text-xs font-medium text-paper">{sms.sender}</span>
          </div>

          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-wider text-faint">
            {t.today} {sms.time}
          </p>

          {/* message bubble */}
          <div key={i} className="card-in mx-4 mt-3 max-w-[85%] rounded-2xl rounded-bl-md bg-[#23303f] px-3.5 py-2.5 text-[13px] leading-snug text-paper">
            {sms.body[lang]}{" "}
            <button
              type="button"
              onClick={tap}
              className="break-all text-left text-[#7cb8ff] underline underline-offset-2"
            >
              {sms.link}
            </button>
          </div>

          {state === "idle" && (
            <p className="drift mx-6 mt-4 flex items-center gap-2 font-mono text-[11px] text-sand">
              <span aria-hidden="true">☝</span> {t.tap}
            </p>
          )}

          {/* scan sheet */}
          {state !== "idle" && (
            <div className="card-in absolute inset-x-3 bottom-3 rounded-3xl border border-line bg-[#0d1522]/95 p-4 backdrop-blur">
              {state === "checking" && (
                <div className="flex items-center gap-3 py-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-sand" />
                  <span className="text-sm text-muted">{t.checking}</span>
                </div>
              )}
              {state === "failed" && <p className="py-2 text-sm text-muted">{t.failed}</p>}
              {state === "done" && scan && tone && (
                <>
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] ${tone.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${tone.bg}`} />
                      {STRINGS[lang].verdict[scan.verdict].label}
                    </span>
                    <span className={`font-display text-3xl font-semibold tabular-nums ${tone.text}`}>{scan.risk_score}</span>
                  </div>
                  <p className="mt-1 font-display text-base font-semibold text-paper">{STRINGS[lang].verdict[scan.verdict].title}</p>
                  <ul className="mt-2 space-y-1.5">
                    {scan.reasons.slice(0, 3).map((r, k) => (
                      <li key={r} className="line-in flex gap-2 text-xs leading-snug text-muted" style={{ animationDelay: `${0.15 + k * 0.08}s` }}>
                        <span className={tone.text}>•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">{t.sample}</span>
        <button
          type="button"
          onClick={other}
          className="rounded-full border border-line bg-deep/60 px-4 py-1.5 text-xs text-muted transition-colors hover:border-paper/30 hover:text-paper"
        >
          {t.other} ↻
        </button>
      </div>
    </div>
  );
}
