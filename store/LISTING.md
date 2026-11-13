# Chrome Web Store listing

Everything to paste into the Chrome Web Store developer dashboard.
Images are in `store/out/` (re-render with `bash store/render.sh`), the package is `store/out/kanca-extension-<version>.zip`.

## Package
`kanca-extension-1.0.1.zip`

## Store listing

**Category:** Privacy & Security
**Language:** Turkish (add English as a second listing language)

### Short description (from manifest, max 132 chars)
- TR: Açtığın sayfayı ya da sağ tıkladığın linki oltalama (phishing) riskine karşı tarar.
- EN: Checks the page you're on, or any link you right-click, for phishing risk.

### Detailed description — Türkçe
```
Kanca, şüpheli linkleri tıklamadan önce kontrol etmeni sağlayan ücretsiz bir oltalama (phishing) tarayıcısıdır.

NASIL KULLANILIR
• Araç çubuğundaki Kanca simgesine bas: açık olan sayfa taranır.
• Bir linke sağ tıkla → "Linki Kanca ile tara": link açılmadan kontrol edilir. E-postada, WhatsApp Web'de ve tüm sitelerde çalışır.
• İstediğin bir linki kutuya yapıştırıp da taratabilirsin.

NE GÖSTERİR
• 0–100 arası risk puanı ve karar: Güvenli, Şüpheli veya Tehlikeli
• Nedenleri: marka taklidi, çok yeni alan adı, şüpheli uzantı, HTTPS eksikliği gibi bulgular

NASIL ÇALIŞIR
1. Google Safe Browsing, USOM'un 110 bini aşkın kayıtlı ulusal oltalama listesi ve OpenPhish ile bilinen tehlikeli siteler kontrol edilir.
2. 235.000 gerçek linklik bir veri setiyle eğitilmiş makine öğrenmesi modeli alan adını inceler.
3. Alan adının kaç gün önce alındığı RDAP kayıtlarından öğrenilir.
4. Dünyanın en çok ziyaret edilen 10.000 sitesi ve bilinen Türk banka, kargo ve e-ticaret siteleri tanınır.
5. Bu markaların harf oynanmış (trendyoll), benzer harfli (paypa1) veya "odeme", "giris" gibi yem kelimeli taklitleri yakalanır.

GİZLİLİK
• Hiçbir şey kendiliğinden taranmaz; bir adres yalnızca sen tıkladığında gönderilir.
• Linkler saklanmaz, hesap, çerez veya reklam yoktur.
• Gizlilik politikası: https://kanca.salihdinckan.com/privacy

Açık kaynak: https://github.com/salihdinckann/kanca
Web sitesi: https://kanca.salihdinckan.com
```

### Detailed description — English
```
Kanca is a free phishing scanner that lets you check suspicious links before you click them.

HOW TO USE
• Click the Kanca icon in the toolbar to scan the page you're on.
• Right-click any link → "Scan link with Kanca" to check it without opening it. Works in email, WhatsApp Web and on any site.
• Or paste any link into the box.

WHAT YOU GET
• A 0–100 risk score and a verdict: Safe, Suspicious or Dangerous
• The reasons behind it: brand impersonation, a brand-new domain, an abused extension, missing HTTPS and more

HOW IT WORKS
1. Google Safe Browsing, USOM's national phishing list (110,000+ entries) and OpenPhish check the link against known dangerous sites.
2. A machine-learning model trained on a dataset of 235,000 real links inspects the domain.
3. The domain's registration age is looked up in RDAP.
4. The world's 10,000 most visited sites and well-known Turkish banks, carriers and shops are recognized instantly.
5. Misspelled (trendyoll), look-alike (paypa1) and bait-word copies of these brands are caught.

PRIVACY
• Nothing is scanned automatically; an address is only sent when you click.
• Links are not stored. No accounts, cookies or ads.
• Privacy policy: https://kanca.salihdinckan.com/privacy

Open source: https://github.com/salihdinckann/kanca
Website: https://kanca.salihdinckan.com
```

### Graphics
| Field | File |
|---|---|
| Store icon (128×128) | `extension/icons/128.png` |
| Screenshots (1280×800) | `shot1.png`, `shot2.png`, `shot3.png`, `shot4.png` |
| Small promo tile (440×280) | `tile.png` |
| Marquee promo tile (1400×560) | `marquee.png` |

**Homepage URL:** https://kanca.salihdinckan.com
**Support URL:** https://github.com/salihdinckann/kanca/issues

## Privacy practices tab

**Single purpose:**
```
Checks a web page or link the user chooses for phishing risk and shows a risk score with the reasons.
```

**Permission justifications:**
- `activeTab`:
  ```
  Reads the address of the current tab only when the user clicks the extension icon, so that page can be scanned.
  ```
- `contextMenus`:
  ```
  Adds a "Scan link with Kanca" item to the right-click menu on links, so a link can be checked before it is opened.
  ```
- `storage`:
  ```
  Remembers the user's language choice (Turkish or English) on the device.
  ```
- Host permission `https://api.salihdinckan.com/*`:
  ```
  Sends the link the user chose to Kanca's own scanning API and receives the risk result. No other site is accessed.
  ```

**Remote code:** No, I am not using remote code.

**Data usage — what is collected:** tick **Web history** only (the address of the page or link the user asks to scan). Leave everything else unticked.

**Certifications:** tick all three:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** https://kanca.salihdinckan.com/privacy
