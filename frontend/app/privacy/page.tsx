import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/Logo";
import { OWNER } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gizlilik Politikası / Privacy Policy – Kanca",
  description: "Kanca web sitesi ve tarayıcı eklentisi hangi verileri işler, nereye gönderir ve neyi saklamaz.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = { tr: "5 Kasım 2026", en: "November 5, 2026" };

type Section = { title: string; body: string[] };

const CONTENT: Record<"tr" | "en", { heading: string; intro: string; sections: Section[] }> = {
  tr: {
    heading: "Gizlilik Politikası",
    intro:
      "Bu politika Kanca web sitesi (kanca.salihdinckan.com) ve Kanca tarayıcı eklentisi için geçerlidir. Kısaca: yalnızca taramasını istediğin linki işleriz, hiçbir şeyi saklamayız ve hesap, çerez ya da reklam yoktur.",
    sections: [
      {
        title: "Hangi veriler işlenir",
        body: [
          "Taramasını istediğin link (URL) ya da sitedeki Mesaj sekmesine yapıştırdığın metin. Metinden yalnızca içindeki linkler çıkarılır ve taranır.",
          "Seçtiğin dil (tr/en), sonuçların hangi dilde gösterileceği için.",
          "Ad, e-posta, konum, tarama geçmişi gibi kişisel bilgiler toplanmaz.",
        ],
      },
      {
        title: "Eklenti ne zaman veri gönderir",
        body: [
          "Eklenti hiçbir şeyi kendiliğinden taramaz ve gezinme geçmişini okumaz.",
          "Açık sayfanın adresi yalnızca eklenti simgesine tıkladığında; bir link yalnızca sağ tıklayıp \"Linki Kanca ile tara\"yı seçtiğinde Kanca sunucusuna (api.salihdinckan.com) gönderilir.",
          "Eklenti, cihazında yalnızca dil tercihini saklar (chrome.storage).",
        ],
      },
      {
        title: "Veriler nereye gider",
        body: [
          "Kanca sunucusu linki analiz eder ve sonucu döndürür. Linkler ve sonuçlar veritabanına ya da kayıtlara yazılmaz; istek bitince silinir.",
          "Link, bilinen tehlikeli siteler listesiyle karşılaştırılmak üzere Google Safe Browsing'e gönderilir (Google Gizlilik Politikası geçerlidir).",
          "Linkteki alan adı (ör. ornek.com), kayıt tarihini öğrenmek için herkese açık RDAP kayıt servisine (rdap.org) sorulur. Alan adlarının yaşı 24 saat boyunca sunucu belleğinde tutulur; bu bilgi kişisel değildir.",
          "Veriler satılmaz, reklam için kullanılmaz ve başka kimseyle paylaşılmaz.",
        ],
      },
      {
        title: "Çerezler ve takip",
        body: ["Kanca çerez, analiz aracı ya da reklam takibi kullanmaz. Site dil tercihini yalnızca tarayıcında (localStorage) saklar."],
      },
      {
        title: "İletişim",
        body: [`Sorular için: ${OWNER.email}`],
      },
    ],
  },
  en: {
    heading: "Privacy Policy",
    intro:
      "This policy covers the Kanca website (kanca.salihdinckan.com) and the Kanca browser extension. In short: we only process the link you ask us to check, we store nothing, and there are no accounts, cookies or ads.",
    sections: [
      {
        title: "What is processed",
        body: [
          "The link (URL) you ask to scan, or the text you paste into the Message tab on the website. Only the links found in that text are extracted and scanned.",
          "Your chosen language (tr/en), so results are shown in that language.",
          "No personal information such as name, email, location or scan history is collected.",
        ],
      },
      {
        title: "When the extension sends data",
        body: [
          "The extension never scans anything on its own and does not read your browsing history.",
          "The address of the open page is sent to the Kanca server (api.salihdinckan.com) only when you click the extension icon; a link is sent only when you right-click it and choose \"Scan link with Kanca\".",
          "The extension stores only your language preference on your device (chrome.storage).",
        ],
      },
      {
        title: "Where the data goes",
        body: [
          "The Kanca server analyzes the link and returns the result. Links and results are not written to a database or logs; they are discarded when the request ends.",
          "The link is sent to Google Safe Browsing to check it against known dangerous sites (Google's Privacy Policy applies).",
          "The link's domain (e.g. example.com) is looked up in the public RDAP registry service (rdap.org) to find its registration date. Domain ages are kept in server memory for 24 hours; this is not personal information.",
          "Data is never sold, used for advertising or shared with anyone else.",
        ],
      },
      {
        title: "Cookies and tracking",
        body: ["Kanca uses no cookies, analytics or ad tracking. The website stores your language preference only in your browser (localStorage)."],
      },
      {
        title: "Contact",
        body: [`Questions: ${OWNER.email}`],
      },
    ],
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-[72px] max-w-3xl items-center px-5 sm:px-8">
        <Link href="/" aria-label="Kanca" className="transition-opacity hover:opacity-80">
          <Logo size="lg" />
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8">
        {(["tr", "en"] as const).map((lang) => {
          const c = CONTENT[lang];
          return (
            <article key={lang} lang={lang} className="border-b border-line py-12 first:pt-0 last:border-b-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                {lang === "tr" ? "Son güncelleme" : "Last updated"}: {UPDATED[lang]}
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold text-paper">{c.heading}</h1>
              <p className="mt-5 leading-relaxed text-muted">{c.intro}</p>
              {c.sections.map((s) => (
                <section key={s.title} className="mt-9">
                  <h2 className="font-display text-lg font-semibold text-paper">{s.title}</h2>
                  <ul className="mt-3 space-y-2.5">
                    {s.body.map((line) => (
                      <li key={line} className="relative pl-5 text-[15px] leading-relaxed text-muted">
                        <span className="absolute left-0 text-faint" aria-hidden="true">—</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </article>
          );
        })}
      </main>
    </div>
  );
}
