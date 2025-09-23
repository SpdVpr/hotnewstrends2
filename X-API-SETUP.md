# X (Twitter) API Integration Setup

## Přehled

Tato integrace umožňuje automatické sdílení článků na X (Twitter) s respektováním limitů free účtu.

## Limity Free Účtu

- **17 postů za 24 hodin** (PER USER i PER APP)
- Naše strategie: **4 posty denně** (bezpečná rezerva)
- Automatické sledování denních limitů

## Nastavení X API

### 1. Získání API klíčů

1. Jděte na [developer.x.com](https://developer.x.com)
2. Vytvořte nový projekt/aplikaci
3. Získejte tyto klíče:
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)
   - Access Token
   - Access Token Secret

### 2. Konfigurace prostředí

Přidejte do `.env` souboru:

```env
# X (Twitter) API Configuration
X_API_KEY=your_api_key_here
X_API_SECRET=your_api_secret_here
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

### 3. Testování integrace

```bash
# Test základního API připojení
node test-x-api.js

# Test kompletní integrace
node test-x-integration.js

# Spuštění automation služby
npm run x-automation:start
```

## Funkce

### Automatické sdílení

- **Výběr článků**: Automaticky vybírá nepublikované články
- **Formátování**: Optimalizuje text pro X (280 znaků)
- **Hashtags**: Automaticky generuje relevantní hashtags
- **Rate limiting**: Respektuje API limity

### Formát tweetu

```
[Název článku]

[URL článku]

#kategorie #news #trending #tag1
```

### Sledování statistik

- Denní počet sdílení
- Zbývající limity
- Celkové statistiky
- Logy všech pokusů

## API Endpointy

### POST /api/x-share
Spustí automatické sdílení článků

**Response:**
```json
{
  "success": true,
  "articlesShared": 2,
  "errors": [],
  "rateLimitHit": false
}
```

### GET /api/x-share
Získá statistiky sdílení

**Response:**
```json
{
  "success": true,
  "stats": {
    "todayShares": 2,
    "remainingShares": 2,
    "totalShares": 15
  }
}
```

### GET /api/x-test
Testuje připojení k X API

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "123456789",
    "name": "HotNewsTrends",
    "username": "hotnewstrends"
  }
}
```

## Admin rozhraní

Přístup přes: `/admin` → záložka "🐦 X Share"

### Funkce admin rozhraní:

1. **Test připojení** - Ověří API klíče
2. **Statistiky** - Zobrazí denní/celkové statistiky
3. **Manuální sdílení** - Spustí sdílení na požádání
4. **Monitoring** - Sleduje výsledky sdílení

## Databázové kolekce

### articles
Přidaná pole:
- `xShared: boolean` - Zda byl článek sdílen
- `xSharedAt: Timestamp` - Kdy byl sdílen
- `xTweetId: string` - ID tweetu

### x_share_logs
Logy všech pokusů o sdílení:
```javascript
{
  articleId: string,
  articleTitle: string,
  tweetId?: string,
  success: boolean,
  error?: string,
  sharedAt: Timestamp
}
```

## Strategie růstu účtu

### 1. Kvalitní obsah
- Sdílejte pouze nejlepší články
- Zajímavé titulky
- Aktuální témata

### 2. Optimální timing
- 4 posty denně v různých časech
- Sledujte engagement analytics
- Přizpůsobte timing podle audience

### 3. Hashtag strategie
- Kombinace obecných (#news, #trending) a specifických tagů
- Maximálně 4 hashtagy na tweet
- Kategorie-specifické tagy

### 4. Interakce
- Odpovídejte na komentáře
- Retweetujte relevantní obsah
- Sledujte podobné účty

## Monitoring a údržba

### Denní kontrola
- Zkontrolujte statistiky v admin rozhraní
- Ověřte, že se články sdílejí správně
- Sledujte error logy

### Týdenní analýza
- Analyzujte engagement metriky
- Upravte timing podle výsledků
- Optimalizujte hashtag strategii

### Měsíční vyhodnocení
- Zvažte upgrade na Basic plán ($200/měsíc)
- Analyzujte ROI z X trafficu
- Upravte content strategii

## Troubleshooting

### Časté problémy

1. **401 Unauthorized**
   - Zkontrolujte API klíče
   - Ověřte permissions aplikace

2. **429 Rate Limited**
   - Počkejte na reset limitu
   - Zkontrolujte denní počet postů

3. **Články se nesdílejí**
   - Zkontrolujte `status: 'published'`
   - Ověřte, že `xShared !== true`

### Debug příkazy

```bash
# Test API připojení
node test-x-api.js

# Kontrola článků k sdílení
node -e "
const { db } = require('./src/lib/firebase');
const { collection, query, where, getDocs } = require('firebase/firestore');
(async () => {
  const q = query(
    collection(db, 'articles'),
    where('status', '==', 'published'),
    where('xShared', '!=', true)
  );
  const snapshot = await getDocs(q);
  console.log('Articles to share:', snapshot.size);
})();
"
```

## Bezpečnost

- API klíče jsou pouze server-side
- Logy neobsahují citlivé informace
- Rate limiting chrání před překročením limitů
- Všechny akce jsou logovány pro audit

## Budoucí vylepšení

1. **Scheduling** - Naplánované posty v optimálních časech
2. **A/B Testing** - Testování různých formátů tweetů
3. **Analytics** - Detailní metriky engagement
4. **Auto-reply** - Automatické odpovědi na komentáře
5. **Thread support** - Dlouhé články jako Twitter threads
