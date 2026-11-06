"""Domain reputation: well-known domains the model should not second-guess.

Hosting platforms where anyone can publish (firebaseapp.com, github.io,
sites.google.com, blogspot.com, ...) are deliberately NOT listed here.
"""

from pathlib import Path

KNOWN_DOMAINS = {
    # Global
    "google.com", "youtube.com", "gmail.com", "facebook.com", "instagram.com",
    "whatsapp.com", "twitter.com", "x.com", "linkedin.com", "microsoft.com",
    "live.com", "outlook.com", "office.com", "apple.com", "icloud.com",
    "amazon.com", "netflix.com", "spotify.com", "wikipedia.org", "reddit.com",
    "github.com", "gitlab.com", "stackoverflow.com", "python.org", "pypi.org",
    "npmjs.com", "nodejs.org", "mozilla.org", "cloudflare.com", "paypal.com",
    "zoom.us", "dropbox.com", "adobe.com", "openai.com", "anthropic.com",
    "claude.ai", "kaggle.com", "medium.com", "yahoo.com", "bing.com",
    "tiktok.com", "twitch.tv", "discord.com", "telegram.org", "booking.com",
    # Türkiye
    "turkiye.gov.tr", "garantibbva.com.tr", "akbank.com", "ziraatbank.com.tr",
    "isbank.com.tr", "yapikredi.com.tr", "qnb.com.tr", "denizbank.com",
    "halkbank.com.tr", "vakifbank.com.tr", "enpara.com", "papara.com",
    "turkcell.com.tr", "vodafone.com.tr", "turktelekom.com.tr", "ptt.gov.tr",
    "trendyol.com", "hepsiburada.com", "n11.com", "amazon.com.tr", "sahibinden.com",
    "yemeksepeti.com", "getir.com", "yurticikargo.com", "araskargo.com.tr",
    "mngkargo.com.tr", "thy.com", "turkishairlines.com", "osym.gov.tr", "meb.gov.tr",
    "eksisozluk.com", "hurriyet.com.tr", "sozcu.com.tr", "ntv.com.tr",
    # Kanca's own domain (new, so domain age would otherwise count against it)
    "salihdinckan.com",
}


# Exact hostnames we trust on shared hosting platforms (Kanca's own site).
KNOWN_HOSTS = {
    "kanca-inky.vercel.app",
}

# Platforms where anyone can publish under a free subdomain. Phishing kits are
# often hosted here, so the platform itself is never trusted.
HOSTING_PLATFORMS = {
    "vercel.app", "netlify.app", "github.io", "gitlab.io", "pages.dev",
    "workers.dev", "web.app", "firebaseapp.com", "herokuapp.com", "onrender.com",
    "glitch.me", "repl.co", "replit.app", "blogspot.com", "wixsite.com",
    "weebly.com", "000webhostapp.com", "azurewebsites.net", "appspot.com",
    "surge.sh", "fly.dev", "railway.app",
}


# Tranco top 10k (built by ml/build_tranco.py, abusable platforms already removed).
_TRANCO_FILE = Path(__file__).with_name("data") / "tranco_top10k.txt"
POPULAR_DOMAINS = (
    {
        line.strip()
        for line in _TRANCO_FILE.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    }
    - HOSTING_PLATFORMS
    if _TRANCO_FILE.exists()
    else set()
)


# Suffixes only government, education and military bodies can register, so a
# scammer cannot own one. Safe Browsing still runs first for hacked sites.
OFFICIAL_SUFFIXES = (
    "gov.tr", "edu.tr", "k12.tr", "mil.tr", "tsk.tr", "pol.tr", "bel.tr",
    "gov", "edu", "mil",
)


def official_domain(host: str) -> str | None:
    """'tybsng.tubitak.gov.tr' -> 'tubitak.gov.tr'; None if not an official suffix."""
    for suffix in OFFICIAL_SUFFIXES:
        if host.endswith("." + suffix):
            name = host[: -len(suffix) - 1].rsplit(".", 1)[-1]
            return f"{name}.{suffix}"
    return None


def is_known(host: str, registered_domain: str) -> bool:
    return host in KNOWN_HOSTS or registered_domain in KNOWN_DOMAINS


def is_popular(registered_domain: str) -> bool:
    return registered_domain in POPULAR_DOMAINS


def is_hosting_platform(registered_domain: str) -> bool:
    return registered_domain in HOSTING_PLATFORMS
