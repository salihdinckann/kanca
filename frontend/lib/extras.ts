import type { Lang } from "@/lib/i18n";

type T = Record<Lang, string>;

/* ---------- "Hangisi sahte?" quiz ----------
 * Each round pairs a brand's real address with a phishing domain taken from
 * USOM's public list (19 Oct – 6 Nov 2026). `realFirst` only fixes the order. */
export type QuizRound = { brand: string; real: string; fake: string; realFirst: boolean; why: T };

export const QUIZ: QuizRound[] = [
  {
    brand: "sahibinden",
    real: "sahibinden.com",
    fake: "sahibinden-param-guvende.tr-servis-onay.online",
    realFirst: false,
    why: {
      tr: "Asıl alan adı en sondaki tr-servis-onay.online. 'sahibinden' yalnızca alt alan adı olarak eklenmiş; bunu herkes yazabilir.",
      en: "The real domain is the last part, tr-servis-onay.online. 'sahibinden' is just a subdomain, which anyone can add.",
    },
  },
  {
    brand: "e-Devlet",
    real: "turkiye.gov.tr",
    fake: "edevletvatandasgiris.org",
    realFirst: true,
    why: {
      tr: "e-Devlet yalnızca turkiye.gov.tr adresinde çalışır. Devlet siteleri .gov.tr ile biter; .org ile bitmez.",
      en: "e-Devlet only lives at turkiye.gov.tr. Government sites end in .gov.tr, never .org.",
    },
  },
  {
    brand: "PTT",
    real: "ptt.gov.tr",
    fake: "trptt-gov.eu.cc",
    realFirst: false,
    why: {
      tr: "'gov' kelimesi adın içine yazılmış ama adres .gov.tr ile bitmiyor. Gerçek alan adı ücretsiz verilen eu.cc.",
      en: "'gov' is written into the name, but the address doesn't end in .gov.tr. The real domain is the free eu.cc.",
    },
  },
  {
    brand: "Garanti BBVA",
    real: "garantibbva.com.tr",
    fake: "garanti-odeme-portali.cloud",
    realFirst: true,
    why: {
      tr: "Bankalar .cloud gibi ucuz uzantılar kullanmaz. Tirelerle eklenen 'odeme-portali' de klasik bir oltalama kalıbı.",
      en: "Banks don't use cheap endings like .cloud, and 'odeme-portali' (payment portal) glued on with hyphens is a classic phishing pattern.",
    },
  },
  {
    brand: "Trendyol",
    real: "trendyol.com",
    fake: "trendyoll.xin",
    realFirst: false,
    why: {
      tr: "Fazladan bir 'l' harfi var: trendyoll. Hızlı okurken göz bunu atlar. .xin uzantısı da Türk mağazalarında görülmez.",
      en: "There's an extra 'l': trendyoll. Eyes skip it when reading fast, and no Turkish shop uses .xin.",
    },
  },
  {
    brand: "MHRS",
    real: "mhrs.gov.tr",
    fake: "mhrsrandevuonline.xyz",
    realFirst: true,
    why: {
      tr: "Hastane randevusu bir devlet hizmeti; adresi .gov.tr ile biter. .xyz, oltalamada en sık kullanılan uzantılardan biri.",
      en: "Hospital appointments are a state service ending in .gov.tr. .xyz is one of the endings phishers use most.",
    },
  },
  {
    brand: "A101",
    real: "a101.com.tr",
    fake: "a101onlines.com",
    realFirst: false,
    why: {
      tr: "Marka adına 'onlines' eklenmiş. Gerçek mağaza a101.com.tr; sahte site birkaç günlük ve Kanca'nın ilk modeli bunu kaçırmıştı.",
      en: "'onlines' is tacked onto the brand. The real shop is a101.com.tr; the fake was days old, and Kanca's first model missed it.",
    },
  },
];

export const QUIZ_TEXT = {
  tr: {
    kicker: "Kendini dene",
    title: "Hangisi sahte?",
    subtitle: "Sahtelerin hepsi USOM listesindeki gerçek oltalama adresleri. Sahte olanı seç.",
    round: "Soru",
    correct: "Doğru! Bu bir kanca.",
    wrong: "Kancayı yuttun.",
    fakeWas: "Sahte olan",
    next: "Sonraki",
    again: "Baştan oyna",
    score: "Skor",
    done: (s: number, n: number) =>
      s === n ? `${n}/${n}. Gözünden kaçmıyor.` : s >= n - 2 ? `${s}/${n}. Fena değil, ama tek bir tık yeter.` : `${s}/${n}. Şüphelendiğinde Kanca'ya sor.`,
  },
  en: {
    kicker: "Test yourself",
    title: "Which one is fake?",
    subtitle: "Every fake is a real phishing address from USOM's list. Pick it.",
    round: "Round",
    correct: "Right! That's a hook.",
    wrong: "You took the bait.",
    fakeWas: "The fake was",
    next: "Next",
    again: "Play again",
    score: "Score",
    done: (s: number, n: number) =>
      s === n ? `${n}/${n}. Nothing gets past you.` : s >= n - 2 ? `${s}/${n}. Not bad, but one click is enough.` : `${s}/${n}. When in doubt, ask Kanca.`,
  },
};

/* ---------- SMS phone ---------- */
export type Sms = { sender: string; time: string; body: T; link: string };

export const SMS: Sms[] = [
  {
    sender: "PTT",
    time: "09:41",
    body: {
      tr: "Sayın müşterimiz, kargonuz adres bilgisi eksik olduğu için teslim edilemedi. 24 saat içinde güncellemezseniz iade edilecektir:",
      en: "Dear customer, your parcel could not be delivered due to a missing address. It will be returned unless you update within 24 hours:",
    },
    link: "ptt-kargo-teslimat.click/odeme",
  },
  {
    sender: "e-Devlet",
    time: "14:02",
    body: {
      tr: "Adınıza 1.850 TL vergi iadesi tanımlanmıştır. İadenizi almak için bilgilerinizi doğrulayın:",
      en: "A tax refund of 1,850 TL has been issued in your name. Verify your details to receive it:",
    },
    link: "edevletvatandasgiris.org/iade",
  },
  {
    sender: "GARANTi",
    time: "22:17",
    body: {
      tr: "Hesabınızda şüpheli işlem tespit edildi. Kartınız bloke edilmeden önce onaylayın:",
      en: "Suspicious activity was detected on your account. Confirm before your card is blocked:",
    },
    link: "garanti-odeme-portali.cloud/onay",
  },
];

export const SMS_TEXT = {
  tr: {
    kicker: "Mesaj tarama",
    title: "Linke dokunmadan önce.",
    subtitle:
      "Oltalama çoğu zaman bir SMS ile başlar: kargo, iade, bloke kart. Telefondaki linke dokun; Kanca açmadan inceler.",
    tap: "Linke dokun",
    checking: "Kanca bakıyor…",
    other: "Başka bir mesaj",
    sample: "Örnek mesaj",
    failed: "Sunucu uyanıyor; birkaç saniye sonra tekrar dokun.",
    today: "Bugün",
  },
  en: {
    kicker: "Message scan",
    title: "Before you tap.",
    subtitle:
      "Phishing usually starts with an SMS: a parcel, a refund, a blocked card. Tap the link on the phone; Kanca checks it without opening it.",
    tap: "Tap the link",
    checking: "Kanca is checking…",
    other: "Another message",
    sample: "Sample message",
    failed: "The server is waking up; tap again in a few seconds.",
    today: "Today",
  },
};

/* ---------- link X-ray ---------- */
export const XRAY_TEXT = {
  tr: {
    title: "Link röntgeni",
    hint: "tarayıcında anlık ön inceleme",
    scheme: "protokol",
    sub: "alt alan adı",
    domain: "asıl alan adı",
    tld: "uzantı",
    path: "yol",
    realDomain: (d: string) => `Asıl alan adı: ${d}`,
    brandInSub: (b: string) => `'${b}' alt alan adında: marka adresi gibi görünmesi için eklenmiş olabilir`,
    brandGlued: (b: string) => `'${b}' alan adına eklenmiş: markanın resmî adresi olmayabilir`,
    riskyTld: (t: string) => `.${t} oltalamada sık kullanılan ucuz bir uzantı`,
    fakeGov: "'gov' adın içinde ama adres .gov.tr ile bitmiyor",
    keyword: (k: string) => `'${k}' oltalama linklerinde sık geçen bir kelime`,
    at: "'@' işareti: tarayıcı @ öncesini yok sayar",
    ip: "Alan adı yerine IP adresi kullanılmış",
    deepSub: "Çok fazla alt alan adı katmanı",
    http: "Bağlantı şifresiz (http)",
    official: "Resmî kamu uzantısı (.gov.tr)",
  },
  en: {
    title: "Link X-ray",
    hint: "instant preview, in your browser",
    scheme: "scheme",
    sub: "subdomain",
    domain: "real domain",
    tld: "ending",
    path: "path",
    realDomain: (d: string) => `Real domain: ${d}`,
    brandInSub: (b: string) => `'${b}' sits in the subdomain: likely added to look like the brand`,
    brandGlued: (b: string) => `'${b}' is glued into the name: may not be the official address`,
    riskyTld: (t: string) => `.${t} is a cheap ending common in phishing`,
    fakeGov: "'gov' appears in the name but it doesn't end in .gov.tr",
    keyword: (k: string) => `'${k}' is a word common in phishing links`,
    at: "'@' sign: browsers ignore everything before it",
    ip: "An IP address instead of a domain name",
    deepSub: "Too many subdomain levels",
    http: "Unencrypted connection (http)",
    official: "Official government ending (.gov.tr)",
  },
};

/* ---------- stats + brands (USOM list, 19 Oct – 6 Nov 2026) ---------- */
export const STATS_TEXT = {
  tr: {
    kicker: "Sahadan veri",
    title: "Üç haftada Türkiye'ye atılan kancalar.",
    source: "Kaynak: USOM zararlı bağlantı listesi, 19 Ekim – 6 Kasım 2026 (yalnızca oltalama kayıtları). Yaş değerleri, 150 alan adlık örneklemde RDAP'ın yanıt verdiği 55 kayıttan.",
    stats: [
      { value: 2153, suffix: "", label: "oltalama alan adı listeye girdi" },
      { value: 16, suffix: " gün", label: "yaşı bilinenlerin medyan yaşı" },
      { value: 74.5, suffix: "", prefix: "%", label: "yaşı bilinenlerin 30 günden genç olanı" },
      { value: 64.2, suffix: "", prefix: "%", label: "küresel veriyle eğitilmiş modelin yakaladığı" },
    ],
    brandsTitle: "En çok taklit edilenler",
    brandsUnit: "sahte alan adı",
  },
  en: {
    kicker: "Field data",
    title: "Three weeks of hooks cast at Turkey.",
    source: "Source: USOM malicious link list, 19 Oct – 6 Nov 2026 (phishing entries only). Ages come from the 55 of 150 sampled domains that RDAP answered for.",
    stats: [
      { value: 2153, suffix: "", label: "phishing domains added to the list" },
      { value: 16, suffix: " days", label: "median age, where age was known" },
      { value: 74.5, suffix: "%", label: "of those were under 30 days old" },
      { value: 64.2, suffix: "%", label: "caught by a model trained on global data" },
    ],
    brandsTitle: "Most impersonated",
    brandsUnit: "fake domains",
  },
};

/** [name, fake-domain count, badge colour, badge text colour, initial]. Colours echo each brand; no logos are used. */
export const BRANDS: [string, number, string, string, string][] = [
  ["sahibinden", 42, "#ffe800", "#1a1a1a", "S"],
  ["Garanti BBVA", 21, "#00854a", "#ffffff", "G"],
  ["Yatırım / borsa", 17, "#f2b84b", "#1a1a1a", "₺"],
  ["PTT", 15, "#ffcc00", "#1a1a1a", "P"],
  ["Trendyol", 10, "#f27a1a", "#ffffff", "T"],
  ["e-Devlet", 9, "#e30a17", "#ffffff", "e"],
  ["Kooperatif market", 9, "#2e8b3a", "#ffffff", "K"],
  ["MHRS", 9, "#0071bc", "#ffffff", "M"],
  ["A101", 5, "#00a0e3", "#ffffff", "A"],
  ["Akbank", 4, "#dc0005", "#ffffff", "A"],
  ["HGS", 3, "#005ca9", "#ffffff", "H"],
  ["TOKİ", 3, "#1b3c73", "#ffffff", "T"],
];

/* ---------- FAQ ---------- */
export const FAQ: Record<Lang, { kicker: string; title: string; items: [string, string][] }> = {
  tr: {
    kicker: "SSS",
    title: "Aklına takılanlar",
    items: [
      [
        "Taradığım linkler kaydediliyor mu?",
        "Hayır. Link yalnızca analiz için sunucuya gider, sonuç döner ve link saklanmaz. Kullanıcı hesabı veya çerez yok.",
      ],
      [
        "Kanca linki açıyor mu?",
        "Hayır, sayfa hiç açılmaz. Yalnızca adresin metni incelenir; ek olarak alan adının kayıt tarihi (RDAP) ve Google Safe Browsing listesi sorgulanır.",
      ],
      [
        "Ne kadar doğru?",
        "Model, daha önce hiç görmediği alan adlarında %85 doğruluk ve %93,7 kesinlikle ölçüldü. Kesin bir yargı değil, ikinci bir göz: şüpheliyse açma.",
      ],
      [
        "Ücretli mi?",
        "Hayır. Site ve Chrome eklentisi ücretsiz, kaynak kodu GitHub'da açık.",
      ],
      [
        "Tehlikeli bir linke zaten tıkladım, ne yapmalıyım?",
        "Bilgi girdiysen şifreni hemen değiştir, kart bilgisi girdiysen bankanı ara ve kartını kapattır. Linki USOM'a (usom.gov.tr) bildirebilirsin.",
      ],
    ],
  },
  en: {
    kicker: "FAQ",
    title: "Common questions",
    items: [
      [
        "Are the links I scan stored?",
        "No. The link goes to the server only to be analysed; the result comes back and the link isn't kept. No accounts, no cookies.",
      ],
      [
        "Does Kanca open the link?",
        "No, the page is never opened. Only the address text is analysed, plus a lookup of the domain's registration date (RDAP) and Google Safe Browsing.",
      ],
      [
        "How accurate is it?",
        "On domains it had never seen, the model measured 85% accuracy and 93.7% precision. It's a second opinion, not a verdict: if in doubt, don't open it.",
      ],
      ["Is it paid?", "No. The site and the Chrome extension are free, and the source code is on GitHub."],
      [
        "I already clicked a dangerous link. What now?",
        "If you entered anything, change that password now; if you entered card details, call your bank and block the card. You can report the link to USOM (usom.gov.tr).",
      ],
    ],
  },
};
