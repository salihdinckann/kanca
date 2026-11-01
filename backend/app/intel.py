"""External threat intelligence: domain age (RDAP) and Google Safe Browsing.

Both lookups are best-effort: on timeout or error they return None and the
scan continues with the local model and rules.
"""

import os
import time
from datetime import datetime, timezone

import httpx

RDAP_URL = "https://rdap.org/domain/{domain}"
SAFE_BROWSING_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
TIMEOUT = httpx.Timeout(4.0, connect=3.0)

_AGE_TTL = 24 * 3600
_AGE_CACHE_MAX = 5000
_age_cache: dict[str, tuple[float, int | None]] = {}


def safe_browsing_enabled() -> bool:
    return bool(os.getenv("SAFE_BROWSING_API_KEY"))


def _parse_registration(data: dict) -> datetime | None:
    for event in data.get("events", []):
        if event.get("eventAction") == "registration" and event.get("eventDate"):
            return datetime.fromisoformat(event["eventDate"].replace("Z", "+00:00"))
    return None


async def domain_age_days(client: httpx.AsyncClient, domain: str) -> int | None:
    """Days since the domain was registered, via RDAP (cached for a day)."""
    now = time.time()
    hit = _age_cache.get(domain)
    if hit and now - hit[0] < _AGE_TTL:
        return hit[1]

    days = None
    try:
        res = await client.get(RDAP_URL.format(domain=domain), timeout=TIMEOUT, follow_redirects=True)
        if res.status_code == 200:
            registered = _parse_registration(res.json())
            if registered:
                days = max((datetime.now(timezone.utc) - registered).days, 0)
    except (httpx.HTTPError, ValueError):
        return None  # don't cache transient failures

    if len(_age_cache) >= _AGE_CACHE_MAX:
        _age_cache.clear()
    _age_cache[domain] = (now, days)
    return days


async def safe_browsing_match(client: httpx.AsyncClient, url: str) -> bool | None:
    """True if Google Safe Browsing lists the URL; None if disabled or unreachable."""
    key = os.getenv("SAFE_BROWSING_API_KEY")
    if not key:
        return None
    body = {
        "client": {"clientId": "kanca", "clientVersion": "1.1"},
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}],
        },
    }
    try:
        res = await client.post(SAFE_BROWSING_URL, params={"key": key}, json=body, timeout=TIMEOUT)
        if res.status_code != 200:
            return None
        return bool(res.json().get("matches"))
    except (httpx.HTTPError, ValueError):
        return None
