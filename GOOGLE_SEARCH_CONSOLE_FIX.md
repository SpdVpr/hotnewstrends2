# Google Search Console - Fix pro duplicitní stránky

## Problém

Google Search Console hlásil chybu: **"Duplicitní stránka bez kanonické verze vybrané uživatelem"** pro následující typy URL:

- `https://www.hotnewstrends.com/articles?tag=xyz`
- `https://www.hotnewstrends.com/search?q=xyz`
- Další stránky s query parametry

### Příčina problému

Stránky s query parametry (`?tag=`, `?q=`, `?category=`) byly indexovány jako samostatné stránky bez canonical URL, což vedlo k:

1. **Duplicitnímu obsahu** - Google nevěděl, která verze stránky je hlavní
2. **Problémům s indexací** - Stránky nebyly indexovány
3. **Ztrátě SEO hodnoty** - Duplicitní stránky dilutují page rank

## Řešení

### 1. Přidána komponenta `CanonicalURL`

Vytvořena nová komponenta `src/components/CanonicalURL.tsx`, která:

- **Dynamicky přidává canonical link tag** do `<head>`
- **Řídí robotí meta tag** (noindex/index) podle query parametrů
- **Automaticky odstraňuje předchozí canonical tagy**

#### Použití:

```tsx
import { CanonicalURL } from '@/components/CanonicalURL';

// Pro stránky, kde parametry by neměly být indexovány
<CanonicalURL noindexParams />

// Pro stránky, kde parametry jsou součástí canonical URL
<CanonicalURL includeParams />

// Pro běžné stránky bez parametrů
<CanonicalURL />
```

### 2. Aktualizace stránek

#### `/articles` stránka

**Soubor:** `src/app/articles/page.tsx`

- Přidána `CanonicalURL` komponenta s `noindexParams`
- Vytvořen layout s metadata (`src/app/articles/layout.tsx`)
- Canonical URL vždy ukazuje na `/articles` (bez parametrů)
- Stránky s `?tag=` nebo `?category=` mají `noindex, follow`

**Výsledek:**
- ✅ `/articles` → indexovaná (canonical)
- ❌ `/articles?tag=xyz` → neindexovaná, canonical → `/articles`
- ❌ `/articles?category=tech` → neindexovaná, canonical → `/articles`

#### `/search` stránka

**Soubor:** `src/app/search/page.tsx`

- Přidána `CanonicalURL` komponenta s `noindexParams`
- Vytvořen layout s metadata (`src/app/search/layout.tsx`)
- Všechny vyhledávací stránky s parametry mají `noindex, follow`

**Výsledek:**
- ✅ `/search` → indexovaná (canonical)
- ❌ `/search?q=anything` → neindexovaná, canonical → `/search`

#### `/article/[slug]` stránka

**Soubor:** `src/app/article/[slug]/page.tsx`

- Aktualizována `generateMetadata` funkce
- Přidán `alternates.canonical` s plnou URL
- Přidány Open Graph a Twitter meta tagy s obrázky
- Explicitní `robots` meta tag pro indexaci

**Výsledek:**
- ✅ Každý článek má unikátní canonical URL
- ✅ Správné Open Graph tagy s obrázky
- ✅ Optimalizované pro sociální sítě

### 3. Metadata layouts

Vytvořeny layout soubory s metadata:

- `src/app/articles/layout.tsx` - Metadata pro articles stránku
- `src/app/search/layout.tsx` - Metadata pro search stránku

## Jak to funguje

### Bez query parametrů

```
URL: https://www.hotnewstrends.com/articles
Canonical: https://www.hotnewstrends.com/articles
Robots: index, follow
→ Stránka je indexována ✅
```

### S query parametry

```
URL: https://www.hotnewstrends.com/articles?tag=technology
Canonical: https://www.hotnewstrends.com/articles
Robots: noindex, follow
→ Stránka není indexována, ale odkazy jsou sledovány ✅
```

## Co očekávat v Google Search Console

Po nasazení změn:

1. **První týden:** Google začne re-crawlovat stránky
2. **2-4 týdny:** Počet chyb "Duplicitní stránka" klesne
3. **1-2 měsíce:** Všechny stránky by měly být správně indexovány

### Monitoring

Sledujte v Google Search Console:

- **Pokrytí indexu** → Měl by růst počet indexovaných stránek
- **Vyloučené stránky** → Stránky s parametry by měly mít "Vyloučeno pomocí značky 'noindex'"
- **Canonical URL** → Všechny stránky by měly mít definovanou canonical verzi

## Tipy pro budoucnost

### Při vytváření nových stránek s parametry:

1. **Vždy použijte `CanonicalURL` komponentu**
2. **Rozhodněte se:**
   - `noindexParams` - pokud parametry vytvářejí filtrované verze (tag, search)
   - `includeParams` - pokud parametry jsou součástí unikátního obsahu (page=2)
3. **Přidejte metadata do layout souboru**

### Best practices:

- ✅ Jedna hlavní verze stránky s canonical URL
- ✅ Filtrované/vyhledávací stránky s `noindex, follow`
- ✅ Paginated stránky s `rel="prev"` a `rel="next"` (budoucí implementace)
- ✅ Všechny stránky mají explicitní canonical URL
- ❌ Nikdy nenechávejte stránky bez canonical URL
- ❌ Nevytvářejte více verzí stejného obsahu bez canonical

## Testování

### Lokální test:

1. Spusťte development server: `npm run dev`
2. Otevřete stránku v prohlížeči
3. Zkontrolujte `<head>` v DevTools:

```html
<!-- Mělo by být vidět: -->
<link rel="canonical" href="https://www.hotnewstrends.com/articles" />
<meta name="robots" content="noindex, follow" />
```

### Production test:

1. Nasaďte na production
2. Použijte [Google Rich Results Test](https://search.google.com/test/rich-results)
3. Použijte [URL Inspection Tool](https://search.google.com/search-console) v GSC
4. Zkontrolujte, zda canonical URL je správně detekována

## Další kroky

### Okamžité:
- ✅ Deploy na production
- ✅ Zkontrolovat v prohlížeči, zda canonical tagy fungují
- ✅ Použít Google Search Console URL Inspection Tool

### V příštích týdnech:
- 📊 Sledovat pokrytí indexu v GSC
- 📊 Sledovat snížení chyb "Duplicitní stránka"
- 📈 Sledovat nárůst organického trafficu

### Budoucí vylepšení:
- 🔄 Implementovat pagination s `rel="prev"` a `rel="next"`
- 🔄 Přidat XML sitemap s prioritami
- 🔄 Implementovat structured data pro všechny typy stránek

## Kontakt a podpora

Pokud se objeví další problémy s indexací:

1. Zkontrolujte Google Search Console → Pokrytí
2. Použijte URL Inspection Tool na konkrétní URL
3. Zkontrolujte `view-source:` v prohlížeči pro canonical tag
4. Zkontrolujte Network tab v DevTools pro server response headers

---

**Datum implementace:** 24. října 2025  
**Verze:** 1.0  
**Status:** ✅ Implementováno a připraveno k nasazení