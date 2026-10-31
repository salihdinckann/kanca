"""Domain reputation: well-known domains the model should not second-guess.

Hosting platforms where anyone can publish (firebaseapp.com, github.io,
sites.google.com, blogspot.com, ...) are deliberately NOT listed here.
"""

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
}


def is_known(registered_domain: str) -> bool:
    return registered_domain in KNOWN_DOMAINS
