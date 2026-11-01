"""Measure the model's subdomain bias.

Reports, for the current backend/model.joblib, how often the model alone scores
>= 0.4 ("suspicious" or worse) on:
  - held-out legit hosts, as-is and with a realistic subdomain prepended
  - held-out phishing hosts (all, and those that use subdomains)
  - a hand-picked list of real legitimate subdomain hosts

Usage (from the kanca/ folder):
    backend/.venv/Scripts/python ml/subdomain_benchmark.py
"""

import random
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
from app.features import HOST_FEATURE_NAMES, host_feature_vector, host_of, split_host  # noqa: E402

DATA = ROOT / "ml" / "data" / "PhiUSIIL_Phishing_URL_Dataset.csv"
THRESHOLD = 0.4

# Real legitimate sites that live on a subdomain (checked by hand).
REAL_LEGIT_SUBDOMAINS = [
    "docs.python.org", "sqlmodel.tiangolo.com", "fastapi.tiangolo.com", "blog.cloudflare.com",
    "developer.mozilla.org", "tr.wikipedia.org", "en.wikipedia.org", "news.ycombinator.com",
    "docs.github.com", "support.apple.com", "aws.amazon.com", "engineering.fb.com",
    "docs.djangoproject.com", "pandas.pydata.org", "obs.hku.edu.tr", "kampus.odtu.edu.tr",
    "blog.jetbrains.com", "code.visualstudio.com", "docs.docker.com", "kubernetes.io",
    "learn.microsoft.com", "status.openai.com", "careers.google.com", "shop.lego.com",
    "help.netflix.com", "store.steampowered.com", "mail.proton.me", "music.youtube.com",
    "research.google", "huggingface.co",
]

# Subdomain labels for the synthetic test: common ones plus product-like words.
TEST_SUBDOMAINS = ["docs", "blog", "shop", "api", "mail", "app", "support", "help", "news",
                   "m", "en", "store", "dev", "careers", "status", "studio", "cloud", "labs"]


def held_out():
    df = pd.read_csv(DATA, usecols=["URL", "label"], encoding_errors="replace").dropna()
    df["host"] = df["URL"].map(host_of)
    df = df.drop_duplicates(subset="host").reset_index(drop=True)
    y = 1 - df["label"].astype(int)
    _, test_df, _, y_test = train_test_split(df, y, test_size=0.2, stratify=y, random_state=42)
    return test_df["host"][y_test == 0].tolist(), test_df["host"][y_test == 1].tolist()


def flagged(model, hosts):
    X = pd.DataFrame([host_feature_vector(h) for h in hosts], columns=HOST_FEATURE_NAMES)
    return model.predict_proba(X)[:, 1] >= THRESHOLD


def main():
    model = joblib.load(ROOT / "backend" / "model.joblib")
    legit, phish = held_out()
    rng = random.Random(7)
    legit_sub = [f"{rng.choice(TEST_SUBDOMAINS)}.{h}" for h in legit]
    phish_sub = [h for h in phish if split_host(h)[0]]

    rows = [
        ("Legit, no subdomain (false alarms)", legit),
        ("Legit + subdomain (false alarms)", legit_sub),
        ("Real legit subdomain sites (false alarms)", REAL_LEGIT_SUBDOMAINS),
        ("Phishing, all (caught)", phish),
        ("Phishing with subdomain (caught)", phish_sub),
    ]
    for name, hosts in rows:
        print(f"{name:44s} n={len(hosts):6d}  flagged: {flagged(model, hosts).mean() * 100:5.1f}%")

    hits = [h for h, f in zip(REAL_LEGIT_SUBDOMAINS, flagged(model, REAL_LEGIT_SUBDOMAINS)) if f]
    print("Real legit sites still flagged:", ", ".join(hits) or "none")


if __name__ == "__main__":
    main()
