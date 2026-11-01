"""Build backend/app/data/tranco_top10k.txt from a Tranco top-1m CSV.

Download the list from https://tranco-list.eu/ and pass the CSV path:
    backend/.venv/Scripts/python ml/build_tranco.py path/to/top-1m.csv LIST_ID

Shared hosting, file storage, tunnels and URL shorteners are removed: they rank
high because millions of sites live on them, which is exactly why phishing
kits use them too.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
from app.features import SHORTENERS  # noqa: E402
from app.reputation import HOSTING_PLATFORMS  # noqa: E402

OUT = ROOT / "backend" / "app" / "data" / "tranco_top10k.txt"
TOP_N = 10_000

ABUSABLE = HOSTING_PLATFORMS | SHORTENERS | {
    "amazonaws.com", "cloudfront.net", "googleusercontent.com", "googleapis.com",
    "azureedge.net", "windows.net", "azurefd.net", "akamaihd.net", "akamaized.net",
    "sharepoint.com", "1drv.ms", "box.com", "wetransfer.com", "mediafire.com",
    "ngrok.io", "ngrok-free.app", "ngrok.app", "trycloudflare.com", "r2.dev",
    "duckdns.org", "no-ip.com", "ddns.net", "hopto.org", "ipfs.io", "dweb.link",
    "wordpress.com", "wix.com", "webflow.io", "framer.app", "framer.website",
    "notion.site", "gitbook.io", "godaddysites.com", "square.site", "carrd.co",
    "linktr.ee", "forms.gle", "typeform.com", "jotform.com", "glitch.me",
    "codepen.io", "jsdelivr.net", "unpkg.com", "rawgithubusercontent.com",
    "githubusercontent.com", "s3.amazonaws.com", "digitaloceanspaces.com",
    "translate.goog", "page.link", "app.link", "lnkd.in", "t.me", "wa.me",
}


def main(csv_path: str, list_id: str) -> None:
    domains = []
    with open(csv_path, encoding="utf-8") as f:
        for line in f:
            rank, domain = line.strip().split(",", 1)
            if int(rank) > TOP_N:
                break
            domain = domain.lower()
            if domain in ABUSABLE or any(domain.endswith("." + a) for a in ABUSABLE):
                continue
            domains.append(domain)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    header = f"# Tranco top {TOP_N} (list {list_id}, https://tranco-list.eu/list/{list_id}), abusable platforms removed\n"
    OUT.write_text(header + "\n".join(domains) + "\n", encoding="utf-8")
    print(f"{len(domains)} domains -> {OUT} ({TOP_N - len(domains)} removed)")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
