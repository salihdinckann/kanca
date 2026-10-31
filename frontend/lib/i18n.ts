export type Lang = "tr" | "en";
export type Verdict = "safe" | "suspicious" | "dangerous";
export type Engine = "reputation" | "ml" | "heuristic";

export const STRINGS = {
  tr: {
    nav: { how: "Nasıl çalışır", model: "Model", source: "Kaynak kod" },
    eyebrow: "Açık kaynak · Yapay zeka destekli",
    title: "Kancayı yemeden önce gör.",
    subtitle:
      "Kanca, SMS, e-posta ve mesajlarla gelen şüpheli linkleri makine öğrenmesiyle analiz eder; tıklamadan önce risk skorunu ve gerekçelerini saniyeler içinde gösterir.",
    placeholder: "https://ornek-site.com/giris",
    inputLabel: "Taranacak link",
    scan: "Analiz et",
    scanning: "Analiz ediliyor",
    examples: "Örnek dene",
    privacy: "Linkler analiz için kullanılır, kaydedilmez.",
    invalid: "Lütfen geçerli bir link girin.",
    failed: "Analiz tamamlanamadı. Sunucu uyku modundan çıkıyor olabilir; birkaç saniye sonra tekrar deneyin.",
    result: {
      heading: "Analiz sonucu",
      riskScore: "Risk skoru",
      domain: "Alan adı",
      method: "Yöntem",
      duration: "Süre",
      signals: "Tespit edilen sinyaller",
      noSignals: "Şüpheli bir sinyal tespit edilmedi.",
    },
    verdict: {
      safe: { label: "Güvenli", title: "Bu link güvenli görünüyor", desc: "Bilinen bir risk sinyali bulunmadı. Yine de kişisel bilgi girerken adres çubuğunu kontrol edin." },
      suspicious: { label: "Şüpheli", title: "Bu link şüpheli", desc: "Bazı risk sinyalleri tespit edildi. Kaynağından emin değilseniz açmayın." },
      dangerous: { label: "Tehlikeli", title: "Bu link büyük olasılıkla oltalama", desc: "Linki açmayın ve hiçbir kişisel, kart veya şifre bilgisi girmeyin." },
    },
    engine: {
      reputation: "Alan adı itibarı",
      ml: "Makine öğrenmesi",
      heuristic: "Kural tabanlı",
    },
    stats: [
      ["235K", "Eğitim verisindeki link"],
      ["%93", "Phishing tespitinde kesinlik"],
      ["16", "Analiz edilen alan adı özelliği"],
      ["TR / EN", "İki dilde açıklama"],
    ],
    howTitle: "Nasıl çalışır",
    howSubtitle: "Her link üç katmanlı bir analizden geçer.",
    how: [
      ["Alan adı itibarı", "Link, bilinen güvenilir alan adları ve kısaltma servisleriyle karşılaştırılır. .com.tr gibi uzantılar doğru ayrıştırılır."],
      ["Makine öğrenmesi", "Gradient boosting modeli alan adından çıkarılan 16 özelliği değerlendirir: uzunluk, alt alan adları, entropi, uzantı ve marka taklidi."],
      ["Açıklanabilir sonuç", "Yol ve protokoldeki sinyaller kurallarla puanlanır; her skor, tetikleyen nedenlerle birlikte sunulur."],
    ],
    modelTitle: "Model şeffaflığı",
    modelSubtitle:
      "Model, UCI PhiUSIIL veri setindeki 235 bin gerçek link üzerinde eğitildi ve daha önce görmediği alan adlarında test edildi.",
    metrics: [
      ["Doğruluk", "%85,4"],
      ["Kesinlik (phishing)", "%93,4"],
      ["F1 skoru", "0,778"],
      ["ROC AUC", "0,866"],
    ],
    leakTitle: "Neden %99 değil?",
    leakBody:
      "İlk model %99,6 doğruluk verdi, ancak veri setindeki güvenli linklerin tamamı yolsuz ana sayfalardı; model \"linkte yol var mı\" kısayolunu öğrenmişti. Model yalnızca alan adı özellikleriyle yeniden eğitildi ve aynı alan adının hem eğitim hem test setinde yer alması engellendi. Sonuç daha düşük ama gerçek dünyada güvenilir.",
    disclaimer:
      "Kanca'nın sonuçları bilgilendirme amaçlıdır ve kesin güvenlik garantisi vermez.",
    builtBy: "Geliştiren",
    role: "Bilgisayar Mühendisliği Öğrencisi",
    contact: "İletişim",
    rights: "Açık kaynak proje.",
  },
  en: {
    nav: { how: "How it works", model: "Model", source: "Source code" },
    eyebrow: "Open source · AI-powered",
    title: "See the hook before you bite.",
    subtitle:
      "Kanca analyzes suspicious links from SMS, email and messages with machine learning, and shows a risk score with clear reasons before you click.",
    placeholder: "https://example-site.com/login",
    inputLabel: "Link to analyze",
    scan: "Analyze",
    scanning: "Analyzing",
    examples: "Try an example",
    privacy: "Links are used for analysis only and are not stored.",
    invalid: "Please enter a valid link.",
    failed: "The analysis could not be completed. The server may be waking up; please try again in a few seconds.",
    result: {
      heading: "Analysis result",
      riskScore: "Risk score",
      domain: "Domain",
      method: "Method",
      duration: "Duration",
      signals: "Detected signals",
      noSignals: "No suspicious signals were detected.",
    },
    verdict: {
      safe: { label: "Safe", title: "This link looks safe", desc: "No known risk signals were found. Still, check the address bar before entering personal details." },
      suspicious: { label: "Suspicious", title: "This link is suspicious", desc: "Some risk signals were detected. Don't open it unless you trust the source." },
      dangerous: { label: "Dangerous", title: "This link is likely phishing", desc: "Don't open it, and never enter personal, card or password details." },
    },
    engine: {
      reputation: "Domain reputation",
      ml: "Machine learning",
      heuristic: "Rule-based",
    },
    stats: [
      ["235K", "URLs in training data"],
      ["93%", "Phishing precision"],
      ["16", "Hostname features analyzed"],
      ["TR / EN", "Bilingual explanations"],
    ],
    howTitle: "How it works",
    howSubtitle: "Every link goes through a three-layer analysis.",
    how: [
      ["Domain reputation", "The link is checked against well-known trusted domains and URL shorteners, with multi-part suffixes like .com.tr parsed correctly."],
      ["Machine learning", "A gradient boosting model scores 16 hostname features: length, subdomains, entropy, TLD and brand impersonation."],
      ["Explainable output", "Path and protocol signals are scored by rules, and every score comes with the reasons that triggered it."],
    ],
    modelTitle: "Model transparency",
    modelSubtitle:
      "Trained on 235k real URLs from the UCI PhiUSIIL dataset and evaluated on domains it had never seen.",
    metrics: [
      ["Accuracy", "85.4%"],
      ["Precision (phishing)", "93.4%"],
      ["F1 score", "0.778"],
      ["ROC AUC", "0.866"],
    ],
    leakTitle: "Why not 99%?",
    leakBody:
      "The first model scored 99.6%, but every legitimate URL in the dataset was a bare homepage, so it had learned the shortcut \"has a path means phishing\". It was retrained on hostname-only features, with no domain allowed in both train and test. The score is lower, but it holds up on real-world links.",
    disclaimer: "Kanca results are for information only and are not a security guarantee.",
    builtBy: "Built by",
    role: "Computer Engineering Student",
    contact: "Contact",
    rights: "Open-source project.",
  },
} as const;
