# Firebase Credentials Testing

Tento návod vám pomůže otestovat Firebase credentials lokálně před nasazením na produkci.

## 🚀 Rychlé testování

### 1. Základní test (nejrychlejší)
```bash
npm run test:firebase:quick
```
**Co testuje:**
- ✅ Existence `FIREBASE_SERVICE_ACCOUNT_KEY` v `.env.local`
- ✅ Validní JSON formát
- ✅ Přítomnost povinných polí
- ✅ Správný formát private key

**Čas:** ~1 sekunda

### 2. Kompletní test
```bash
npm run test:firebase
```
**Co testuje:**
- ✅ Vše z rychlého testu
- ✅ Firebase Admin inicializace
- ✅ Firestore připojení
- ✅ Read/Write operace
- ✅ Service status operace (simulace skutečného použití)

**Čas:** ~5-10 sekund

### 3. Production simulace
```bash
npm run test:firebase:production
```
**Co testuje:**
- ✅ Simulace production prostředí (`NODE_ENV=production`, `VERCEL=1`)
- ✅ Stejná logika jako v `automated-article-generator.ts`
- ✅ Retry mechanismus pro Firebase operace
- ✅ Fallback na localStorage při selhání

**Čas:** ~10-15 sekund

## 📋 Interpretace výsledků

### ✅ Úspěšný test
```
🎉 === VŠECHNY TESTY ÚSPĚŠNÉ ===
✅ Firebase credentials jsou správně nastavené
✅ Firestore připojení funguje
✅ Read/Write operace fungují
✅ Service status operace fungují

🚀 Můžete nasadit na produkci!
```

### ❌ Chyby a jejich řešení

#### 1. `FIREBASE_SERVICE_ACCOUNT_KEY chybí`
**Problém:** Environment variable není nastavená
**Řešení:** 
- Zkontrolujte `.env.local` soubor
- Ujistěte se, že obsahuje řádek: `FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}`

#### 2. `JSON parsing error`
**Problém:** Nevalidní JSON formát
**Řešení:**
- Zkontrolujte, že JSON je na jednom řádku
- Ujistěte se, že všechny uvozovky jsou správně escapované
- Zkopírujte JSON znovu z Firebase Console

#### 3. `Chybí povinná pole`
**Problém:** JSON neobsahuje všechna potřebná pole
**Řešení:**
- Stáhněte nový service account key z Firebase Console
- Ujistěte se, že používáte kompletní JSON, ne jen private key

#### 4. `PERMISSION_DENIED`
**Problém:** Service account nemá správná oprávnění
**Řešení:**
- V Firebase Console → Project Settings → Service Accounts
- Ujistěte se, že service account má roli "Firebase Admin SDK Administrator Service Agent"
- Zkontrolujte Firestore Security Rules

#### 5. `Firebase initialization failed`
**Problém:** Chyba při inicializaci Firebase Admin SDK
**Řešení:**
- Zkontrolujte project_id v JSON
- Ujistěte se, že Firebase projekt existuje
- Ověřte, že service account patří ke správnému projektu

## 🔧 Manuální kontrola

Pokud testy selhávají, můžete manuálně zkontrolovat:

### 1. Kontrola .env.local
```bash
# Zkontrolujte, že soubor existuje
ls -la .env.local

# Zkontrolujte obsah (bez zobrazení citlivých dat)
grep "FIREBASE_SERVICE_ACCOUNT_KEY" .env.local | wc -c
```

### 2. Kontrola JSON formátu
```bash
# Extrahujte JSON a zkontrolujte formát
node -e "
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(.+)/);
if (match) {
  try {
    const json = JSON.parse(match[1]);
    console.log('✅ JSON je validní');
    console.log('Project ID:', json.project_id);
    console.log('Client Email:', json.client_email);
  } catch (e) {
    console.log('❌ JSON error:', e.message);
  }
} else {
  console.log('❌ FIREBASE_SERVICE_ACCOUNT_KEY nenalezena');
}
"
```

## 🚀 Po úspěšném testu

Když všechny testy projdou:

1. **Zkopírujte environment variables do Vercel:**
   - Jděte do Vercel Dashboard → Settings → Environment Variables
   - Přidejte všechny variables z `.env.local`
   - Nastavte Environment na `Production`

2. **Redeploy projekt:**
   - V Vercel Dashboard → Deployments → Redeploy

3. **Otestujte produkci:**
   ```bash
   # Test API endpoint
   curl https://www.hotnewstrends.com/api/automation
   
   # Mělo by vrátit isRunning: false (místo Firebase error)
   ```

## 📞 Podpora

Pokud testy stále selhávají:

1. **Spusťte debug verzi:**
   ```bash
   DEBUG=* npm run test:firebase
   ```

2. **Zkontrolujte Firebase Console:**
   - Project Settings → Service Accounts
   - Firestore → Data (zkontrolujte, že můžete číst/psát)

3. **Zkontrolujte network připojení:**
   ```bash
   ping firestore.googleapis.com
   ```

## 🔒 Bezpečnost

- ⚠️ **Nikdy nesdílejte obsah `.env.local`**
- ⚠️ **Service account key je citlivý údaj**
- ⚠️ **Používejte pouze pro development/testing**
- ✅ **V produkci používejte Vercel Environment Variables**
