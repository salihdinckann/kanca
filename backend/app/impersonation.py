"""Brand impersonation: look-alike domains for brands people in Turkey trust.

Catches what a model trained on global data misses: 'trendyoll.xin' (typo),
'garanti-odeme-portali.cloud' (brand glued to bait words), 'trptt-gov.eu.cc'
and 'garantı.com' (look-alike letters). Pure string work, no network.
"""

import re

from .features import split_host

# brand token -> registered domains the brand really owns
BRANDS: dict[str, set[str]] = {
    "garanti": {"garantibbva.com.tr", "garanti.com.tr", "garantibbvaemeklilik.com.tr"},
    "akbank": {"akbank.com", "akbank.com.tr"},
    "ziraat": {"ziraatbank.com.tr", "ziraatkatilim.com.tr", "ziraat.com.tr"},
    "isbank": {"isbank.com.tr"},
    "yapikredi": {"yapikredi.com.tr"},
    "vakifbank": {"vakifbank.com.tr"},
    "halkbank": {"halkbank.com.tr"},
    "denizbank": {"denizbank.com"},
    "kuveytturk": {"kuveytturk.com.tr"},
    "enpara": {"enpara.com"},
    "papara": {"papara.com"},
    "sahibinden": {"sahibinden.com"},
    "trendyol": {"trendyol.com"},
    "hepsiburada": {"hepsiburada.com"},
    "yemeksepeti": {"yemeksepeti.com"},
    "migros": {"migros.com.tr"},
    "turkcell": {"turkcell.com.tr"},
    "vodafone": {"vodafone.com.tr", "vodafone.com"},
    "turktelekom": {"turktelekom.com.tr"},
    "edevlet": {"turkiye.gov.tr"},
    "yurtici": {"yurticikargo.com"},
    "araskargo": {"araskargo.com.tr"},
    "mngkargo": {"mngkargo.com.tr"},
    "turkishairlines": {"turkishairlines.com", "thy.com"},
    "pegasus": {"flypgs.com"},
    "paypal": {"paypal.com"},
    "instagram": {"instagram.com"},
    "whatsapp": {"whatsapp.com"},
    "netflix": {"netflix.com"},
    "microsoft": {"microsoft.com", "live.com", "office.com"},
    "apple": {"apple.com", "icloud.com"},
    # Short names: only matched as a whole token or with bait words, see _short_hit.
    "ptt": {"ptt.gov.tr", "pttavm.com", "pttkargo.com.tr"},
    "mhrs": {"mhrs.gov.tr"},
    "hgs": {"ptt.gov.tr", "hgs.gov.tr"},
    "a101": {"a101.com.tr"},
    "toki": {"toki.gov.tr"},
    "sgk": {"sgk.gov.tr"},
}
SHORT = {b for b in BRANDS if len(b) <= 4}

# Words scammers attach to short brand names: mhrsrandevu, trptt, a101onlines.
BAIT = (
    "tr", "gov", "online", "onlines", "randevu", "giris", "destek", "odeme", "kargo", "takip", "iade", "basvuru",
    "kampanya", "firsat", "hizli", "my", "e", "web", "portal", "sorgu", "bilgi", "musteri", "teslimat", "avm",
    "iletisim", "guvenli", "onay", "indirim", "sepet", "cepte", "puan", "hediye", "odul", "kredi", "hesap", "sifre", "dogrula", "login", "secure", "verify", "support", "bonus",
)

# Ordinary words that are also brand names; never flagged just for containing them.
GENERIC = {"apple", "pegasus"}
# Global brands own countless domains (apple.news, netflix.net, microsoft365.com),
# so for them only clear tricks count: look-alike letters, typos and bait words.
GLOBAL = {"paypal", "instagram", "whatsapp", "netflix", "microsoft", "apple", "vodafone"}

HOMOGLYPHS = str.maketrans({"ı": "i", "ş": "s", "ğ": "g", "ü": "u", "ö": "o", "ç": "c", "0": "o", "1": "l", "3": "e", "5": "s"})


def _decode(label: str) -> str:
    """xn--garant-y9a -> garantı (look-alike letters arrive as punycode)."""
    if not label.startswith("xn--"):
        return label
    try:
        return label.encode().decode("idna")
    except UnicodeError:
        return label


def _normalize(text: str) -> str:
    return text.translate(HOMOGLYPHS).replace("rn", "m").replace("vv", "w")


def _distance(a: str, b: str, limit: int) -> int:
    """Edit distance with adjacent swaps (OSA), stopping early above `limit`."""
    if abs(len(a) - len(b)) > limit:
        return limit + 1
    prev2: list[int] = []
    prev = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        cur = [i] + [0] * len(b)
        for j in range(1, len(b) + 1):
            cost = a[i - 1] != b[j - 1]
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                cur[j] = min(cur[j], prev2[j - 2] + 1)
        if min(cur) > limit:
            return limit + 1
        prev2, prev = prev, cur
    return prev[-1]


def _short_hit(brand: str, token: str) -> bool:
    if token == brand:
        return True
    if token.startswith(brand):
        return any(token[len(brand):].startswith(w) for w in BAIT if len(w) > 1)
    if token.endswith(brand):
        return token[: -len(brand)] in BAIT
    return False


def detect(host: str) -> tuple[str, str] | None:
    """(brand, kind) when `host` imitates a brand it doesn't belong to. kind is
    'homoglyph', 'typo', 'glued' (brand plus bait words), 'suffix' (brand name on a foreign
    ending, garanti.xyz), 'subdomain' or 'contains' (brand inside a longer name). None otherwise."""
    sub, registered = split_host(host)
    if "." not in registered:
        return None
    label = registered.split(".")[0]
    raw = _decode(label)
    norm = _normalize(raw)
    compact = norm.replace("-", "")
    tokens = [t for t in re.split(r"[-\d]+", norm) if t] + [compact]
    sub_tokens = [t for t in re.split(r"[-.]", _normalize(sub)) if t]
    raw_parts = [t for t in raw.split("-") if t]
    raw_sub = [t for t in re.split(r"[-.]", sub) if t]

    for brand, owned in BRANDS.items():
        if registered in owned:
            continue
        if brand in SHORT:
            # Digits matter here (a101), so short names are matched on the raw text.
            if any(_short_hit(brand, t) for t in raw_parts):
                return brand, "suffix" if raw == brand else "glued"
            if any(_short_hit(brand, t) for t in raw_sub):
                return brand, "subdomain"
            continue
        if brand in compact:
            if brand not in raw.replace("-", ""):
                return brand, "homoglyph"
            if compact == brand:
                if brand in GLOBAL:
                    continue
                return brand, "suffix"
            rest = compact.replace(brand, "", 1)
            if len(rest) <= 2:
                return brand, "typo"  # trendyoll, trendyolkv: a letter or two tacked on
            if brand in raw_parts or any(w in rest for w in BAIT if len(w) > 2):
                return brand, "glued"
            if brand not in GENERIC and brand not in GLOBAL:
                return brand, "contains"
            continue
        # Typos only for longer names: 'apple' is one letter away from 'apply'.
        limit = 1 if len(brand) <= 7 else 2
        if len(brand) >= 6 and any(t != brand and len(t) >= 4 and _distance(t, brand, limit) <= limit for t in tokens):
            return brand, "homoglyph" if raw != norm else "typo"
        if any(brand in t for t in sub_tokens):
            return brand, "subdomain"
    return None
