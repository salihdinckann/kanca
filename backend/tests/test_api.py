"""API tests. Network lookups (RDAP, Safe Browsing) are replaced with fakes."""

import pytest
from fastapi.testclient import TestClient

import app.main as main


@pytest.fixture
def intel(monkeypatch):
    """Control what the external lookups return; records RDAP calls."""
    state = {"age": None, "sb": None, "age_calls": []}

    async def fake_age(_client, domain):
        state["age_calls"].append(domain)
        return state["age"]

    async def fake_sb(_client, _url):
        return state["sb"]

    monkeypatch.setattr(main, "domain_age_days", fake_age)
    monkeypatch.setattr(main, "safe_browsing_match", fake_sb)
    return state


@pytest.fixture
def client():
    with TestClient(main.app) as c:
        yield c


def scan(client, url, lang="tr"):
    res = client.post("/api/scan/url", json={"url": url, "lang": lang})
    assert res.status_code == 200
    return res.json()


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok" and body["model_loaded"] is True


def test_known_domain_is_safe_without_lookups(client, intel):
    r = scan(client, "https://www.garantibbva.com.tr")
    assert (r["verdict"], r["engine"]) == ("safe", "reputation")
    assert intel["age_calls"] == []


def test_tranco_popular_domain_is_safe(client, intel):
    r = scan(client, "https://www.bbc.co.uk/news", lang="en")
    assert r["verdict"] == "safe"
    assert "Tranco" in r["reasons"][0]


def test_obvious_phishing_is_dangerous(client, intel):
    r = scan(client, "http://paypal.com.secure-login.verify-account.xyz/signin")
    assert r["verdict"] == "dangerous" and r["risk_score"] >= 90
    assert len(r["reasons"]) >= 3


def test_safe_browsing_match_overrides_everything(client, intel):
    intel["sb"] = True
    r = scan(client, "https://www.garantibbva.com.tr")
    assert (r["risk_score"], r["verdict"], r["engine"]) == (100, "dangerous", "safe_browsing")
    assert r["safe_browsing"] == "match"


def test_brand_new_domain_raises_risk(client, intel):
    url = "https://kargo-takip-merkezi.com/"
    intel["age"] = 3650
    old = scan(client, url)
    intel["age"] = 4
    new = scan(client, url)
    assert new["risk_score"] > old["risk_score"]
    assert new["domain_age_days"] == 4
    assert "4 gün" in new["reasons"][0]


def test_hosting_platform_warns_and_skips_domain_age(client, intel):
    r = scan(client, "https://kanca-app.vercel.app")
    assert "vercel.app" in r["reasons"][0]
    assert intel["age_calls"] == []


class AlwaysPhishingModel:
    def predict_proba(self, X):
        return [[0.05, 0.95] for _ in range(len(X))]


def test_model_alone_never_says_dangerous(client, intel, monkeypatch):
    monkeypatch.setattr(main, "model", AlwaysPhishingModel())
    r = scan(client, "https://plain-looking-site.com/")
    assert r["verdict"] == "suspicious" and r["risk_score"] == 65
    assert "Makine öğrenmesi" in r["reasons"][0]


def test_legit_common_subdomain_is_not_flagged(client, intel):
    intel["age"] = 2000
    assert scan(client, "https://docs.example-startup.io/guide")["verdict"] == "safe"


def test_product_subdomain_of_established_domain_is_safe(client, intel):
    intel["age"] = 2935
    assert scan(client, "https://sqlmodel.tiangolo.com/")["verdict"] == "safe"


def test_product_subdomain_of_new_domain_is_not_trusted(client, intel):
    intel["age"] = 5
    assert scan(client, "https://sqlmodel.tiangolo.com/")["verdict"] != "safe"


def test_suspicious_subdomain_of_old_domain_gets_no_benefit(client, intel):
    intel["age"] = 3000
    r = scan(client, "https://paypal-login83.oldsite-example.com/")
    assert r["verdict"] != "safe"


def test_official_suffix_is_trusted(client, intel):
    r = scan(client, "https://tybsng.tubitak.gov.tr/basvuru")
    assert (r["verdict"], r["engine"]) == ("safe", "reputation")
    assert "tubitak.gov.tr" in r["reasons"][0]
    assert intel["age_calls"] == []


def test_lookalike_of_official_suffix_is_not_trusted(client, intel):
    assert scan(client, "http://tubitak-gov-tr.basvuru-giris.xyz/")["engine"] != "reputation"


def test_own_site_is_trusted(client, intel):
    intel["age"] = 1
    for url in ("https://kanca.salihdinckan.com", "https://kanca-inky.vercel.app"):
        assert scan(client, url)["verdict"] == "safe"


def test_text_scan_extracts_and_scores_each_link(client, intel):
    sms = "Kargonuz bekliyor.Odeme: ptt-kargo-teslimat.click/odeme Takip: www.yurticikargo.com"
    res = client.post("/api/scan/text", json={"text": sms, "lang": "en"})
    links = res.json()["links"]
    assert [l["verdict"] for l in links] == ["dangerous", "safe"]


def test_text_without_links(client, intel):
    res = client.post("/api/scan/text", json={"text": "Merhaba, yarin gorusuruz."})
    assert res.json()["links"] == []


def test_input_validation(client):
    assert client.post("/api/scan/url", json={"url": "x"}).status_code == 422
    assert client.post("/api/scan/url", json={"url": "example.com", "lang": "de"}).status_code == 422
