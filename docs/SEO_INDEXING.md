# SEO a Automatické Indexování

## 🔄 Jak funguje automatické indexování nových článků

### **1. Dynamická Sitemap**
- **Sitemap se generuje dynamicky** z Firebase článků
- **Cache: 5 minut** - nové články se objeví do 5 minut
- **URL**: `https://hotnewstrends.com/sitemap.xml`
- **Obsahuje**: Všechny publikované články + statické stránky + kategorie

### **2. Automatické notifikace**
Při vytvoření nového článku se **automaticky** spustí:

```typescript
// Ping Google a Bing o nové sitemap
POST /api/sitemap/ping
{
  "articleSlug": "new-article-slug",
  "action": "new"
}
```

**Kde se spouští:**
- ✅ `automated-article-generator.ts` - AI generované články
- ✅ `automation.ts` - Automatické články
- ✅ `api/articles/route.ts` - Manuálně vytvořené články

### **3. Search Engine Notifications**

#### **Google**
- **Sitemap ping**: `https://www.google.com/ping?sitemap=...`
- **IndexNow API**: Rychlé indexování jednotlivých URL (pokud je nastaven API klíč)

#### **Bing**
- **Sitemap ping**: `https://www.bing.com/ping?sitemap=...`

## 📊 Monitoring a testování

### **API Endpointy pro testování:**

1. **`GET /api/sitemap`** - Test generování sitemap
2. **`GET /api/seo/check?url=/article/slug`** - SEO kontrola článku
3. **`GET /api/seo/audit`** - Kompletní SEO audit
4. **`POST /api/sitemap/refresh`** - Manuální refresh sitemap
5. **`POST /api/sitemap/ping`** - Manuální ping search engines

### **Příklad použití:**
```bash
# Test sitemap
curl https://hotnewstrends.com/api/sitemap

# SEO kontrola článku
curl "https://hotnewstrends.com/api/seo/check?url=/article/my-article"

# Kompletní audit
curl https://hotnewstrends.com/api/seo/audit

# Manuální refresh
curl -X POST https://hotnewstrends.com/api/sitemap/refresh
```

## ⚡ Rychlost indexování

### **Očekávané časy:**
- **Sitemap update**: 5 minut (cache)
- **Google notification**: Okamžitě po vytvoření článku
- **Google indexování**: 1-24 hodin (závisí na autoritě webu)
- **Bing indexování**: 2-48 hodin

### **Pro rychlejší indexování:**
1. **Pravidelně publikujte** kvalitní obsah
2. **Používejte internal linking** mezi články
3. **Sdílejte na sociálních sítích**
4. **Nastavte Google Search Console** pro monitoring

## 🛠️ Konfigurace

### **Environment Variables:**
```env
# Základní URL webu
NEXT_PUBLIC_SITE_URL=https://hotnewstrends.com

# IndexNow API klíč (volitelné, pro rychlejší indexování)
GOOGLE_INDEXNOW_KEY=your-indexnow-key
```

### **Google Search Console:**
1. Přidejte sitemap: `https://hotnewstrends.com/sitemap.xml`
2. Sledujte indexování v "Coverage" reportu
3. Používejte "URL Inspection" pro testování jednotlivých článků

## 🔍 Troubleshooting

### **Články se neindexují:**
1. Zkontrolujte sitemap: `/sitemap.xml`
2. Otestujte SEO: `/api/seo/check?url=/article/slug`
3. Spusťte audit: `/api/seo/audit`
4. Zkontrolujte Google Search Console

### **Sitemap je prázdná:**
1. Zkontrolujte Firebase připojení
2. Ověřte, že články mají `status: 'published'`
3. Otestujte API: `/api/articles`

### **Search engines neodpovídají:**
1. Zkontrolujte network connectivity
2. Ověřte správnost sitemap URL
3. Zkontrolujte rate limiting

## 📈 Optimalizace pro lepší indexování

### **SEO Best Practices:**
- ✅ Unikátní title (30-60 znaků)
- ✅ Meta description (120-160 znaků)
- ✅ Canonical URL
- ✅ Structured data (JSON-LD)
- ✅ Internal linking
- ✅ Mobile-friendly design
- ✅ Fast loading times

### **Content Strategy:**
- 📝 Pravidelné publikování (denně)
- 🎯 Trending topics
- 🔗 Související články
- 📱 Social media sharing
- 🏷️ Relevantní tagy a kategorie
