# Smart Trends Scheduler

## 📅 **Nový systém rozložení aktualizací**

### ⏰ **Časové rozložení**
- **Aktivní hodiny**: 6:00 - 22:00 (16 hodin)
- **Počet aktualizací**: 6x denně
- **Interval**: ~2.67 hodin mezi aktualizacemi
- **Minimální rozestup**: 2 hodiny mezi aktualizacemi

### 🎯 **Pevná pravidla**

#### Denní limity
- ✅ **Maximálně 6 aktualizací za den**
- ✅ **Žádné aktualizace mimo 6:00-22:00**
- ✅ **Automatický reset počítadla o půlnoci**

#### SerpAPI optimalizace
- ✅ **Respektuje denní limit 8 volání (všední dny) / 6 volání (víkendy)**
- ✅ **Integrováno s SerpApiMonitor**
- ✅ **Fallback na RSS feeds při dosažení limitu**

#### Firebase ukládání
- ✅ **Každá aktualizace = nový batch v Firebase**
- ✅ **Unique batchId pro každou aktualizaci**
- ✅ **Automatické čištění starých trendů (7 dní)**

## 🔄 **Jak to funguje**

### 1. **Generování článků - NOVÝ BATCH SYSTÉM**

#### **Po každé aktualizaci trendů:**
1. **Vybere 6 trendů** s nejvyšším search volume
2. **Vygeneruje 1. článek** okamžitě
3. **Naplánuje zbývajících 5** článků každých 10 minut

#### **Časový rozvrh generování:**
```typescript
// Po aktualizaci v 06:00
06:00 → 1. článek (okamžitě)
06:10 → 2. článek (10 min)
06:20 → 3. článek (20 min)
06:30 → 4. článek (30 min)
06:40 → 5. článek (40 min)
06:50 → 6. článek (50 min)
```

#### **Výhody batch systému:**
- ✅ **6 článků po každé aktualizaci** - konzistentní výstup
- ✅ **Postupné generování** - žádné přetížení systému
- ✅ **Prioritizace kvality** - pouze nejlepší trendy
- ✅ **Detailní monitoring** - real-time sledování fronty
- ✅ **Prediktabilní výkon** - 36 článků denně (6 aktualizací × 6 článků)

### 2. **Smart Timing**
```typescript
// Příklad rozložení aktualizací
06:00 - 1. aktualizace
08:40 - 2. aktualizace  
11:20 - 3. aktualizace
14:00 - 4. aktualizace
16:40 - 5. aktualizace
19:20 - 6. aktualizace
22:00 - konec aktivních hodin
```

### 2. **Kontrolní mechanismy**
- **Každých 30 minut** - kontrola podmínek
- **Denní reset** - automaticky o půlnoci
- **Bezpečnostní kontroly** - před každou aktualizací

### 3. **Generování článků - NOVÝ SYSTÉM**
- **1 článek po aktualizaci** - pouze jeden článek s nejvyšším search volume
- **10minutové intervaly** - další články se generují každých 10 minut
- **Postupné generování** - kontrolované tempo místo hromadného generování
- **Prioritizace** - podle search volume (nejvyšší první)

## 📊 **Monitoring v Admin panelu - ROZŠÍŘENO**

### Smart Scheduling Info
- **Active Hours**: 6:00-22:00
- **Today's Progress**: 3/6 updates
- **Remaining**: 3 updates left

### Article Generation Status - NOVÉ!
#### **Currently Generating**
- **Aktuální článek**: "baker mayfield"
- **Začátek**: 14:23:15
- **Odhadované dokončení**: 14:26:15

#### **Queued Articles**
- **#2**: "yankees vs twins" → 14:30:00
- **#3**: "nasa announces life" → 14:40:00
- **#4**: "spotify wrapped 2025" → 14:50:00
- **#5**: "tesla model y" → 15:00:00
- **#6**: "bitcoin price surge" → 15:10:00

#### **Batch Progress**
- **Dokončeno**: 1/6 článků
- **Zbývá**: 5 článků
- **Batch začal**: 14:23:00

### Statistiky
- **Daily Update Count**: aktuální počet za den
- **Remaining Updates**: zbývající aktualizace
- **Real-time Queue**: živé sledování fronty článků

## 🛠️ **Implementace**

### Klíčové komponenty
1. **TrendsScheduler** - hlavní scheduler s smart timing
2. **FirebaseTrendsService** - ukládání trendů do Firebase
3. **SerpApiMonitor** - monitoring API limitů
4. **AutomatedArticleGenerator** - generování článků

### API Endpoints
- `GET /api/trends/scheduler` - statistiky scheduleru
- `POST /api/trends/scheduler` - ovládání (start/stop/force-update)

## 🔍 **Výhody nového systému**

### ✅ **Optimalizace**
- **Rovnoměrné rozložení** aktualizací během dne
- **Respektování API limitů** SerpAPI i RSS
- **Efektivní využití** aktivních hodin

### ✅ **Spolehlivost**
- **Pevné limity** - nemůže překročit 6 aktualizací
- **Automatické recovery** - restart po chybě
- **Fallback mechanismy** - RSS když SerpAPI nedostupné

### ✅ **Monitoring**
- **Real-time statistiky** v admin panelu
- **Detailní logging** všech operací
- **Prediktivní plánování** dalších aktualizací

## 🚀 **Spuštění**

### V Admin panelu
1. Přejděte na záložku **"⏰ Trends Scheduler"**
2. Klikněte **"Start Scheduler"**
3. Sledujte progress v **"Smart Scheduling Active"** sekci

### Programově
```typescript
import { trendsScheduler } from '@/lib/services/trends-scheduler';

// Spuštění smart scheduleru
trendsScheduler.start();

// Získání statistik
const stats = trendsScheduler.getStats();
console.log(`Today: ${stats.dailyUpdateCount}/${stats.updatesPerDay}`);
```

## 📈 **Očekávané výsledky - FINÁLNÍ**

- **6 aktualizací denně** v čase 6:00-22:00
- **Maximálně 6 SerpAPI volání** denně
- **Kontinuální tok** nových trendů do Firebase
- **6 článků po každé aktualizaci** (1 okamžitě + 5 každých 10 min)
- **Denně 36 nových článků** (6 aktualizací × 6 článků)
- **Vysoká kvalita** - pouze trendy s nejvyšším search volume
- **Real-time monitoring** - živé sledování generování v admin panelu

## ⚠️ **Důležité poznámky**

1. **Scheduler běží kontinuálně** - kontroluje podmínky každých 30 minut
2. **Respektuje časové pásmo** serveru
3. **Automaticky se restartuje** po chybě
4. **Ukládá stav** pro recovery po restartu aplikace
