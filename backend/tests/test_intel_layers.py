"""Threat feeds and brand impersonation."""

import pytest

from app.feeds import feeds
from app.impersonation import detect
from tests.test_api import client, intel, scan  # noqa: F401  (fixtures)


@pytest.mark.parametrize(
    "host, brand, kind",
    [
        ("trendyoll.xin", "trendyol", "typo"),
        ("akbnak.com", "akbank", "typo"),
        ("paypa1.com", "paypal", "homoglyph"),
        ("rnicrosoft.com", "microsoft", "homoglyph"),
        ("garanti-odeme-portali.cloud", "garanti", "glued"),
        ("edevletvatandasgiris.org", "edevlet", "glued"),
        ("a101onlines.com", "a101", "glued"),
        ("mhrsrandevuonline.xyz", "mhrs", "glued"),
        ("garanti.xyz", "garanti", "suffix"),
        ("sahibinden-param-guvende.tr-servis-onay.online", "sahibinden", "subdomain"),
    ],
)
def test_detects_impersonation(host, brand, kind):
    assert detect(host) == (brand, kind)


@pytest.mark.parametrize(
    "host",
    ["garantibbva.com.tr", "www.ptt.gov.tr", "trendyol.com", "appletree.com", "apply-online.com",
     "settings.com", "tokio-hotel.com", "kanca.salihdinckan.com", "github.com"],
)
def test_ignores_real_and_ordinary_domains(host):
    assert detect(host) is None


@pytest.fixture
def clean_feeds():
    hosts = dict(feeds.hosts)
    feeds.hosts.clear()
    yield feeds
    feeds.hosts = hosts


def test_usom_listed_domain_is_dangerous(client, intel, clean_feeds):
    clean_feeds.hosts["kooperatifweb.sbs"] = "usom"
    body = scan(client, "https://kooperatifweb.sbs/giris")
    assert body["engine"] == "threat_feed" and body["verdict"] == "dangerous"
    assert "USOM" in body["reasons"][0]


def test_listed_domain_covers_subdomains_but_not_shared_hosting(client, intel, clean_feeds):
    clean_feeds.hosts["evil.example"] = "openphish"
    clean_feeds.hosts["bad-site.pages.dev"] = "openphish"
    assert clean_feeds.blocklisted("login.evil.example") == "openphish"
    assert clean_feeds.blocklisted("other-site.pages.dev") is None


def test_known_sites_beat_feeds(client, intel, clean_feeds):
    clean_feeds.hosts["github.com"] = "openphish"  # e.g. one phishing page on a big site
    assert scan(client, "https://github.com")["verdict"] == "safe"


def test_impersonation_raises_score_with_named_reason(client, intel, clean_feeds):
    body = scan(client, "https://trendyoll.xin")
    assert body["verdict"] == "dangerous"
    assert "trendyol" in body["reasons"][0]


def test_usom_bookmark_waits_for_every_page(monkeypatch):
    import asyncio

    import httpx

    from app import feeds as feeds_mod

    monkeypatch.setattr(feeds_mod, "USOM_PAGE", 2)
    pages = {
        1: [{"url": "a.example", "date": "2026-11-13 10:00"}, {"url": "b.example", "date": "2026-11-12 10:00"}],
        2: None,  # fails
    }

    async def fake_page(_client, params):
        rows = pages[params["page"]]
        if rows is None:
            raise httpx.ConnectTimeout("boom")
        return rows

    f = feeds_mod.Feeds()
    monkeypatch.setattr(f, "_usom_page", fake_page)
    with pytest.raises(httpx.ConnectTimeout):
        asyncio.run(f._usom(None))
    assert f.usom_latest is None  # retry will start from the beginning
    pages[2] = [{"url": "c.example", "date": "2026-11-11 10:00"}]
    asyncio.run(f._usom(None))
    assert f.usom_latest == "2026-11-13 10:00" and {"a.example", "b.example", "c.example"} <= set(f.hosts)
