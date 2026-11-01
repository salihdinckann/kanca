"""Train the Kanca phishing URL classifier.

Dataset: PhiUSIIL Phishing URL Dataset (UCI ML Repository, id 967).
In the CSV, label 1 = legitimate and 0 = phishing; we flip it so 1 = phishing.

Every legitimate URL in this dataset is a bare "https://www.<domain>" homepage,
so a model trained on full URLs learns "has a path => phishing" (99.6% test
accuracy, but flags github.com/... and youtube.com/watch as phishing). We
therefore train on hostname-only features, deduplicated by hostname.

The same bias exists for subdomains: no legitimate host in the data has one,
so the hostname model learned "has a subdomain => phishing" (82% false alarms
on legit hosts with docs./blog. prepended). We augment the *training* split
with legitimate hosts that carry realistic subdomains; the test split is left
untouched. See ml/subdomain_benchmark.py for the before/after measurement.

Usage (from the kanca/ folder):
    backend/.venv/Scripts/python ml/train.py
"""

import json
import os
import random
import re
import sys
import time
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    accuracy_score, classification_report, f1_score, precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
from app.features import COMMON_SUBDOMAINS, host_of  # noqa: E402
from app.features import HOST_FEATURE_NAMES as FEATURE_NAMES  # noqa: E402
from app.features import host_feature_vector as feature_vector  # noqa: E402

DATA = ROOT / "ml" / "data" / "PhiUSIIL_Phishing_URL_Dataset.csv"
MODEL_OUT = ROOT / "backend" / "model.joblib"
METRICS_OUT = ROOT / "ml" / "metrics.json"

AUG_FRACTION = float(os.getenv("AUG_FRACTION", "0.2"))  # share of legit training hosts that get a subdomain copy
WORD_SHARE = float(os.getenv("WORD_SHARE", "0.0"))  # of those, share using a borrowed word label
SEED = 42


def augment_legit(hosts: list[str], rng: random.Random) -> list[str]:
    """Copies of legit hosts with a realistic subdomain prepended.

    Half use common labels (docs., blog., api. ...); half borrow a word-like
    label from another legit host, mimicking product subdomains such as
    sqlmodel.tiangolo.com.
    """
    common = sorted(COMMON_SUBDOMAINS)
    words = [w for w in (h.split(".")[0] for h in hosts) if re.fullmatch(r"[a-z]{3,14}", w)]
    picked = rng.sample(hosts, int(len(hosts) * AUG_FRACTION))
    return [f"{rng.choice(words) if rng.random() < WORD_SHARE else rng.choice(common)}.{h}" for h in picked]


def main():
    df = pd.read_csv(DATA, usecols=["URL", "label"], encoding_errors="replace")
    df = df.dropna()
    # One row per hostname, so the same domain can't land in both train and test.
    df["host"] = df["URL"].map(host_of)
    df = df.drop_duplicates(subset="host").reset_index(drop=True)
    y = 1 - df["label"].astype(int)  # 1 = phishing

    train_df, test_df, y_train, y_test = train_test_split(
        df, y, test_size=0.2, stratify=y, random_state=SEED
    )

    legit_train = train_df["host"][y_train == 0].tolist()
    extra = augment_legit(legit_train, random.Random(SEED))
    train_hosts = train_df["host"].tolist() + extra
    y_train = pd.concat([y_train, pd.Series([0] * len(extra))], ignore_index=True)
    print(f"Eğitim: {len(train_df)} alan adı + {len(extra)} artırılmış güvenli örnek; test: {len(test_df)}")

    t0 = time.time()
    X_train = pd.DataFrame([feature_vector(h) for h in train_hosts], columns=FEATURE_NAMES)
    X_test = pd.DataFrame([feature_vector(h) for h in test_df["host"]], columns=FEATURE_NAMES)
    y_test = y_test.reset_index(drop=True)
    print(f"Özellik çıkarımı {time.time() - t0:.1f} sn")

    model = HistGradientBoostingClassifier(max_iter=300, learning_rate=0.1, random_state=SEED)
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    metrics = {
        "accuracy": round(accuracy_score(y_test, pred), 4),
        "precision": round(precision_score(y_test, pred), 4),
        "recall": round(recall_score(y_test, pred), 4),
        "f1": round(f1_score(y_test, pred), 4),
        "roc_auc": round(roc_auc_score(y_test, proba), 4),
        "train_size": len(X_train),
        "augmented": len(extra),
        "test_size": len(X_test),
    }
    print(classification_report(y_test, pred, target_names=["güvenli", "phishing"], digits=4))

    sample = X_test.sample(5000, random_state=SEED)
    imp = permutation_importance(model, sample, y_test.loc[sample.index], n_repeats=3, random_state=SEED)
    ranked = sorted(zip(FEATURE_NAMES, imp.importances_mean), key=lambda t: -t[1])
    metrics["feature_importance"] = {name: round(v, 4) for name, v in ranked}

    print(json.dumps({k: v for k, v in metrics.items() if k != "feature_importance"}, indent=2))
    print("En etkili özellikler:", [n for n, _ in ranked[:8]])

    joblib.dump(model, MODEL_OUT)
    METRICS_OUT.write_text(json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Model kaydedildi: {MODEL_OUT}")


if __name__ == "__main__":
    main()
