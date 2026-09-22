# 🌱 Samir's blog — Xotiralarning daraxti

**GitHub Pages'da bepul xosting qilinadigan, Apple Light uslubidagi mobil-pirin shaxsiy blog.**
Istalgan odam o'z xotirasini **bir necha qator bilan** yozib qo'sha oladi — har bir xotira daraxtda yangi shoxa, har bir muallif — **o'z rangidagi hoshiya** bilan ajralib turadi.

- 💸 **Byudjet: 0$** — server yo'q, API kaliti yo'q, framework yo'q
- 📱 **Mobil-pirin** — 44px+ touch maydonlar, safe-area, katta yozish maydoni
- ⚡ **Ultra-tez** — sof Vanilla JS, tashqi kutubxona 0 ta
- 🎨 **Editorial dizayn** — serif sarlavhalar, Apple Light palitra, muallif rangli kartochkalar
- 🤖 **InoBot** — sayt ichidagi xamfiy yordamchi (sana, ob-havo, eslatma, taymer, xotira→JSON)
- 🔒 **Xavfsiz** — foydalanuvchi kontenti avval escape qilinadi (XSS himoyasi), yuboruvchidan token/parol so'ralmaydi

## Tuzilma

```
pycadev.github.io/
├── index.html          # Hero + jonli daraxt grafigi · qidiruv · feed · modal · yozish formasi
├── style.css           # Apple Light dizayn + "daraxt" feed + muallif hoshiyalari
├── script.js           # data.json render · qidiruv · modal · lightbox · forma
├── inobot.js          # InoBot (buyruqlar, eslatmalar, ob-havo, JSON ko'prigi)
├── inobot.css         # InoBot widget
├── data.json           # Barcha xotiralar bazasi
├── media/              # Rasmlar
├── .github/workflows/  # (ixtiyoriy) Issue → data.json avtomatlashtirish
└── README.md
```

## Xususiyatlar

| Blok | Nima qiladi |
|---|---|
| **Jonli daraxt (hero)** | Tepada SVG daraxt: har muallif — o'z rangidagi **qalin shoxa + barg to'plami** (tajo), ism ostida yozilgan. Shabadada nozik silyanadi. **Shoxani bosilsa** feed faqat o'shanning yozganini ko'rsatadi (qayta bosish — barchasi). Yangi muallif qo'shilsa, yangi shoxa animatsiya bilan o'sadi. Sayt 60 soniyada `data.json`'ni tekshiradi — yangi xotira onlayn bo'lsa, daraxt avtomatik o'sadi |
| **Daraxt feed** | Neytral ildiz (trunk) + har postga muallif rangidagi nozik shoxa. Desktop'da ikki tomonlama o'sadi |
| **Muallif hoshiyaslari** | Har bir ism barqaror hash bilan palitradan doim bir xil rang oladi — har bir muallifning xotiralari har doim bir-biridan ajralib turadi |
| **Yozish (+)** | Bir bosish: katta matn + (ixtiyoriy) ism — hech narsa ortiqcha |
| **Qidiruv** | Sarlavha, muallif, matn bo'yicha real-vaqt |
| **Post modal** | Muallif (rangida), sana, serif sarlavha, to'liq matn (Markdown) |
| **Lightbox** | Rasmlar rounded border + touch bilan kattalashtiriladi |
| **InoBot** | 16 ta buyruq: `/sana /vaqt /obhavo /eslatma /taymer /xotira /json /eksport /faka …` |

## GitHub Pages'ga joylash (3 qadam)

1. **Repo:** `pycadev.github.io` nomli repository (yoki mavjud repo) — fayllar **root**ida bo'lishi kerak.
2. **Push:**
   ```bash
   git init
   git add .
   git commit -m "feat: samir's blog v1.0"
   git branch -M main
   git remote add origin https://github.com/pycadev/pycadev.github.io.git
   git push -u origin main
   ```
3. **Pages:** Settings → Pages → **Deploy from a branch** → `main` / `(root)` → Save.

> Repo nomi boshqacha bo'lsa: `script.js` → `CONFIG.repo` ni o'zgartiring.

## Yangi xotira qo'shish (3 usul)

### 1. Sayt orqali (istalgan odam)
**"Yozish"** → (ixtiyoriy) ism → xotira → **Yuborish**.
GitHub Issue ochildi → unda "Open issue" bosildi → daraxtga qo'shildi (avto-publish yoki qo'lda).

### 2. InoBot orqali (tez)
Botda: `/xotira Bugun demo ko'rsatdim` → `/json 1` → **Nusxalash** → `data.json` boshiga qo'yish → push.

### 3. Qo'lda
`data.json` boshiga:

```json
{
  "id": 6,
  "date": "22-Sentyabr, 2026",
  "date_iso": "2026-09-22",
  "time": "14:30",
  "author": "Ism",
  "title": "Sarlavha",
  "cover_image": null,
  "content": "**Qalin** matn, [havola](https://…), - ro'yxat",
  "tags": []
}
```

`git add . && git commit -m "feat: yangi xotira" && git push origin main` → 30 soniyada onlayn.

**Markdown:** `**qalin**`, `[matn](https://url)`, `![alt](media/rasm.jpg)`, `- ro'yxat`. Rasmlar faqat `media/` yoki `https://` dan (xavfsizlik).

## (Ixtiyoriy) Auto-publish: Issue → data.json

`.github/workflows/xotira-publish.yml` tayyor. Ishlatish:
1. Issues → **Labels** → `publish` (va `published`) yarating.
2. Xotira Issue'siga `publish` label.
3. Workflow kontentni o'zi `data.json`'ga qo'shib, commit qiladi, ✅ izoh qoldiradi.

Xavfsizlik: label faqat repo owner/admini qo'yadi.

## InoBot buyruqlari

| Buyruq | Tavsif |
|---|---|
| `/start`, `/yordam` | Tanishuv, buyruqlar ro'yxati |
| `/sana`, `/vaqt` | Sana (o'zbekcha), vaqt |
| `/obhavo`, `/obhavo 3` | Toshkent ob-havosi (Open-Meteo, kalitsiz), prognoz |
| `/eslatma 18:00 matn` | Eslatma (notification + toast + vibratsiya) |
| `/eslatmalar`, `/o'chir 1` | Ro'yxat, o'chirish |
| `/taymer 5` | Jonli countdown, tugashda signal |
| `/xotira matn`, `/notalar` | Tezkor xotiralar |
| `/json 1` | Xotira → `data.json` tayyor snippet + copy |
| `/eksport`, `/tozalash`, `/faka`, `/inobot` | Zaxira, chat tozalash, faka, haqida |

Ma'lumotlar brauzerda (`localStorage`, kalit `pycadev:inobot:v1`) — qurilmadan o'ziga-xohishiga chiqmaydi.
**Cheklov (haloqiyat):** eslatmalar sahifa ochiq payt ishlaydi (statik hosting); o'tib ketganlar ochilganda toast bilan eslatiladi.

## Dizayn tizimi

| Token | Qadr |
|---|---|
| Fon | `#F5F5F7` |
| Kartochka | `#FFFFFF` + muallif rangidagi `2px` hoshiya |
| Sarlavhalar | `ui-serif / New York / Georgia` (editorial) |
| Matn | `#1D1D1F` / `#3A3A3C` / `#86868B` |
| Accent | `#0071E3` |
| Muallif palitrasi | `#0071E3 · #7D5AFC · #FF9500 · #30B0C7 · #34C759 · #A2845E · #FF2D55 · #5E5CE6` (hash bilan barqaror) |
| Radius | kartochka 18px · tugma 12px · rasm 12px |
| Animatsiya | 250–500ms, `prefers-reduced-motion` hurmat qilinadi |

## Optimizatsiya

- Tashqi kutubxona **0**; butun JS ~25KB (gzip ~8KB).
- Kartochkalarda `backdrop-filter` ishlamasdi (mobil render tezyigi) — faqat sticky toolbar'da.
- Rasmlar `loading="lazy"` + `aspect-ratio` (layout shift yo'q).
- Jonli daraxt: toza SVG + CSS animatsiya (JS frame yo'q); yangiliklarni 60s'da bitta kichik `no-store` so'rov bilan tekshiradi.
- InoBot alohida fayl + `defer` — LCP'ga ta'sir qilmaydi.
- Ob-havo so'rovi 10 daq kesh (bitta tashqi API: Open-Meteo).
- Nishon: Lighthouse mobil ≥ 95.

## O'zlashtirish

- Brend: `index.html` → `.hero-name`, `<title>`, `script.js` → `CONFIG.repo`
- Muallif ranglari: `script.js` → `PALETTE`
- Rasm qo'shish: `media/` papkasiga qo'yib, `cover_image: "media/fayl.jpg"` yoki matn ichida `![](media/fayl.jpg)`

## v2 g'oyalari

Telegram bridge · PWA + offline · GitHub Actions cron → email eslatma · boshqa shahar ob-havosi · Web Speech (bot gapiradi) · dark mode.

---

*Har bir xotira — daraxtda yangi shoxa. 🌱*
