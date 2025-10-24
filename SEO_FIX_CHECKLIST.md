# ✅ SEO Fix Checklist - Duplicitní stránky

## 🎯 Cíl
Opravit Google Search Console chybu: "Duplicitní stránka bez kanonické verze vybrané uživatelem"

## 📋 Implementované změny

### ✅ Krok 1: Nová komponenta CanonicalURL
- [x] Vytvořena `src/components/CanonicalURL.tsx`
- [x] Podporuje dynamické canonical URL
- [x] Podporuje noindex pro parametrizované stránky
- [x] Automatické čištění předchozích canonical tagů

### ✅ Krok 2: Aktualizace /articles stránky
- [x] Přidána `CanonicalURL` komponenta s `noindexParams`
- [x] Vytvořen `src/app/articles/layout.tsx` s metadata
- [x] Canonical URL: `https://www.hotnewstrends.com/articles`
- [x] Stránky s `?tag=` mají noindex, follow

### ✅ Krok 3: Aktualizace /search stránky
- [x] Přidána `CanonicalURL` komponenta s `noindexParams`
- [x] Vytvořen `src/app/search/layout.tsx` s metadata
- [x] Canonical URL: `https://www.hotnewstrends.com/search`
- [x] Vyhledávací stránky s `?q=` mají noindex, follow

### ✅ Krok 4: Aktualizace /article/[slug]
- [x] Přidán `alternates.canonical` do metadata
- [x] Přidány Open Graph URL a obrázky
- [x] Přidány Twitter card meta tagy
- [x] Explicitní robots meta tag pro indexaci

### ✅ Krok 5: Dokumentace
- [x] Vytvořen `GOOGLE_SEARCH_CONSOLE_FIX.md`
- [x] Vytvořen tento checklist

## 🚀 Deployment checklist

### Před deploymentem:

- [ ] Build projek lokálně: `npm run build`
- [ ] Zkontrolovat, že build proběhl bez chyb
- [ ] Zkontrolovat warnings v konzoli
- [ ] Test v prohlížeči lokálně

```powershell
npm run build
npm start
```

### Po buildu - kontrola v prohlížeči:

**Test 1: /articles stránka**
- [ ] Otevřít: http://localhost:3000/articles
- [ ] View Page Source (Ctrl+U)
- [ ] Najít: `<link rel="canonical" href="https://www.hotnewstrends.com/articles" />`
- [ ] Zkontrolovat metadata v `<head>`

**Test 2: /articles?tag=technology**
- [ ] Otevřít: http://localhost:3000/articles?tag=technology
- [ ] F12 → Elements → `<head>`
- [ ] Najít: `<link rel="canonical" href="https://www.hotnewstrends.com/articles" />`
- [ ] Najít: `<meta name="robots" content="noindex, follow" />`

**Test 3: /search?q=test**
- [ ] Otevřít: http://localhost:3000/search?q=test
- [ ] F12 → Elements → `<head>`
- [ ] Najít: `<link rel="canonical" href="https://www.hotnewstrends.com/search" />`
- [ ] Najít: `<meta name="robots" content="noindex, follow" />`

**Test 4: Článek**
- [ ] Otevřít jakýkoliv článek
- [ ] View Page Source
- [ ] Najít: `<link rel="canonical" href="https://www.hotnewstrends.com/article/[slug]" />`
- [ ] Zkontrolovat Open Graph tagy

### Deploy na production:

- [ ] Push do Git repository
- [ ] Trigger production deployment (Vercel/Netlify)
- [ ] Počkat na dokončení deploye
- [ ] Zkontrolovat build logy

```powershell
git add .
git commit -m "Fix: Add canonical URLs for duplicate pages - GSC fix"
git push origin main
```

## 🔍 Post-deployment testing

### Production kontrola (den 1):

**Test všech typů stránek:**

1. **Homepage**
   - [ ] URL: https://www.hotnewstrends.com
   - [ ] View Source → canonical tag přítomen

2. **Articles (bez parametrů)**
   - [ ] URL: https://www.hotnewstrends.com/articles
   - [ ] View Source → `<link rel="canonical" href="https://www.hotnewstrends.com/articles" />`
   - [ ] Robots: index, follow

3. **Articles s tagem**
   - [ ] URL: https://www.hotnewstrends.com/articles?tag=technology
   - [ ] F12 DevTools → canonical: `/articles`
   - [ ] Robots: noindex, follow

4. **Search bez parametrů**
   - [ ] URL: https://www.hotnewstrends.com/search
   - [ ] Canonical: `/search`
   - [ ] Robots: index, follow

5. **Search s dotazem**
   - [ ] URL: https://www.hotnewstrends.com/search?q=test
   - [ ] Canonical: `/search`
   - [ ] Robots: noindex, follow

6. **Jednotlivý článek**
   - [ ] URL: https://www.hotnewstrends.com/article/[nějaký-slug]
   - [ ] Canonical: `/article/[stejný-slug]`
   - [ ] Open Graph tagy přítomny

### Google nástroje (den 1-2):

1. **Google Rich Results Test**
   - [ ] Test homepage: https://search.google.com/test/rich-results
   - [ ] Test článku
   - [ ] Zkontrolovat structured data

2. **URL Inspection Tool (GSC)**
   - [ ] Otevřít: https://search.google.com/search-console
   - [ ] Inspect hlavní `/articles` URL
   - [ ] Zkontrolovat "User-declared canonical"
   - [ ] Request indexing (pokud je to nová verze)

3. **Mobile-Friendly Test**
   - [ ] Test: https://search.google.com/test/mobile-friendly
   - [ ] Zkontrolovat mobile rendering

### Request re-indexing (den 1-3):

V Google Search Console:

- [ ] `/articles` → Request indexing
- [ ] `/search` → Request indexing
- [ ] 5-10 hlavních článků → Request indexing
- [ ] Homepage → Request indexing

**Postup:**
1. URL Inspection Tool
2. Zadejte URL
3. Pokud je to nová verze, klikněte "Request indexing"
4. Počkejte 1-2 minuty
5. Opakujte pro další URL

## 📊 Monitoring (1-8 týdnů)

### Týden 1:
- [ ] Den 3: Zkontrolovat GSC → Coverage
- [ ] Den 5: Zkontrolovat počet chyb "Duplicate page"
- [ ] Den 7: Zkontrolovat počet indexovaných stránek

### Týden 2-4:
- [ ] Týdně kontrolovat GSC Coverage
- [ ] Sledovat trend snižování chyb
- [ ] Sledovat nárůst indexovaných stránek

### Co sledovat v GSC:

**Coverage Report:**
- Počet "Valid" stránek (měl by růst)
- Počet "Excluded" stránek (měl by klesat)
- Konkrétně: "Duplicate without user-selected canonical"

**Excluded pages:**
- Stránky s `?tag=` a `?q=` by měly být "Excluded by 'noindex' tag"
- To je správné chování ✅

**Performance:**
- Sledovat organic clicks (měly by růst)
- Sledovat impressions (měly by růst)
- Sledovat průměrnou pozici

## ⚠️ Co dělat, když něco nefunguje

### Canonical tag není vidět:

1. Zkontrolovat build: Je soubor správně deploynut?
2. Hard refresh v prohlížeči (Ctrl+Shift+R)
3. Zkontrolovat konzoli prohlížeče pro JavaScript errory
4. Zkontrolovat, že komponenta je správně importována

### GSC stále hlásí duplicate pages:

- **Normální:** Google potřebuje čas (2-4 týdny)
- **Akce:** Request re-indexing pro problematické URL
- **Kontrola:** URL Inspection → "View crawled page"

### Stránky nejsou indexované:

1. Zkontrolovat `robots.txt` - neblokuje crawling?
2. Zkontrolovat, že robots meta tag není "noindex" tam, kde nemá být
3. Použít URL Inspection Tool
4. Request indexing manuálně

## 📞 Podpora

### Dokumentace:
- `GOOGLE_SEARCH_CONSOLE_FIX.md` - Detailní dokumentace
- `SEO_FIX_CHECKLIST.md` - Tento checklist

### Google nástroje:
- [Google Search Console](https://search.google.com/search-console)
- [URL Inspection Tool](https://support.google.com/webmasters/answer/9012289)
- [Rich Results Test](https://search.google.com/test/rich-results)

### Debug:
- View Page Source (Ctrl+U)
- DevTools Elements tab
- DevTools Console tab
- Network tab pro server responses

---

**Status:** ✅ Ready for deployment  
**Estimated fix time:** 2-4 týdny po deploymentu  
**Last updated:** 24. října 2025