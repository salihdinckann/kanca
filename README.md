# ScanGuard

**AI-powered phishing link scanner.** Paste a suspicious link from an SMS, email or WhatsApp message and get a risk score with plain-language reasons, in Turkish or English.

> 🇹🇷 Yapay zeka destekli oltalama (phishing) link tarayıcı. Şüpheli linki yapıştır, risk skorunu ve nedenlerini Türkçe veya İngilizce gör.

**Live demo:** _coming soon_

## Features

- **Risk score (0–100)** with a verdict: safe, suspicious or dangerous
- **Explainable results:** every score lists the signals that triggered it
- **Bilingual:** Turkish and English UI and explanations
- **Turkey-aware:** detects impersonation of Turkish banks, carriers and e-commerce brands (e.g. fake PTT cargo or Garanti BBVA links)
- **Three-layer analysis:** domain reputation → ML model on the hostname → rule-based path signals

## How it works

```
URL ──► Domain reputation ──known──► safe
            │ unknown
            ▼
     Hostname features ──► Gradient boosting model ──► P(phishing)
            +                                               │
     Path / scheme rules (@, //, brand in path, no HTTPS) ──┴──► risk score + reasons
```

| Layer | What it does |
|---|---|
| Reputation | Allowlist of well-known global and Turkish domains, with multi-part suffix handling (`.com.tr`, `.co.uk`). Open hosting platforms are intentionally excluded. |
| ML model | `HistGradientBoostingClassifier` on 16 lexical hostname features: length, digits, subdomains, entropy, suspicious TLD, brand-in-subdomain, punycode, and more. |
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
| Accuracy | 85.4% |
| F1 (phishing) | 0.778 |
| ROC AUC | 0.866 |
| Precision (phishing) | 0.93 |

The score is lower, but the model now behaves correctly on real-world links.

## Tech stack

- **Backend:** Python, FastAPI, scikit-learn, pandas
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

Retrain the model: download the PhiUSIIL CSV into `ml/data/`, then run `python ml/train.py`.

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
  "engine": "ml"
}
```

## Roadmap

- [ ] Domain age (WHOIS) and SSL certificate checks
- [ ] VirusTotal and Google Safe Browsing lookups
- [ ] LLM-generated explanations for SMS and email text
- [ ] Browser extension

## Author

**Salih Dinçkan**, Computer Engineering student

[GitHub](https://github.com/salihdinckann) · [LinkedIn](https://www.linkedin.com/in/salih-dinckan/) · salih.dinckan@std.hku.edu.tr
