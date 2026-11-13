"""Threat intelligence kept in memory and refreshed in the background.

- USOM (Turkey's national CERT) phishing list, ~110k entries: full load on start,
  then only the new entries every hour.
- OpenPhish community feed: live phishing URLs, refreshed every hour.

The free server sleeps when idle; each wake-up refreshes whatever is stale.

(Certificate Transparency via crt.sh was tried and dropped: in November 2026 it
returned no certificates for any of the fresh phishing domains we checked.)
"""

import asyncio
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

import httpx

from .features import host_of, split_host
from .reputation import is_hosting_platform

log = logging.getLogger("kanca.feeds")

USOM_API = "https://siberguvenlik.gov.tr/api/address/index"
USOM_PAGE = 9999  # the API's maximum
OPENPHISH = "https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt"
FEED_EVERY = timedelta(hours=1)


def _host(entry: str) -> str:
    return host_of(entry.strip().lower()).removeprefix("www.")


@dataclass
class Feeds:
    hosts: dict[str, str] = field(default_factory=dict)  # host -> "usom" | "openphish"
    usom_latest: str | None = None
    updated: dict[str, datetime] = field(default_factory=dict)

    def blocklisted(self, host: str) -> str | None:
        """Source that lists this host, or the domain it belongs to; None if neither."""
        host = host.removeprefix("www.")
        if host in self.hosts:
            return self.hosts[host]
        _, registered = split_host(host)
        # A listed domain covers its subdomains, except on shared hosting
        # (one bad *.pages.dev site says nothing about the rest).
        if registered != host and not is_hosting_platform(registered):
            return self.hosts.get(registered)
        return None

    def status(self) -> dict:
        return {
            "blocklist_hosts": len(self.hosts),
            "updated": {k: v.isoformat(timespec="minutes") for k, v in self.updated.items()},
        }

    def _stale(self, name: str) -> bool:
        last = self.updated.get(name)
        return last is None or datetime.now(timezone.utc) - last >= FEED_EVERY

    async def _usom(self, client: httpx.AsyncClient) -> None:
        params: dict = {"desc": "PH", "per-page": USOM_PAGE}
        if self.usom_latest:
            params["date_gte"] = self.usom_latest
        page, added, newest = 1, 0, self.usom_latest
        while True:
            models = await self._usom_page(client, {**params, "page": page})
            for m in models:
                h = _host(m.get("url", ""))
                if h:
                    self.hosts.setdefault(h, "usom")
                    added += 1
                if not newest or m.get("date", "") > newest:
                    newest = m.get("date")
            if len(models) < USOM_PAGE:
                break
            page += 1
        # Only move the bookmark once every page arrived; a failed page means the
        # next run starts over instead of silently skipping older entries.
        self.usom_latest = newest
        log.info("usom: +%d (total %d hosts)", added, len(self.hosts))

    @staticmethod
    async def _usom_page(client: httpx.AsyncClient, params: dict) -> list[dict]:
        for attempt in range(3):
            try:
                res = await client.get(USOM_API, params=params, timeout=120)
                res.raise_for_status()
                return res.json().get("models", [])
            except (httpx.HTTPError, ValueError):
                if attempt == 2:
                    raise
                await asyncio.sleep(5 * (attempt + 1))
        return []

    async def _openphish(self, client: httpx.AsyncClient) -> None:
        res = await client.get(OPENPHISH, timeout=30)
        res.raise_for_status()
        for line in res.text.splitlines():
            h = _host(line)
            if h:
                self.hosts.setdefault(h, "openphish")

    async def refresh(self, client: httpx.AsyncClient) -> None:
        for name, job in (("usom", self._usom), ("openphish", self._openphish)):
            if not self._stale(name):
                continue
            try:
                await job(client)
                self.updated[name] = datetime.now(timezone.utc)
            except (httpx.HTTPError, ValueError) as e:
                log.warning("%s refresh failed: %s", name, e)

    async def run_forever(self, client: httpx.AsyncClient) -> None:
        while True:
            await self.refresh(client)
            await asyncio.sleep(300)


feeds = Feeds()


def enabled() -> bool:
    """Tests and offline runs set KANCA_FEEDS=0."""
    return os.getenv("KANCA_FEEDS", "1") != "0"
