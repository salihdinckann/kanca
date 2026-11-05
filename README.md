<p align="center"><img src="frontend/app/icon.svg" width="72" alt="Kanca logo"></p>

<h1 align="center">Kanca</h1>
<p align="center"><b>See the hook before you bite.</b> · <i>Kancayı yemeden önce gör.</i></p>
<p align="center"><a href="https://github.com/salihdinckann/kanca/actions/workflows/ci.yml"><img src="https://github.com/salihdinckann/kanca/actions/workflows/ci.yml/badge.svg" alt="CI"></a></p>

**AI-powered phishing link scanner.** Paste a suspicious link from an SMS, email or WhatsApp message and get a risk score with plain-language reasons, in Turkish or English.

*Kanca* is Turkish for "hook": phishing is *oltalama* ("fishing with a rod") in Turkish.

> 🇹🇷 Yapay zeka destekli oltalama (phishing) link tarayıcı. Şüpheli linki yapıştır, risk skorunu ve nedenlerini Türkçe veya İngilizce gör.

**Live demo:** [kanca.salihdinckan.com](https://kanca.salihdinckan.com)

## Features

- **Risk score (0–100)** with a verdict: safe, suspicious or dangerous
- **Explainable results:** every score lists the signals that triggered it
- **Bilingual:** Turkish and English UI and explanations
- **Turkey-aware:** detects impersonation of Turkish banks, carriers and e-commerce brands (e.g. fake PTT cargo or Garanti BBVA links)
- **Paste a whole message:** links are extracted from SMS, WhatsApp or email text and checked one by one
- **Threat intelligence:** Google Safe Browsing lookup and domain age from RDAP ("registered 4 days ago")
- **Four-layer analysis:** reputation and threat lists → ML model on the hostname → domain age → rule-based path signals

## How it works

```
Message ──► link extraction ──► URL(s)
URL ──► Google Safe Browsing ──listed──► dangerous
    ──► Reputation (allowlist + Tranco top 10k) ──known──► safe
            │ unknown
            ▼
     Hostname features ──► Gradient boosting model ──► P(phishing)
            +  domain age (RDAP): < 30 days ↑, > 2 years ↓
            +  path / scheme rules (@, //, brand in path, no HTTPS)
            ▼
     risk score + reasons   (no concrete reason → capped at "suspicious")
```

| Layer | What it does |
|---|---|
| Threat list | Google Safe Browsing v4 lookup (optional, enabled with `SAFE_BROWSING_API_KEY`). |
| Reputation | Hand-picked global and Turkish domains plus the [Tranco](https://tranco-list.eu/) top 10k, with multi-part suffix handling (`.com.tr`, `.co.uk`). Hosting platforms, file storage and URL shorteners are removed, since phishing kits live there too. |
| ML model | `HistGradientBoostingClassifier` on 19 lexical hostname features: length, digits, subdomain structure, entropy, suspicious TLD, brand-in-subdomain, punycode, and more. |
| Domain age | Registration date from RDAP, cached for a day. Brand-new domains raise the score; long-established ones lower it. |
| Rules | Signals outside the hostname that the model never sees, such as `@` tricks, embedded redirects and phishing keywords in the path. |

## The interesting part: catching a data leak

The model was trained on the [PhiUSIIL Phishing URL Dataset](https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset) (235k URLs, UCI).

The first model trained on full URLs scored **99.6% accuracy**, but it flagged `github.com/...` and `youtube.com/watch?v=...` as phishing. Looking at the data showed why:

| | HTTPS | Has a path | Starts with `www.` |
|---|---|---|---|
| Legitimate URLs | 100% | **0%** | 100% |
| Phishing URLs | 49% | 28% | 41% |

Every legitimate URL in the dataset is a bare `https://www.<domain>` homepage, so the model had learned "has a path → phishing" rather than what phishing looks like.

**Fix:**
1. Train on **hostname-only** features, with scheme, `www.` and path stripped, so that shortcut no longer exists.
2. **Deduplicate by hostname**, so the same domain can't appear in both train and test.
3. Score path-level signals with explicit rules, and add a reputation layer for well-known domains.

The honest result on a held-out test set:

| Metric | Value |
|---|---|
| Accuracy | 85.2% |
| Precision (phishing) | 93.7% |
| Recall (phishing) | 66.1% |
| F1 (phishing) | 0.775 |
| ROC AUC | 0.862 |

The score is lower, but the model now behaves correctly on real-world links.

## The same bias, again: subdomains

After launch, Kanca flagged its own `kanca-inky.vercel.app` and sites like `docs.python.org`. No legitimate host in PhiUSIIL has a subdomain, so the hostname model learned "has a subdomain → phishing". `ml/subdomain_benchmark.py` measures it (model alone, threshold 0.4):

| | Before | After |
|---|---|---|
| False alarms, held-out legit hosts + `docs.`/`blog.`… | 81.8% | **6.1%** |
| False alarms, 30 real legit subdomain sites | 86.7% | **16.7%** |
| Phishing caught, all held-out | 68.8% | 68.1% |
| Phishing caught, those with subdomains | 96.6% | 95.3% |

**Fix:**
1. **Data augmentation:** 20% of legitimate *training* hosts get a copy with a common subdomain (`docs.`, `blog.`, `api.` …). The test split is untouched.
2. **Three new features:** whether the subdomain is a common one, its length, and its digits/hyphens.
3. **Established parent rule:** a plain-word subdomain (`sqlmodel.`) of a domain registered for 2+ years is judged by its parent domain. Attackers rarely own years-old domains.

Augmenting with product-like random words was also tried: it cut false alarms further but lost up to 7 points of phishing detection, so the rule above handles those cases instead.

## Tech stack

- **Backend:** Python, FastAPI, scikit-learn, pandas, httpx (async RDAP / Safe Browsing)
- **Tests:** pytest (30 tests, network lookups faked), GitHub Actions CI
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Deploy:** Render (API) and Vercel (web)

## Run locally

```bash
# API
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Web (in a second terminal)
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

Run the tests: `pip install -r requirements-dev.txt && pytest` (inside `backend/`).

Retrain the model: download the PhiUSIIL CSV into `ml/data/`, then run `python ml/train.py`. Rebuild the popularity list with `python ml/build_tranco.py top-1m.csv <list-id>`.

Optional: set `SAFE_BROWSING_API_KEY` to enable Google Safe Browsing lookups.

### API

```http
POST /api/scan/url
{ "url": "https://ptt-kargo-teslimat.click/odeme", "lang": "en" }
```

```json
{
  "risk_score": 100,
  "verdict": "dangerous",
  "reasons": ["The domain extension (TLD) is commonly abused in scams.", "..."],
  "engine": "ml",
  "domain_age_days": null,
  "safe_browsing": "clean"
}
```

```http
POST /api/scan/text
{ "text": "Kargonuz bekliyor. Odeme: ptt-kargo-teslimat.click/odeme", "lang": "tr" }
→ { "links": [ { ...same shape as above... } ] }
```

## Roadmap

- [x] Domain age (RDAP)
- [x] Google Safe Browsing lookup
- [x] Link extraction from SMS / email text
- [x] Tranco top-10k reputation
- [x] Tests and CI
- [ ] SSL certificate checks
- [ ] LLM-generated explanations for SMS and email text
- [ ] Browser extension

## Author

**Salih Dinçkan**, Computer Engineering student

[GitHub](https://github.com/salihdinckann) · [LinkedIn](https://www.linkedin.com/in/salih-dinckan/) · salih.dinckan@std.hku.edu.tr
