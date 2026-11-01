"""Find links inside free text such as an SMS, WhatsApp message or email body."""

import re

from .features import SUSPICIOUS_TLDS

# Bare domains ("ptt-kargo.click/odeme") are only accepted with a real TLD, so
# Turkish SMS text without a space after a period ("teslim edilemedi.Detay")
# is not mistaken for a link.
COMMON_TLDS = SUSPICIOUS_TLDS | {
    "com", "net", "org", "info", "biz", "io", "co", "me", "app", "dev", "ai", "tr",
    "shop", "online", "site", "store", "live", "website", "tech", "space", "club",
    "vip", "win", "bid", "loan", "xyz", "top", "cc", "ru", "cn", "uk", "de", "us",
    "eu", "in", "br", "ly", "gl", "gd", "to", "sh", "pw", "su", "ws", "la", "tv",
    "online", "today", "help", "services", "center", "digital", "network", "page",
}

MAX_LINKS = 5

_URL_RE = re.compile(
    r"""(?ix)
    (?<![@\w.-])                                   # not part of an email or longer token
    (
      (?:https?://|www\.)[^\s<>"'`]+               # explicit links
      |
      (?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+  # bare domain labels
      ([a-z]{2,24})                                # TLD (checked below)
      (?::\d{2,5})?(?:/[^\s<>"'`]*)?               # optional port and path
    )
    """
)

_TRAILING = ".,;:!?)]}>'\"»”’"


def extract_links(text: str) -> list[str]:
    """Return up to MAX_LINKS unique links found in the text, in order."""
    found: list[str] = []
    seen: set[str] = set()
    for m in _URL_RE.finditer(text):
        link = m.group(1).rstrip(_TRAILING)
        tld = m.group(2)
        if tld is not None and tld.lower() not in COMMON_TLDS:
            continue
        key = re.sub(r"^(https?://)?(www\.)?", "", link.lower()).rstrip("/")
        if not key or key in seen:
            continue
        seen.add(key)
        found.append(link)
        if len(found) == MAX_LINKS:
            break
    return found
