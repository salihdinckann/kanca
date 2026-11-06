"""Kanca API."""

import asyncio
import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import httpx
import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .features import (
    BRANDS, HOST_FEATURE_NAMES, SUSPICIOUS_WORDS, explain, extract_features, host_feature_vector, host_of,
    reason, split_host,
)
from .intel import domain_age_days, safe_browsing_enabled, safe_browsing_match
from .reputation import KNOWN_HOSTS, is_hosting_platform, is_known, is_popular, official_domain
from .textscan import extract_links

MODEL_PATH = Path(__file__).resolve().parent.parent / "model.joblib"

http: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global http
    http = httpx.AsyncClient(headers={"User-Agent": "Kanca/1.1 (+https://kanca.salihdinckan.com)"})
    yield
    await http.aclose()


app = FastAPI(title="Kanca API", version="1.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    # Comma-separated list in production, e.g. "https://kanca.salihdinckan.com"
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None

Lang = Literal["tr", "en"]


class UrlScanRequest(BaseModel):
    url: str = Field(..., min_length=3, max_length=2048)
    lang: Lang = "tr"


class TextScanRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=5000)
    lang: Lang = "tr"


class UrlScanResponse(BaseModel):
    url: str
    risk_score: int  # 0-100
    verdict: Literal["safe", "suspicious", "dangerous"]
    reasons: list[str]
    engine: str  # "reputation", "ml", "heuristic" or "safe_browsing"
    domain_age_days: int | None = None
    safe_browsing: Literal["clean", "match", "skipped"] = "skipped"


class TextScanResponse(BaseModel):
    links: list[UrlScanResponse]


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


ESTABLISHED_DAYS = 730


def _model_prob(host: str) -> float:
    X = pd.DataFrame([host_feature_vector(host)], columns=HOST_FEATURE_NAMES)
    return float(model.predict_proba(X)[0][1])


def _clean_subdomain(sub: str) -> bool:
    """Plain word labels like "sqlmodel" or "docs.en": no digits, hyphens, brands or bait words."""
    labels = sub.split(".")
    return (
        len(labels) <= 2
        and all(re.fullmatch(r"[a-z]{2,20}", l) for l in labels)
        and not any(b in sub for b in BRANDS)
        and not any(w in sub for w in SUSPICIOUS_WORDS)
    )


def _age_adjustment(days: int | None, lang: str) -> tuple[float, str | None]:
    """Score change and reason for the domain's registration age."""
    if days is None:
        return 0.0, None
    if days < 30:
        return 0.35, reason("new_domain", lang, days=days)
    if days < 180:
        return 0.15, reason("young_domain", lang, months=max(days // 30, 1))
    if days >= 730:
        return -0.15, reason("old_domain", lang, years=days // 365)
    return 0.0, None


def _verdict(score: int) -> str:
    if score >= 70:
        return "dangerous"
    if score >= 40:
        return "suspicious"
    return "safe"


async def analyze(url: str, lang: str) -> UrlScanResponse:
    feats = extract_features(url)
    host = host_of(url)
    _, registered = split_host(host)
    official = official_domain(host)
    trusted = is_known(host, registered) or official is not None
    popular = not trusted and is_popular(registered)
    hosted = is_hosting_platform(registered)

    # Network lookups run concurrently. Reputation-listed sites skip RDAP, and so
    # do hosting platforms: vercel.app's age says nothing about the site on it.
    sb_task = safe_browsing_match(http, url)
    skip_age = trusted or popular or hosted or feats["has_ip"] or "." not in registered
    age_task = asyncio.sleep(0, None) if skip_age else domain_age_days(http, registered)
    sb, age = await asyncio.gather(sb_task, age_task)
    sb_state = "skipped" if sb is None else ("match" if sb else "clean")

    if sb:
        return UrlScanResponse(
            url=url, risk_score=100, verdict="dangerous", engine="safe_browsing",
            reasons=[reason("safe_browsing", lang)] + explain(feats, lang),
            domain_age_days=age, safe_browsing=sb_state,
        )

    if trusted or popular:
        if official and not is_known(host, registered):
            key, domain = "official", official
        else:
            key, domain = ("known" if trusted else "popular"), (host if host in KNOWN_HOSTS else registered)
        return UrlScanResponse(
            url=url, risk_score=2, verdict="safe", engine="reputation",
            reasons=[reason(key, lang, domain=domain)],
            safe_browsing=sb_state,
        )

    if model is not None:
        model_p = _model_prob(url)
        sub, _ = split_host(host)
        if sub and age is not None and age >= ESTABLISHED_DAYS and _clean_subdomain(sub):
            # A plain-word subdomain of a domain registered for years (sqlmodel.tiangolo.com):
            # judge the parent domain. The training data has no legit subdomains at all,
            # so the model over-penalizes product subdomains like this one.
            model_p = min(model_p, _model_prob(registered))
        prob = model_p + _path_boost(feats)
        engine = "ml"
    else:
        prob = _heuristic_score(feats)
        engine = "heuristic"

    age_delta, age_reason = _age_adjustment(age, lang)
    prob = min(max(prob + age_delta, 0.0), 1.0)
    score = round(prob * 100)

    reasons = explain(feats, lang)
    if age_reason and age_delta > 0:
        reasons.insert(0, age_reason)
    if not reasons and score >= 40:
        # Only the model is suspicious and no concrete signal backs it up:
        # never call it "dangerous" without a reason we can show.
        score = min(score, 65)
        reasons.append(reason("model", lang))
    if age_reason and age_delta < 0:
        reasons.append(age_reason)
    if hosted:
        reasons.insert(0, reason("hosting", lang, domain=registered))

    return UrlScanResponse(
        url=url, risk_score=score, verdict=_verdict(score), reasons=reasons, engine=engine,
        domain_age_days=age, safe_browsing=sb_state,
    )


@app.get("/api/health")
def health():
    return {"status": "ok", "model_loaded": model is not None, "safe_browsing": safe_browsing_enabled()}


@app.post("/api/scan/url", response_model=UrlScanResponse)
async def scan_url(req: UrlScanRequest):
    return await analyze(req.url, req.lang)


@app.post("/api/scan/text", response_model=TextScanResponse)
async def scan_text(req: TextScanRequest):
    links = extract_links(req.text)
    results = await asyncio.gather(*(analyze(link, req.lang) for link in links))
    return TextScanResponse(links=list(results))
