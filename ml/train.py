"""Train the ScanGuard phishing URL classifier.

Dataset: PhiUSIIL Phishing URL Dataset (UCI ML Repository, id 967).
In the CSV, label 1 = legitimate and 0 = phishing; we flip it so 1 = phishing.

Every legitimate URL in this dataset is a bare "https://www.<domain>" homepage,
so a model trained on full URLs learns "has a path => phishing" (99.6% test
accuracy, but flags github.com/... and youtube.com/watch as phishing). We
therefore train on hostname-only features, deduplicated by hostname.

Usage (from the scanguard/ folder):
    backend/.venv/Scripts/python ml/train.py
"""

import json
import sys
import time
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import accuracy_score, classification_report, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
from app.features import HOST_FEATURE_NAMES as FEATURE_NAMES  # noqa: E402
from app.features import host_feature_vector as feature_vector  # noqa: E402
from app.features import host_of  # noqa: E402

DATA = ROOT / "ml" / "data" / "PhiUSIIL_Phishing_URL_Dataset.csv"
MODEL_OUT = ROOT / "backend" / "model.joblib"
METRICS_OUT = ROOT / "ml" / "metrics.json"


def main():
    df = pd.read_csv(DATA, usecols=["URL", "label"], encoding_errors="replace")
    df = df.dropna()
    # One row per hostname, so the same domain can't land in both train and test.
    df["host"] = df["URL"].map(host_of)
    df = df.drop_duplicates(subset="host").reset_index(drop=True)
    y = 1 - df["label"].astype(int)  # 1 = phishing

    t0 = time.time()
    X = pd.DataFrame([feature_vector(u) for u in df["host"]], columns=FEATURE_NAMES)
    print(f"{len(X)} URL, özellik çıkarımı {time.time() - t0:.1f} sn")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    model = HistGradientBoostingClassifier(max_iter=300, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    metrics = {
        "accuracy": round(accuracy_score(y_test, pred), 4),
        "f1": round(f1_score(y_test, pred), 4),
        "roc_auc": round(roc_auc_score(y_test, proba), 4),
        "train_size": len(X_train),
        "test_size": len(X_test),
    }
    print(classification_report(y_test, pred, target_names=["güvenli", "phishing"], digits=4))

    sample = X_test.sample(5000, random_state=42)
    imp = permutation_importance(model, sample, y_test.loc[sample.index], n_repeats=3, random_state=42)
    ranked = sorted(zip(FEATURE_NAMES, imp.importances_mean), key=lambda t: -t[1])
    metrics["feature_importance"] = {name: round(v, 4) for name, v in ranked}

    print(json.dumps({k: v for k, v in metrics.items() if k != "feature_importance"}, indent=2))
    print("En etkili özellikler:", [n for n, _ in ranked[:8]])

    joblib.dump(model, MODEL_OUT)
    METRICS_OUT.write_text(json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Model kaydedildi: {MODEL_OUT}")


if __name__ == "__main__":
    main()
