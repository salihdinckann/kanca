from app.features import explain, extract_features, extract_host_features, host_of, split_host


def test_split_host_handles_multi_part_suffixes():
    assert split_host("www.garantibbva.com.tr") == ("www", "garantibbva.com.tr")
    assert split_host("docs.python.org") == ("docs", "python.org")
    assert split_host("192.168.1.1") == ("", "192.168.1.1")


def test_host_of_strips_scheme_www_and_path():
    assert host_of("https://www.Example.com/login?x=1") == "example.com"
    assert host_of("ptt-kargo.click/odeme") == "ptt-kargo.click"


def test_brand_in_subdomain_is_detected():
    feats = extract_features("http://paypal.com.secure-login.verify-account.xyz/signin")
    assert feats["brand_in_subdomain_or_path"] == 1
    assert feats["suspicious_tld"] == 1
    assert feats["num_subdomains"] >= 3


def test_ip_and_at_tricks():
    assert extract_features("http://192.168.4.20/garanti/giris")["has_ip"] == 1
    assert extract_features("https://google.com@evil.example/x")["has_at"] == 1


def test_bare_link_is_not_flagged_for_missing_https():
    assert extract_features("ptt-kargo.click/odeme")["has_https"] == 1
    assert extract_features("http://ptt-kargo.click/odeme")["has_https"] == 0


def test_host_features_ignore_path_and_www():
    a = extract_host_features("https://www.example.com/a/very/long/path?with=query")
    b = extract_host_features("example.com")
    assert a == b


def test_explain_is_bilingual():
    feats = extract_features("http://192.168.4.20/x")
    tr, en = explain(feats, "tr"), explain(feats, "en")
    assert len(tr) == len(en) > 0
    assert any("IP" in r for r in tr) and any("IP" in r for r in en)
