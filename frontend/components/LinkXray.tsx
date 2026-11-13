"use client";

import { XRAY_TEXT } from "@/lib/extras";
import type { Lang } from "@/lib/i18n";

// Suffixes where the registrable domain has three labels (garanti.com.tr, x.pages.dev).
const MULTI = [
  "com.tr", "gov.tr", "org.tr", "net.tr", "edu.tr", "bel.tr", "k12.tr", "av.tr", "gen.tr", "web.tr", "biz.tr", "info.tr",
  "co.uk", "eu.cc", "pages.dev", "netlify.app", "vercel.app", "github.io", "blogspot.com", "blogdns.com", "web.app",
  "firebaseapp.com", "lovable.app", "gleeze.com",
];
const RISKY_TLD = new Set([
  "click", "xyz", "online", "cfd", "sbs", "top", "art", "cloud", "xin", "luxe", "ninja", "icu", "shop", "live", "site",
  "buzz", "rest", "lol", "monster", "cyou", "store", "info", "cc", "tk", "ml", "ga", "cf", "gq", "zip", "mov",
]);
const BRANDS = [
  "garanti", "akbank", "ziraat", "isbank", "yapikredi", "vakif", "halkbank", "enpara", "papara", "qnb", "ptt", "edevlet",
  "sahibinden", "trendyol", "hepsiburada", "a101", "mhrs", "hgs", "turkcell", "vodafone", "paypal", "apple",
  "netflix", "instagram", "whatsapp", "google", "microsoft", "amazon",
];
const WORDS = [
  "giris", "login", "signin", "dogrula", "verify", "odeme", "iade", "guncelle", "onay", "hesap", "secure", "guvenli",
  "kargo", "teslimat", "destek", "account", "bonus", "kampanya", "firsat", "basvuru", "sifre", "password", "update",
];

// Official addresses that contain a brand name plus something else.
const OFFICIAL = new Set([
  "garantibbva.com.tr", "pttavm.com", "ptt.gov.tr", "turkiye.gov.tr", "isbank.com.tr", "ziraatbank.com.tr",
  "vakifbank.com.tr", "yapikredi.com.tr", "akbank.com", "qnb.com.tr", "a101.com.tr", "trendyol.com", "sahibinden.com",
  "hepsiburada.com", "mhrs.gov.tr", "turkcell.com.tr", "vodafone.com.tr", "paypal.com", "apple.com", "google.com",
  "netflix.com", "instagram.com", "whatsapp.com", "microsoft.com", "amazon.com", "amazon.com.tr", "enpara.com", "papara.com",
]);

/** The list entry that appears earliest in `text` (longest wins a tie), so "sahibinden-param" finds sahibinden, not enpara. */
function firstHit(list: string[], text: string) {
  let best: string | undefined;
  let at = Infinity;
  for (const w of list) {
    const i = text.indexOf(w);
    if (i >= 0 && (i < at || (i === at && w.length > (best?.length ?? 0)))) {
      best = w;
      at = i;
    }
  }
  return best;
}

type Part = { text: string; kind: "scheme" | "sub" | "domain" | "tld" | "path" | "dot" };

function analyse(raw: string) {
  const value = raw.trim();
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
  let u: URL;
  try {
    u = new URL(hasScheme ? value : `http://${value}`);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (!host.includes(".")) return null;
  const labels = host.split(".");
  const isIp = /^\d+(\.\d+){3}$/.test(host);
  const multi = MULTI.find((s) => host.endsWith(`.${s}`));
  const suffix = isIp ? "" : (multi ?? labels[labels.length - 1]);
  const suffixLabels = suffix ? suffix.split(".").length : 0;
  const domainLabel = isIp ? host : labels[labels.length - suffixLabels - 1] ?? "";
  const sub = isIp ? "" : labels.slice(0, labels.length - suffixLabels - 1).join(".");
  const path = (u.pathname === "/" ? "" : u.pathname) + u.search;
  const tld = labels[labels.length - 1];

  const parts: Part[] = [];
  if (hasScheme) parts.push({ text: `${u.protocol}//`, kind: "scheme" });
  if (sub) parts.push({ text: sub, kind: "sub" }, { text: ".", kind: "dot" });
  parts.push({ text: domainLabel, kind: "domain" });
  if (suffix) parts.push({ text: `.${suffix}`, kind: "tld" });
  if (path) parts.push({ text: path, kind: "path" });

  return { value, host, labels, isIp, sub, domainLabel, suffix, tld, path, parts, http: hasScheme && u.protocol === "http:" };
}

const COLORS: Record<Part["kind"], string> = {
  scheme: "text-faint",
  sub: "text-sand",
  dot: "text-faint",
  domain: "text-paper font-semibold",
  tld: "text-sea",
  path: "text-muted",
};

/** Instant, client-side breakdown of a URL while it's being typed. Not the model's verdict. */
export function LinkXray({ value, lang }: { value: string; lang: Lang }) {
  const t = XRAY_TEXT[lang];
  const a = analyse(value);
  if (!a) return null;

  const notes: { text: string; bad: boolean }[] = [];
  const realDomain = a.isIp ? a.host : `${a.domainLabel}.${a.suffix}`;
  notes.push({ text: t.realDomain(realDomain), bad: false });
  if (a.suffix === "gov.tr") notes.push({ text: t.official, bad: false });
  if (a.isIp) notes.push({ text: t.ip, bad: true });
  if (a.value.includes("@")) notes.push({ text: t.at, bad: true });
  const brandSub = firstHit(BRANDS, a.sub.replace(/[-.]/g, ""));
  if (brandSub) notes.push({ text: t.brandInSub(brandSub), bad: true });
  const glued = a.domainLabel.replace(/-/g, "");
  const brandGlued = firstHit(BRANDS, glued);
  if (!brandSub && brandGlued && brandGlued !== glued && a.suffix !== "gov.tr" && !OFFICIAL.has(realDomain)) notes.push({ text: t.brandGlued(brandGlued), bad: true });
  if (/gov/.test(a.domainLabel + a.sub) && a.suffix !== "gov.tr") notes.push({ text: t.fakeGov, bad: true });
  if (RISKY_TLD.has(a.tld)) notes.push({ text: t.riskyTld(a.tld), bad: true });
  if (a.sub.split(".").filter(Boolean).length >= 3) notes.push({ text: t.deepSub, bad: true });
  const word = firstHit(WORDS, (a.host + a.path).toLowerCase().replace(/[-_./]/g, ""));
  if (word) notes.push({ text: t.keyword(word), bad: true });
  if (a.http) notes.push({ text: t.http, bad: true });

  const legend: [Part["kind"], string][] = [
    ["sub", t.sub],
    ["domain", t.domain],
    ["tld", t.tld],
    ["path", t.path],
  ];

  return (
    <div className="card-in glass mt-3 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-sea" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="1.5" y="3" width="13" height="10" rx="2" />
            <path d="M4 8h8M8 5v6" opacity=".5" />
          </svg>
          {t.title}
        </p>
        <p className="hidden font-mono text-[10px] text-faint sm:block">{t.hint}</p>
      </div>
      <p className="mt-3 break-all font-mono text-[15px] leading-relaxed">
        {a.parts.map((p, i) => (
          <span key={i} className={COLORS[p.kind]}>
            {p.text}
          </span>
        ))}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider">
        {legend.map(([k, label]) => (
          <span key={k} className={COLORS[k]}>
            ▪ {label}
          </span>
        ))}
      </div>
      <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
        {notes.map((n) => (
          <li key={n.text} className="flex gap-2 text-xs leading-snug text-muted">
            <span className={n.bad ? "text-bobber" : "text-sea"}>{n.bad ? "!" : "→"}</span>
            {n.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
