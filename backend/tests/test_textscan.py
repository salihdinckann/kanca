from app.textscan import MAX_LINKS, extract_links


def test_finds_bare_link_in_turkish_sms():
    sms = "Sayin musterimiz, kargonuz teslim edilemedi.Detaylar icin: ptt-kargo-teslimat.click/odeme adresine girin."
    assert extract_links(sms) == ["ptt-kargo-teslimat.click/odeme"]


def test_missing_space_after_period_is_not_a_link():
    assert extract_links("Merhaba nasilsin.Yarin gorusuruz.") == []


def test_trailing_punctuation_is_stripped():
    assert extract_links("Giris yapin: https://garanti-bbva.top/hesap.") == ["https://garanti-bbva.top/hesap"]


def test_email_addresses_are_ignored():
    assert extract_links("Iletisim: destek@garanti.com.tr") == []


def test_duplicates_are_removed():
    assert extract_links("www.zoom.us/j/1 ve https://zoom.us/j/1") == ["www.zoom.us/j/1"]


def test_ip_links_and_shorteners():
    links = extract_links("bit.ly/3xYz12 ve http://192.168.4.20/giris")
    assert links == ["bit.ly/3xYz12", "http://192.168.4.20/giris"]


def test_link_count_is_capped():
    text = " ".join(f"site{i}.com" for i in range(MAX_LINKS + 3))
    assert len(extract_links(text)) == MAX_LINKS
