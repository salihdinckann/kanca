"""Lexical feature extraction for phishing URL detection.

All features are computed from the URL string alone (no network calls),
so the same code is used both for training the model and for live scans.
"""

import ipaddress
import math
import re
from collections import Counter
from urllib.parse import urlparse

SUSPICIOUS_WORDS = [
    "login", "signin", "verify", "account", "update", "secure", "bank",
    "confirm", "password", "wallet", "billing", "support", "suspend",
    "giris", "dogrula", "hesap", "sifre", "kargo", "odeme", "iade",
]

BRANDS = [
    "paypal", "apple", "google", "microsoft", "amazon", "netflix", "facebook",
    "instagram", "whatsapp", "garanti", "akbank", "ziraat", "isbank",
    "yapikredi", "turkcell", "vodafone", "edevlet", "trendyol", "hepsiburada",
]

SUSPICIOUS_TLDS = {
    "zip", "mov", "xyz", "top", "click", "link", "work", "support", "buzz",
    "rest", "fit", "gq", "tk", "ml", "cf", "ga", "icu", "cyou",
}

SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "ow.ly", "cutt.ly",
    "rebrand.ly", "shorturl.at", "tiny.cc",
}

# Second-level public suffixes, so "garantibbva.com.tr" is one registered domain.
MULTI_PART_SUFFIXES = {
    "com.tr", "net.tr", "org.tr", "edu.tr", "gov.tr", "bel.tr", "k12.tr", "gen.tr",
    "co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "co.jp", "com.br", "co.in", "com.cn",
}

FEATURE_NAMES = [
    "url_length", "host_length", "path_length", "query_length",
    "num_dots", "num_hyphens", "num_digits", "digit_ratio",
    "num_subdomains", "num_params", "num_special",
    "has_ip", "has_at", "has_https", "has_double_slash_redirect",
    "has_punycode", "is_shortener", "suspicious_tld",
    "suspicious_word_count", "brand_in_subdomain_or_path", "host_entropy",
]


def _normalize(url: str) -> str:
    url = url.strip()
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url):
        url = "http://" + url
    return url


def _entropy(text: str) -> float:
    if not text:
        return 0.0
    counts = Counter(text)
    total = len(text)
    return -sum(c / total * math.log2(c / total) for c in counts.values())


def _is_ip(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def split_host(host: str) -> tuple[str, str]:
    """Split a hostname into (subdomain, registered_domain)."""
    labels = host.split(".") if host else []
    n = 3 if len(labels) >= 3 and ".".join(labels[-2:]) in MULTI_PART_SUFFIXES else 2
    if _is_ip(host) or len(labels) <= n:
        return "", host
    return ".".join(labels[:-n]), ".".join(labels[-n:])


def extract_features(url: str) -> dict:
    """Return a dict of numeric features keyed by FEATURE_NAMES."""
    raw = url.strip()
    parsed = urlparse(_normalize(raw))
    host = (parsed.hostname or "").lower()
    path = parsed.path or ""
    query = parsed.query or ""
    lower = raw.lower()

    labels = host.split(".") if host else []
    tld = labels[-1] if labels else ""
    subdomain, registered = split_host(host)
    # Everything except the registered domain (e.g. "paypal.secure" in paypal.secure.evil.com)
    outside_registered = subdomain + path.lower()

    digits = sum(ch.isdigit() for ch in raw)

    return {
        "url_length": len(raw),
        "host_length": len(host),
        "path_length": len(path),
        "query_length": len(query),
        "num_dots": raw.count("."),
        "num_hyphens": host.count("-"),
        "num_digits": digits,
        "digit_ratio": digits / len(raw) if raw else 0.0,
        "num_subdomains": len(subdomain.split(".")) if subdomain else 0,
        "num_params": len([p for p in query.split("&") if p]),
        "num_special": sum(raw.count(ch) for ch in "@~%=&_!$*,;"),
        "has_ip": int(_is_ip(host)),
        "has_at": int("@" in raw),
        "has_https": int(parsed.scheme == "https"),
        "has_double_slash_redirect": int("//" in raw[raw.find("://") + 3:] if "://" in raw else "//" in raw),
        "has_punycode": int("xn--" in host),
        "is_shortener": int(registered in SHORTENERS),
        "suspicious_tld": int(tld in SUSPICIOUS_TLDS),
        "suspicious_word_count": sum(w in lower for w in SUSPICIOUS_WORDS),
        "brand_in_subdomain_or_path": int(any(b in outside_registered for b in BRANDS)),
        "host_entropy": _entropy(host),
    }


def feature_vector(url: str) -> list:
    feats = extract_features(url)
    return [feats[name] for name in FEATURE_NAMES]


# The ML model only sees the hostname (scheme, "www." and path are stripped).
# In PhiUSIIL every legitimate URL is a bare "https://www.<domain>" homepage, so
# path/https features let a model cheat; host-only features force it to learn
# what suspicious *domains* look like. Path signals are scored separately by rules.
HOST_FEATURE_NAMES = [
    "host_length", "num_dots", "num_hyphens", "num_digits", "digit_ratio",
    "num_subdomains", "longest_label", "tld_length", "vowel_ratio",
    "has_ip", "has_punycode", "is_shortener", "suspicious_tld",
    "suspicious_word_count", "brand_in_subdomain", "host_entropy",
]


def host_of(url: str) -> str:
    host = (urlparse(_normalize(url)).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def extract_host_features(url: str) -> dict:
    host = host_of(url)
    labels = host.split(".") if host else []
    tld = labels[-1] if labels else ""
    subdomain, registered = split_host(host)
    letters = [ch for ch in host if ch.isalpha()]
    digits = sum(ch.isdigit() for ch in host)
    is_ip = _is_ip(host)

    return {
        "host_length": len(host),
        "num_dots": host.count("."),
        "num_hyphens": host.count("-"),
        "num_digits": digits,
        "digit_ratio": digits / len(host) if host else 0.0,
        "num_subdomains": len(subdomain.split(".")) if subdomain else 0,
        "longest_label": max((len(l) for l in labels), default=0),
        "tld_length": 0 if is_ip else len(tld),
        "vowel_ratio": sum(ch in "aeiou" for ch in letters) / len(letters) if letters else 0.0,
        "has_ip": int(is_ip),
        "has_punycode": int("xn--" in host),
        "is_shortener": int(registered in SHORTENERS),
        "suspicious_tld": int(tld in SUSPICIOUS_TLDS),
        "suspicious_word_count": sum(w in host for w in SUSPICIOUS_WORDS),
        "brand_in_subdomain": int(any(b in subdomain for b in BRANDS)),
        "host_entropy": _entropy(host),
    }


def host_feature_vector(url: str) -> list:
    feats = extract_host_features(url)
    return [feats[name] for name in HOST_FEATURE_NAMES]


REASONS = {
    "ip": ("Alan adı yerine doğrudan IP adresi kullanılıyor.",
           "The link uses a raw IP address instead of a domain name."),
    "at": ("Linkte '@' işareti var; gerçek adres gizlenmiş olabilir.",
           "The link contains '@', which can hide the real destination."),
    "punycode": ("Alan adında punycode (xn--) var; benzer görünen harflerle taklit yapılıyor olabilir.",
                 "The domain uses punycode (xn--), often used to imitate look-alike letters."),
    "brand": ("Bilinen bir marka adı, asıl alan adında değil alt alan adında veya yolda geçiyor.",
              "A well-known brand name appears in the subdomain or path, not in the real domain."),
    "tld": ("Uzantı (TLD), dolandırıcılıkta sık kullanılan uzantılardan biri.",
            "The domain extension (TLD) is commonly abused in scams."),
    "shortener": ("Link kısaltma servisi kullanılmış; gerçek hedef görünmüyor.",
                  "A URL shortener hides the real destination."),
    "words": ("Linkte 'giriş', 'doğrula', 'hesap' gibi oltalamada sık geçen kelimeler var.",
              "The link contains words common in phishing, like 'login', 'verify' or 'account'."),
    "subdomains": ("Çok fazla alt alan adı var; gerçek alan adı gizlenmeye çalışılıyor olabilir.",
                   "Too many subdomains; the real domain may be deliberately buried."),
    "hyphens": ("Alan adında çok sayıda tire var.",
                "The domain contains many hyphens."),
    "long": ("Link alışılmadık derecede uzun.",
             "The link is unusually long."),
    "redirect": ("Link içinde yönlendirme ('//') var.",
                 "The link contains an embedded redirect ('//')."),
    "http": ("Bağlantı şifreli değil (HTTPS yok).",
             "The connection is not encrypted (no HTTPS)."),
    "known": ("{domain} bilinen ve güvenilir bir alan adı.",
              "{domain} is a well-known, trusted domain."),
}


def reason(key: str, lang: str = "tr", **kwargs) -> str:
    tr, en = REASONS[key]
    return (en if lang == "en" else tr).format(**kwargs)


def explain(feats: dict, lang: str = "tr") -> list[str]:
    """Human-readable reasons (Turkish or English) for the suspicious signals that fired."""
    fired = [
        ("ip", feats["has_ip"]),
        ("at", feats["has_at"]),
        ("punycode", feats["has_punycode"]),
        ("brand", feats["brand_in_subdomain_or_path"]),
        ("tld", feats["suspicious_tld"]),
        ("shortener", feats["is_shortener"]),
        ("words", feats["suspicious_word_count"] >= 2),
        ("subdomains", feats["num_subdomains"] >= 3),
        ("hyphens", feats["num_hyphens"] >= 3),
        ("long", feats["url_length"] > 100),
        ("redirect", feats["has_double_slash_redirect"]),
        ("http", not feats["has_https"]),
    ]
    return [reason(key, lang) for key, hit in fired if hit]
