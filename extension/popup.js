const API_URL = "https://api.salihdinckan.com";
const SLOW_AFTER_MS = 4000;
const REQUEST_TIMEOUT_MS = 90_000;

const STRINGS = {
  tr: {
    placeholder: "Bir link yapıştır",
    scan: "Tara",
    scanning: "Taranıyor…",
    slow: "Sunucu uyanıyor, ilk tarama 1 dakika kadar sürebilir…",
    error: "Tarama yapılamadı. İnternet bağlantını kontrol edip tekrar dene.",
    notWeb: "Bu sayfa taranamaz. Taramak istediğin linki yukarı yapıştır.",
    domain: "Alan adı",
    method: "Yöntem",
    signals: "Bulgular",
    noSignals: "Şüpheli bir bulgu yok.",
    site: "Ayrıntılı analiz: kanca.salihdinckan.com →",
    verdict: {
      safe: { label: "Güvenli", title: "Temiz görünüyor.", desc: "Bilinen bir risk sinyali yok. Yine de bilgi girmeden önce adres çubuğuna bir göz at." },
      suspicious: { label: "Şüpheli", title: "Bir şeyler tuhaf.", desc: "Bazı risk sinyalleri var. Kaynağından emin değilsen açma." },
      dangerous: { label: "Tehlikeli", title: "Bu bir kanca.", desc: "Büyük olasılıkla oltalama. Açma; kart, şifre veya kişisel bilgi girme." },
    },
    engine: { reputation: "Alan adı itibarı", ml: "Makine öğrenmesi", heuristic: "Kural tabanlı", safe_browsing: "Google Safe Browsing" },
  },
  en: {
    placeholder: "Paste a link",
    scan: "Scan",
    scanning: "Scanning…",
    slow: "Waking the server, the first scan can take about a minute…",
    error: "Couldn't scan. Check your connection and try again.",
    notWeb: "This page can't be scanned. Paste the link you want to check above.",
    domain: "Domain",
    method: "Method",
    signals: "Findings",
    noSignals: "Nothing suspicious found.",
    site: "Full analysis: kanca.salihdinckan.com →",
    verdict: {
      safe: { label: "Safe", title: "Looks clean.", desc: "No known risk signals. Still, glance at the address bar before entering any details." },
      suspicious: { label: "Suspicious", title: "Something's off.", desc: "Some risk signals were found. Don't open it unless you trust the source." },
      dangerous: { label: "Dangerous", title: "This is a hook.", desc: "Very likely phishing. Don't open it, and never enter card, password or personal details." },
    },
    engine: { reputation: "Domain reputation", ml: "Machine learning", heuristic: "Rule-based", safe_browsing: "Google Safe Browsing" },
  },
};

const $ = (id) => document.getElementById(id);
let lang = navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en";
let lastResult = null;

function applyLang() {
  const t = STRINGS[lang];
  document.documentElement.lang = lang;
  $("url").placeholder = t.placeholder;
  $("scan").textContent = t.scan;
  $("site").textContent = t.site;
  $("domainLabel").textContent = t.domain;
  $("methodLabel").textContent = t.method;
  $("signalsLabel").textContent = t.signals;
  for (const b of document.querySelectorAll(".lang button")) {
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
  }
}

function showStatus(text, isError = false) {
  const el = $("status");
  el.textContent = text;
  el.classList.toggle("error", isError);
  el.hidden = !text;
}

function hostOf(url) {
  try {
    return new URL(/^[a-z]+:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function render(r) {
  const t = STRINGS[lang];
  const v = t.verdict[r.verdict];
  $("score").textContent = r.risk_score;
  $("score").className = `num ${r.verdict}`;
  $("label").textContent = v.label;
  $("label").className = `label ${r.verdict}`;
  $("title").textContent = v.title;
  $("desc").textContent = v.desc;
  $("bar").className = `bg-${r.verdict}`;
  $("bar").style.width = "0";
  requestAnimationFrame(() => ($("bar").style.width = `${Math.max(r.risk_score, 3)}%`));
  $("domain").textContent = hostOf(r.url);
  $("domain").title = r.url;
  $("method").textContent = t.engine[r.engine] ?? r.engine;

  const list = $("reasons");
  list.replaceChildren(
    ...(r.reasons.length ? r.reasons : [t.noSignals]).map((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      return li;
    }),
  );
  $("result").hidden = false;
}

async function scan(url) {
  const t = STRINGS[lang];
  url = url.trim();
  if (url.length < 3) return;
  $("scan").disabled = true;
  $("scan").textContent = t.scanning;
  showStatus("");
  const slow = setTimeout(() => showStatus(STRINGS[lang].slow), SLOW_AFTER_MS);
  try {
    const res = await fetch(`${API_URL}/api/scan/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, lang }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    lastResult = await res.json();
    showStatus("");
    render(lastResult);
  } catch {
    $("result").hidden = true;
    showStatus(STRINGS[lang].error, true);
  } finally {
    clearTimeout(slow);
    $("scan").disabled = false;
    $("scan").textContent = STRINGS[lang].scan;
  }
}

async function currentTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url ?? "";
}

async function init() {
  try {
    const saved = (await chrome.storage.local.get("lang")).lang;
    if (saved === "tr" || saved === "en") lang = saved;
  } catch {
    // storage is a convenience; the detected language is fine without it
  }
  applyLang();

  for (const b of document.querySelectorAll(".lang button")) {
    b.addEventListener("click", () => {
      lang = b.dataset.lang;
      chrome.storage.local.set({ lang });
      applyLang();
      // Reasons come from the API in the requested language, so scan again.
      if (lastResult) scan(lastResult.url);
    });
  }

  $("form").addEventListener("submit", (e) => {
    e.preventDefault();
    scan($("url").value);
  });

  // From the context menu the link arrives as ?url= (a selected link may have no
  // scheme, which the API accepts); otherwise use the open tab.
  const fromMenu = new URLSearchParams(location.search).get("url");
  if (fromMenu) document.body.classList.add("window");
  const target = fromMenu ?? (await currentTabUrl());

  if (fromMenu || /^https?:\/\//i.test(target)) {
    $("url").value = target;
    scan(target);
  } else {
    showStatus(STRINGS[lang].notWeb);
    $("url").focus();
  }
}

init();
