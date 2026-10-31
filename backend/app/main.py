"""ScanGuard API."""

import os
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .features import (
    HOST_FEATURE_NAMES, explain, extract_features, host_feature_vector, host_of, reason, split_host,
)
from .reputation import is_known

MODEL_PATH = Path(__file__).resolve().parent.parent / "model.joblib"

app = FastAPI(title="ScanGuard API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    # Comma-separated list in production, e.g. "https://scanguard.vercel.app"
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None


class UrlScanRequest(BaseModel):
    url: str = Field(..., min_length=3, max_length=2048)
    lang: Literal["tr", "en"] = "tr"


class UrlScanResponse(BaseModel):
    url: str
    risk_score: int  # 0-100
    verdict: Literal["safe", "suspicious", "dangerous"]
    reasons: list[str]
    engine: str  # "reputation", "ml" or "heuristic"


def _heuristic_score(feats: dict) -> float:
    """Fallback used until a trained model is available."""
    weights = {
        "has_ip": 0.35, "has_at": 0.25, "has_punycode": 0.3,
        "brand_in_subdomain_or_path": 0.35, "suspicious_tld": 0.2,
        "is_shortener": 0.15, "has_double_slash_redirect": 0.15,
    }
    score = sum(w for k, w in weights.items() if feats[k])
    score += min(feats["suspicious_word_count"], 3) * 0.1
    score += 0.1 if feats["num_subdomains"] >= 3 else 0
    score += 0.1 if not feats["has_https"] else 0
    return min(score, 1.0)


def _path_boost(feats: dict) -> float:
    """Signals outside the hostname, which the host-only model never sees."""
    boost = 0.0
    boost += 0.25 if feats["has_at"] else 0
    boost += 0.15 if feats["has_double_slash_redirect"] else 0
    boost += 0.15 if feats["brand_in_subdomain_or_path"] else 0
    boost += min(feats["suspicious_word_count"], 2) * 0.1
    boost += 0.1 if not feats["has_https"] else 0
    return boost


def _verdict(score: int) -> str:
    if score >= 70:
        return "dangerous"
    if score >= 40:
        return "suspicious"
    return "safe"


@app.get("/api/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/api/scan/url", response_model=UrlScanResponse)
def scan_url(req: UrlScanRequest):
    feats = extract_features(req.url)
    _, registered = split_host(host_of(req.url))
    if is_known(registered):
        return UrlScanResponse(
            url=req.url,
            risk_score=2,
            verdict="safe",
            reasons=[reason("known", req.lang, domain=registered)],
            engine="reputation",
        )

    if model is not None:
        X = pd.DataFrame([host_feature_vector(req.url)], columns=HOST_FEATURE_NAMES)
        prob = min(float(model.predict_proba(X)[0][1]) + _path_boost(feats), 1.0)
        engine = "ml"
    else:
        prob = _heuristic_score(feats)
        engine = "heuristic"

    score = round(prob * 100)
    return UrlScanResponse(
        url=req.url,
        risk_score=score,
        verdict=_verdict(score),
        reasons=explain(feats, req.lang),
        engine=engine,
    )
