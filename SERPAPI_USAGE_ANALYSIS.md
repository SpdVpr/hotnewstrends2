# SerpAPI Usage Analysis & Optimization

## 🔍 Problém
Dashboard ukazuje **9-10 volání denně** místo očekávaných 7 volání z cron jobů.

## 📊 Analýza zdrojů volání

### 1. **Schedulované cron joby** (Hlavní zdroj)
**Soubor:** `vercel.json`
- **PŘED:** 7 aktualizací denně (07:00, 09:20, 11:40, 14:00, 16:20, 18:40, 21:00 UTC)
- **PO ZMĚNĚ:** 3 aktualizace denně (08:00, 14:00, 20:00 UTC)
- **Volání:** 1 SerpAPI volání na aktualizaci
- **Úspora:** 4 volání denně = **~120 volání měsíčně**

### 2. **`/api/trends/details` GET endpoint** (Skrytý zdroj!)
**Soubor:** `src/app/api/trends/details/route.ts`
- **PROBLÉM:** Volal `googleTrendsService.getDailyTrends()` → 1 SerpAPI volání
- **OPRAVENO:** Nyní používá Firebase cache místo přímého volání SerpAPI
- **Kdy se volá:** 
  - Z frontendu při zobrazení detailů trendu
  - Z automatizace při generování článků
  - Z admin panelu při refresh

### 3. **`/api/trends/details` POST endpoint** (Zakázáno)
**Soubor:** `src/app/api/trends/details/route.ts`
- **Status:** Vrací mock data, nevolá SerpAPI ✅
- **Původně:** 2 SerpAPI volání (getInterestOverTime + getRelatedQueries)

### 4. **`/api/trends` GET endpoint** (Bezpečný)
**Soubor:** `src/app/api/trends/route.ts`
- **Status:** Používá Firebase cache ✅
- **Nevolá SerpAPI přímo**

### 5. **`/api/force-trends-update`** (Zakázáno)
**Soubor:** `src/app/api/force-trends-update/route.ts`
- **Status:** Endpoint zakázán, vrací 403 ✅

## ✅ Provedené změny

### 1. Snížení cron aktualizací (vercel.json)
```json
// PŘED: 7 aktualizací denně
"crons": [
  { "path": "/api/cron/trends-import", "schedule": "0 7 * * *" },
  { "path": "/api/cron/trends-import", "schedule": "20 9 * * *" },
  { "path": "/api/cron/trends-import", "schedule": "40 11 * * *" },
  { "path": "/api/cron/trends-import", "schedule": "0 14 * * *" },
  { "path": "/api/cron/trends-import", "schedule": "20 16 * * *" },
  { "path": "/api/cron/trends-import", "schedule": "40 18 * * *" },
  { "path": "/api/cron/trends-import", "schedule": "0 21 * * *" }
]

// PO: 3 aktualizace denně
"crons": [
  { "path": "/api/cron/trends-import", "schedule": "0 8 * * *" },   // 09:00 Praha
  { "path": "/api/cron/trends-import", "schedule": "0 14 * * *" },  // 15:00 Praha
  { "path": "/api/cron/trends-import", "schedule": "0 20 * * *" }   // 21:00 Praha
]
```

### 2. Oprava `/api/trends/details` GET (KRITICKÁ ZMĚNA)
```typescript
// PŘED: Volal SerpAPI přímo
trends = await googleTrendsService.getDailyTrends(region);

// PO: Používá Firebase cache
const { firebaseTrendsService } = await import('@/lib/services/firebase-trends');
const cachedTrends = await firebaseTrendsService.getLatestTrends(limit * 2);
```

### 3. Aktualizace trends-scheduler.ts
- `UPDATES_PER_DAY`: 6 → 3
- `UPDATE_INTERVAL`: ~2.67h → ~5.33h
- Minimální interval mezi aktualizacemi: 2h → 5h

### 4. Aktualizace dokumentace a zpráv
- `src/app/api/trends/scheduler/route.ts` - "3x daily updates"
- `src/app/api/cron/trends-import/route.ts` - "3x daily"
- `src/app/api/trends-tracking-status/route.ts` - rozvrh 3 aktualizací
- `src/app/api/check-scheduler-status/route.ts` - očekávaný rozvrh

## 📈 Očekávaný dopad

### Před optimalizací:
- **Cron joby:** 7 volání/den = 210 volání/měsíc
- **`/api/trends/details` GET:** ~2-3 volání/den = 60-90 volání/měsíc
- **CELKEM:** ~270-300 volání/měsíc ❌ (nad limitem 250)

### Po optimalizaci:
- **Cron joby:** 3 volání/den = 90 volání/měsíc
- **`/api/trends/details` GET:** 0 volání (používá cache) ✅
- **CELKEM:** ~90 volání/měsíc ✅ (64% pod limitem)

### Úspora:
- **Denně:** 6-7 volání → 3 volání = **snížení o 50-57%**
- **Měsíčně:** ~180-210 volání ušetřeno
- **Rezerva:** 160 volání pro nepředvídané situace

## 🔍 Monitoring

### Jak sledovat využití:
1. **Admin Dashboard:** `/admin` → "🔍 SerpApi Monitor"
2. **API Endpoint:** `GET /api/serpapi-usage`
3. **Logs:** `GET /api/serpapi-logs`

### Co sledovat:
- Denní využití (cíl: max 3-4 volání)
- Měsíční využití (cíl: pod 150 volání)
- Zdroje volání (endpoint breakdown)
- Chybovost (success rate)

## 🚨 Doporučení

### 1. Okamžitá akce:
- ✅ Deploy změn do produkce
- ✅ Sledovat dashboard 24-48 hodin
- ✅ Ověřit, že volání klesla na 3/den

### 2. Pokud stále vidíte více než 3 volání denně:
```bash
# Zkontrolujte logy
curl https://hotnewstrends.com/api/serpapi-logs

# Hledejte neočekávané endpointy
```

### 3. Dlouhodobé sledování:
- Týdenní kontrola využití
- Měsíční review trendů
- Optimalizace cache strategie

## 📝 Další možnosti optimalizace (pokud potřeba)

### Pokud 3x denně je stále moc:
1. **2x denně:** 08:00 a 20:00 UTC (ráno a večer)
2. **1x denně:** 14:00 UTC (odpoledne)

### Prodloužení cache:
```typescript
// src/app/api/trends/route.ts
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hodiny místo 3.5h
```

### Vypnutí víkendových aktualizací:
```typescript
// src/lib/services/trends-scheduler.ts
private shouldUpdateNow(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Skip weekends (0 = Sunday, 6 = Saturday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  // ... rest of logic
}
```

## 🎯 Závěr

Hlavní problém byl **skrytý endpoint `/api/trends/details` GET**, který volal SerpAPI přímo místo použití Firebase cache. Tento endpoint se mohl volat několikrát denně z frontendu nebo automatizace, což způsobovalo překročení očekávaného počtu volání.

**Kombinace obou oprav:**
1. Snížení cron jobů z 7 na 3 denně
2. Oprava `/api/trends/details` GET na použití cache

**Měla by snížit využití z ~9-10 volání denně na ~3 volání denně**, což je **snížení o 60-70%**.

