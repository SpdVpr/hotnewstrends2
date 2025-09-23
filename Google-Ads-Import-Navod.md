# 🚀 Google Ads Kampaň Import - Návod

## 📋 Přehled kampaně

**Název kampaně:** HotNewsTrends - Trending Topics  
**Typ:** Search Campaign  
**Denní rozpočet:** $50 USD  
**Cílení:** Anglicky mluvící země (US, CA, AU, UK, IE, NZ)  
**Klíčová slova:** 50 optimalizovaných klíčových slov  
**Ad Groups:** 8 tematických skupin  

## 📁 Soubory pro import

1. **`google-ads-campaign-import.csv`** - Klíčová slova a struktura kampaně
2. **`google-ads-text-ads-import.csv`** - Reklamní texty
3. **`google-ads-campaign-settings.csv`** - Nastavení kampaně a rozpočtu

## 🔧 Postup importu v Google Ads Editor

### Krok 1: Stažení a instalace
1. Stáhněte **Google Ads Editor** z: https://ads.google.com/home/tools/ads-editor/
2. Nainstalujte a přihlaste se ke svému Google Ads účtu
3. Stáhněte aktuální data z vašeho účtu

### Krok 2: Import kampaně
1. V Google Ads Editor klikněte na **"Import"** → **"Import from file"**
2. Vyberte soubor `google-ads-campaign-import.csv`
3. Zkontrolujte mapování sloupců:
   - Campaign → Campaign
   - Ad Group → Ad Group  
   - Keyword → Keyword
   - Match Type → Match Type
   - Max CPC → Max CPC
   - Final URL → Final URL

### Krok 3: Import reklamních textů
1. Klikněte znovu na **"Import"** → **"Import from file"**
2. Vyberte soubor `google-ads-text-ads-import.csv`
3. Zkontrolujte mapování pro reklamní texty

### Krok 4: Nastavení kampaně
1. Importujte `google-ads-campaign-settings.csv` pro základní nastavení
2. Nebo nastavte manuálně:
   - **Rozpočet:** $50/den
   - **Bidding:** Manual CPC s Enhanced CPC
   - **Lokace:** US, CA, AU, UK, IE, NZ
   - **Jazyk:** English

### Krok 5: Kontrola a úpravy
1. Zkontrolujte všechny importované položky
2. Upravte CPC stawky podle potřeby
3. Zkontrolujte reklamní texty
4. Ověřte cílení a nastavení

### Krok 6: Nahrání do Google Ads
1. Klikněte na **"Post"** pro nahrání změn
2. Zkontrolujte náhled změn
3. Potvrďte nahrání

## 📊 Struktura kampaně

### Ad Groups a klíčová slova:

**1. Breaking News** (10 klíčových slov)
- trending news, breaking news, hot news, latest news, news today
- CPC: $0.30 - $0.50

**2. AI & Tech News** (6 klíčových slov)  
- AI news, artificial intelligence news, tech news, technology updates
- CPC: $0.50 - $0.70

**3. Sports News** (7 klíčových slov)
- sports news + aktuální sportovní zápasy z vašich trendů
- CPC: $0.45 - $0.75

**4. Entertainment** (4 klíčová slova)
- entertainment news, celebrity news + trending celebrity jména
- CPC: $0.38 - $0.60

**5. Long-tail Keywords** (8 klíčových slov)
- "what's trending today", "latest trending topics", atd.
- CPC: $0.36 - $0.52

**6. Mobile & Accessibility** (5 klíčových slov)
- mobile news, news app, online news, digital news
- CPC: $0.32 - $0.45

**7. News Aggregation** (8 klíčových slov)
- news aggregator, trending stories, viral content
- CPC: $0.38 - $0.55

**8. Trending Current Events** (2 klíčová slova)
- Aktuální trending témata z vašeho systému
- CPC: $0.60 - $0.65

## 💡 Optimalizační tipy

### Po spuštění kampaně:
1. **Sledujte výkon první týden** - upravte CPC podle CTR
2. **Přidejte negativní klíčová slova** pro irelevantní dotazy
3. **Testujte různé reklamní texty** - A/B testování
4. **Sledujte Quality Score** - optimalizujte landing pages
5. **Upravte cílení** podle výkonu v různých zemích

### Automatizace (pro budoucnost):
- Propojte s Google Ads API pro dynamické klíčové slova
- Automaticky přidávejte trending témata jako klíčová slova
- Sledujte ROI a automaticky upravujte CPC

## 📈 Očekávané výsledky

**Měsíční odhady:**
- **Rozpočet:** $1,500 USD
- **Kliky:** 3,000 - 5,000
- **Impressions:** 150,000 - 300,000
- **Průměrný CPC:** $0.30 - $0.50
- **CTR:** 2% - 4%

## 🔧 Řešení problémů

**Pokud import nefunguje:**
1. Zkontrolujte formát CSV (UTF-8 encoding)
2. Ověřte, že všechny povinné sloupce jsou vyplněné
3. Zkontrolujte, že URL jsou validní
4. Ujistěte se, že CPC hodnoty jsou v správném formátu

**Kontakt pro podporu:**
- Google Ads Help: https://support.google.com/google-ads
- Google Ads Editor Help: https://support.google.com/google-ads/editor

---

**✅ Po úspěšném importu bude kampaň připravena ke spuštění!**

Doporučuji začít s nižším rozpočtem ($20-30/den) pro testování a postupně navyšovat podle výkonu.
