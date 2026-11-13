"use client";

import { useState } from "react";

import { QUIZ, QUIZ_TEXT } from "@/lib/extras";
import type { Lang } from "@/lib/i18n";

/** "Which one is fake?": real brand address vs a phishing domain from USOM's list. */
export function Quiz({ lang }: { lang: Lang }) {
  const t = QUIZ_TEXT[lang];
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const done = round >= QUIZ.length;
  const q = QUIZ[Math.min(round, QUIZ.length - 1)];
  const options = q.realFirst ? [q.real, q.fake] : [q.fake, q.real];
  const right = picked === q.fake;

  function pick(o: string) {
    if (picked) return;
    setPicked(o);
    if (o === q.fake) setScore((s) => s + 1);
  }

  function next() {
    setPicked(null);
    setRound((r) => r + 1);
  }

  function restart() {
    setPicked(null);
    setScore(0);
    setRound(0);
  }

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
        <span>{done ? t.score : `${t.round} ${round + 1} / ${QUIZ.length}`}</span>
        <span>
          {t.score}: <span className="text-paper">{score}</span>
        </span>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden="true">
        {QUIZ.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < round || done ? "bg-sea" : i === round ? "bg-paper/40" : "bg-line"}`} />
        ))}
      </div>

      {done ? (
        <div className="card-in py-10 text-center">
          <p className="font-display text-6xl font-semibold text-paper">
            {score}
            <span className="text-faint">/{QUIZ.length}</span>
          </p>
          <p className="mt-4 text-muted">{t.done(score, QUIZ.length)}</p>
          <button
            type="button"
            onClick={restart}
            className="glow-bobber mt-8 rounded-xl bg-bobber px-6 py-3 text-sm font-semibold text-ink transition-all hover:-translate-y-px hover:bg-[#ff7a52]"
          >
            {t.again}
          </button>
        </div>
      ) : (
        <div key={round} className="card-in">
          <p className="mt-6 font-mono text-xs text-muted">{q.brand}</p>
          <div className="mt-3 grid gap-3">
            {options.map((o) => {
              const isFake = o === q.fake;
              const state = !picked ? "idle" : isFake ? "fake" : o === picked ? "wrong" : "real";
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => pick(o)}
                  disabled={!!picked}
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-4 text-left font-mono text-sm transition-all ${
                    state === "idle"
                      ? "border-line bg-ink/50 text-paper hover:-translate-y-0.5 hover:border-paper/30"
                      : state === "fake"
                        ? "border-bobber bg-bobber/10 text-paper"
                        : state === "wrong"
                          ? "border-sea/60 bg-sea/5 text-paper"
                          : "border-line bg-ink/30 text-faint"
                  }`}
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-faint" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <rect x="2" y="7" width="12" height="7.5" rx="1.5" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" />
                  </svg>
                  <span className="min-w-0 flex-1 break-all">{o}</span>
                  {state === "fake" && (
                    <span className="chip-in shrink-0 rounded-full bg-bobber px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink">
                      {lang === "tr" ? "sahte" : "fake"}
                    </span>
                  )}
                  {(state === "wrong" || (picked && !isFake && state === "real")) && (
                    <span className="chip-in shrink-0 rounded-full bg-sea/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sea">
                      {lang === "tr" ? "gerçek" : "real"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {picked && (
            <div className="card-in mt-5">
              <p className={`font-display text-lg font-semibold ${right ? "text-sea" : "text-bobber"}`}>{right ? t.correct : t.wrong}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{q.why[lang]}</p>
              <button
                type="button"
                onClick={next}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-line bg-paper/5 px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-paper/30"
              >
                {t.next} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
