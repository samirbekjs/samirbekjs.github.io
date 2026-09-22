/* =============================================================
   InoBot — saytdagi shaxsiy yordamchi (PLAN.md bo'yicha)
   Statik · 0$ · LLM'siz · Vanilla JS
   Modullar: Store · Parser · Commands · Weather · Reminders · Timer · UI
   ============================================================= */
(function () {
  'use strict';

  /* ---------- 1. Doimiy qiymatlar ---------- */
  const KEY = 'pycadev:inobot:v1';
  const OY  = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  const KUN = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

  /* WMO ob-havo kodlari → emoji + o'zbekcha tavsif */
  const WMO = {
    0: ['☀️', 'Ashaddadiy ochiq'], 1: ['🌤', 'Asosiy ochiq'], 2: ['⛅', 'Qismin bulutli'], 3: ['☁️', 'Bulutli'],
    45: ['🌫', 'Tuman'], 48: ['🌫', 'Yopishib turgan tuman'],
    51: ['🌦', 'Suyuk yomg\'ir'], 53: ['🌦', 'O\'rtacha yomg\'ir'], 55: ['🌦', 'Zich yomg\'ir'],
    56: ['🌧', 'Muzlik yomg\'ir'], 57: ['🌧', 'Zich muzlik yomg\'ir'],
    61: ['🌧', 'Yengil yomg\'ir'], 63: ['🌧', 'O\'rtacha yomg\'ir'], 65: ['🌧', 'Kuchli yomg\'ir'],
    66: ['🌧', 'Muzlik yomg\'ir'], 67: ['🌧', 'Kuchli muzlik yomg\'ir'],
    71: ['❄️', 'Yengil qor'], 73: ['❄️', 'O\'rtacha qor'], 75: ['❄️', 'Kuchli qor'], 77: ['❄️', 'Qor donachalari'],
    80: ['🌦', 'Yengil sachar'], 81: ['🌧', 'O\'rtacha sachar'], 82: ['⛈', 'Kuchli sachar'],
    85: ['🌨', 'Qor sachari'], 86: ['🌨', 'Zich qor sachari'],
    95: ['⛈', 'Chiroq'], 96: ['⛈', 'Chiroq, dog\'or bilan'], 99: ['⛈', 'Kuchli chiroq, dog\'or bilan'],
  };

  const FAKALAR = [
    "Dasturchi nima uchun oynani ochmaydi? O'zi ochadi. :)",
    "Bugun koddagi xatoni topdim — bug' ichida qolipti.",
    "It dasturlashni o'rgandi — endi har borishda 'sit' deb o'tiradi.",
    "Nima uchun dasturchilar yashirinmaydi? UV nurlar — 404 Not Found.",
    "Men 'CSS' deb so'radim. Menga 'CSS' deb javob berishdi.",
    "Git: avval hammasini buz, keyin 'commit' deb turtib yubor.",
    "Mening koding ishlamoqda — uni tekshirmaganim uchun!",
    "Dasturchi nima uchun ko'zoynak taqadi? Kodni ko'rish uchun.",
    "JavaScript: men hamma narsa bo'la olaman... garchi hamma narsa bo'lmasam ham.",
    "Bugun bir bug o'ldim. Kod endi 'clean'.",
    "SQL so'rovim: SELECT uyqu FROM kun WHERE vaqt = yetarli LIMIT 1. Natija: 0 qator.",
    "HTML — sahifa skeleti: ichi bo'sh, ko'rinishi zo'r. Tanishishmizmi?",
    "Stack Overflow — dasturchi Google'i, faqat biroz yuqoriroq.",
    "Eslatma qo'ydim: 'eslatma qo'yishni eslat'. Ishladi — o'zim eslatdim.",
    "Daraxt ildizi kodga o'xshaydi: ko'rinmaydi, lekin tushsa — daraxt ham tushadi.",
    "Nima uchun JS dasturchisi to'yga keta olmaydi? Har joyda 'undefined'.",
    "Bugun 'if' ichida uyquladim. 'else' bo'lmagani uchun uyg'onmadim.",
    "Kafedra so'radi: 'kelajakda nima bo'laman?' Men: 'frontend'. Uni: 'frontend narsa emasmi'?",
    "Samir's blog daraxti ildiz otib qo'ydi — endi xotiralar shu yerda yig'iladi. 🌱",
  ];

  const HELP =
    "Buyruqlarim:\n" +
    "• /sana — bugungi sana\n" +
    "• /vaqt — joriy vaqt\n" +
    "• /obhavo — Toshkent ob-havosi\n" +
    "• /obhavo 3 — 3 kunlik prognoz\n" +
    "• /eslatma 18:00 matn — eslatma qo'yish\n" +
    "• /eslatmalar — faol eslatmalar\n" +
    "• /o'chir 1 — eslatmani o'chirish\n" +
    "• /taymer 5 — taymer (daqiqa)\n" +
    "• /xotira matn — tezkor xotira\n" +
    "• /notalar — xotiralar ro'yxati\n" +
    "• /json 1 — xotirani data.json formatiga olish\n" +
    "• /eksport — barcha ma'lumotni zaxiralash\n" +
    "• /tozalash — chatni tozalash\n" +
    "• /faka — faka\n" +
    "• /inobot — bot haqida";

  /* ---------- 2. Holat (Store) ---------- */
  const S = { v: 1, chat: [], reminders: [], notes: [], settings: { notifs: 'unknown' } };
  let uid = 1;
  const openedAt = Date.now();
  const timers = new Map();
  let wcache = { t: 0, data: null };
  let maxIdCache = null;
  let lastFaka = -1;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d && d.v === 1) Object.assign(S, d);
    } catch (e) { console.warn('InoBot: ma\'lumot o\'qilmadi', e); }
    uid = Math.max(1,
      ...S.reminders.map(r => r.id || 0),
      ...S.notes.map(n => n.id || 0)) + 1;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* kvota */ }
  }

  /* ---------- 3. Yordamchilar ---------- */
  const $ = (s, el) => (el || document).querySelector(s);
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }
  /* xavfsiz "qalin" format: avval escape, keyin ** ** */
  function lite(s) { return esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function fmtTime(ts) {
    const d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function fmtCountdown(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  function fmtRem(iso) {
    const d = new Date(iso);
    const today = new Date();
    const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
    const same = (a, b) => a.toDateString() === b.toDateString();
    const pref = same(d, today) ? 'bugun, ' : same(d, tmr) ? 'ertaga, ' : '';
    return `${pref}${d.getDate()}-${OY[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  /* ---------- 4. UI ---------- */
  let fab, panel, body, input;

  function build() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
    <button class="ino-fab" id="inoFab" aria-label="InoBot — shaxsiy yordamchini ochish" aria-expanded="false" title="InoBot">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3.5l1.8 4.9 4.9 1.8-4.9 1.8L12 16.9l-1.8-4.9-4.9-1.8 4.9-1.8z"/>
        <path d="M18.7 15.2l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z"/>
      </svg>
    </button>
    <section class="ino-panel" id="inoPanel" role="dialog" aria-label="InoBot chat" hidden>
      <header class="ino-head">
        <div class="ino-id">
          <span class="ino-logo" aria-hidden="true">✦</span>
          <div class="ino-tt"><strong>InoBot</strong><small><span class="ino-dot" aria-hidden="true"></span>onlayn</small></div>
        </div>
        <button class="ino-ico" id="inoClose" aria-label="Chatni yopish">✕</button>
      </header>
      <div class="ino-body" id="inoBody" tabindex="-1"></div>
      <footer class="ino-foot">
        <form id="inoForm">
          <input id="inoInput" type="text" placeholder="Xabar yozing… masalan /sana" autocomplete="off" aria-label="InoBot'ga xabar">
          <button type="submit" aria-label="Yuborish">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4l17.4-7.5c.8-.4.8-1.5 0-1.8L3.4 3.6c-.6-.3-1.4.2-1.4.9v5.4c0 .5.4.9.9 1L17 12 3.9 13.2c-.5.1-.9.5-.9 1v5.3c0 .7.8 1.2 1.4.9z"/></svg>
          </button>
        </form>
        <small class="ino-hint">Buyruqlar ro'yxati: /yordam</small>
      </footer>
    </section>
    <div class="ino-toast" id="inoToast" role="status" aria-live="polite"></div>`;
    document.body.appendChild(wrap);

    fab = $('#inoFab'); panel = $('#inoPanel'); body = $('#inoBody'); input = $('#inoInput');
    fab.addEventListener('click', openPanel);
    $('#inoClose').addEventListener('click', closePanel);
    $('#inoForm').addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value;
      if (!v.trim()) return;
      input.value = '';
      handle(v);
    });
  }

  function openPanel() {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('open'));
    fab.setAttribute('aria-expanded', 'true');
    fab.style.display = 'none';
    if (S.chat.length === 0) CMD.start();
    else renderChat();
    setTimeout(() => input.focus(), 260);
  }
  function closePanel() {
    panel.classList.remove('open');
    setTimeout(() => { panel.hidden = true; }, 260);
    fab.setAttribute('aria-expanded', 'false');
    fab.style.display = '';
  }

  function renderChat() {
    body.innerHTML = '';
    for (const m of S.chat) {
      const el = document.createElement('div');
      el.className = 'ino-msg ' + (m.from === 'ino' ? 'ino' : 'user');
      const b = document.createElement('div');
      b.className = 'ino-bubble';
      b.textContent = m.text;
      const t = document.createElement('time');
      t.className = 'ino-time';
      t.textContent = fmtTime(m.ts);
      el.append(b, t);
      body.appendChild(el);
    }
    body.scrollTop = body.scrollHeight;
  }

  function addMsg(from, html, opts = {}) {
    const el = document.createElement('div');
    el.className = 'ino-msg ' + (from === 'ino' ? 'ino' : 'user');
    const b = document.createElement('div');
    b.className = 'ino-bubble';
    b.innerHTML = html;
    const t = document.createElement('time');
    t.className = 'ino-time';
    t.textContent = fmtTime(Date.now());
    el.append(b, t);
    if (opts.chips && opts.chips.length) {
      const c = document.createElement('div');
      c.className = 'ino-chips';
      opts.chips.forEach(ch => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ino-chip';
        btn.textContent = ch;
        btn.addEventListener('click', () => handle(ch));
        c.appendChild(btn);
      });
      el.appendChild(c);
    }
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    // saqlash: faqat sof matn (taglarsiz)
    S.chat.push({ from, text: String(html).replace(/<[^>]+>/g, ''), ts: Date.now() });
    if (S.chat.length > 200) S.chat = S.chat.slice(-200);
    save();
    return el;
  }

  function typing(on) {
    const t = $('#inoTyping');
    if (on && !t) {
      const el = document.createElement('div');
      el.id = 'inoTyping';
      el.className = 'ino-msg ino';
      el.innerHTML = '<div class="ino-bubble typing"><span></span><span></span><span></span></div>';
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    } else if (!on && t) t.remove();
  }

  async function botSay(text, opts = {}) {
    typing(true);
    await sleep(260 + Math.random() * 340);
    typing(false);
    return addMsg('ino', lite(text), opts);
  }

  function addCode(code, okLabel) {
    const el = document.createElement('div');
    el.className = 'ino-msg ino';
    const pre = document.createElement('pre');
    pre.className = 'ino-code';
    pre.textContent = code; // xavfsiz: innerHTML emas
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ino-copy';
    btn.textContent = '📋 Nusxalash';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = '✅ ' + (okLabel || 'Nusxalandi');
      } catch (e) {
        btn.textContent = '❌ Nusxalanmadi — qo‘lda tanlang';
      }
    });
    const t = document.createElement('time');
    t.className = 'ino-time';
    t.textContent = fmtTime(Date.now());
    el.append(pre, btn, t);
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    S.chat.push({ from: 'ino', text: '[kod] ' + code.slice(0, 60), ts: Date.now() });
    if (S.chat.length > 200) S.chat = S.chat.slice(-200);
    save();
  }

  let toastT;
  function showToast(html) {
    const t = $('#inoToast');
    t.innerHTML = html;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 3500);
  }

  /* ---------- 5. Bildirishnomalar va tovush ---------- */
  function notify(text) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('InoBot', { body: text }); } catch (e) { /* iOS Safari cheklovi */ }
    }
  }
  async function ensureNotif() {
    if (!('Notification' in window)) { S.settings.notifs = 'unsupported'; save(); return false; }
    if (S.settings.notifs === 'granted') return true;
    if (S.settings.notifs === 'denied') return false;
    const p = await Notification.requestPermission();
    S.settings.notifs = p;
    save();
    return p === 'granted';
  }
  function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      [0, 0.18].forEach((d, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = i ? 880 : 660;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, ctx.currentTime + d);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d + 0.15);
        o.start(ctx.currentTime + d);
        o.stop(ctx.currentTime + d + 0.16);
      });
    } catch (e) { /* tovush yo'q bo'lishi mumkin */ }
  }

  /* ---------- 6. Ob-havo (Open-Meteo — bepul, kalitsiz) ---------- */
  async function getWeather() {
    if (wcache.data && Date.now() - wcache.t < 600000) return wcache.data; // 10 daq kesh
    const url = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=41.2995&longitude=69.2401' +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&timezone=Asia%2FTashkent&forecast_days=3';
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    wcache = { t: Date.now(), data: await res.json() };
    return wcache.data;
  }

  /* ---------- 7. data.json max id (JSON ko'prigi uchun) ---------- */
  async function getMaxId() {
    if (maxIdCache !== null) return maxIdCache;
    try {
      const r = await fetch('data.json');
      const posts = await r.json();
      maxIdCache = posts.reduce((m, p) => Math.max(m, p.id || 0), 0);
    } catch (e) { maxIdCache = 0; }
    return maxIdCache;
  }

  /* ---------- 8. Buyruqlar ---------- */
  const CMD = {};

  CMD.start = async () => {
    await botSay('Salom! Men **InoBot** — saytingizning kichik yordamchisiman 🌱');
    await botSay('Sana, vaqt, ob-havo, eslatma, taymer va tezkor xotiralar — hammasi shu yerda. Sinab ko‘ring:',
      { chips: ['/sana', '/obhavo', '/eslatma', '/xotira'] });
  };

  CMD.yordam = async () => botSay(HELP, { chips: ['/start', '/obhavo'] });

  CMD.sana = async () => {
    const d = new Date();
    await botSay(`Bugun: **${d.getDate()}-${OY[d.getMonth()]}, ${d.getFullYear()} — ${KUN[d.getDay()]}** 📅`,
      { chips: ['/vaqt', '/eslatma'] });
  };

  CMD.vaqt = async () => {
    const d = new Date();
    await botSay(`Soat: **${fmtTime(d.getTime())}** (Qurilma soati) ⏰`, { chips: ['/sana'] });
  };

  CMD.obhavo = async (args) => {
    const days = String(args).trim() === '3' ? 3 : 1;
    try {
      const d = await getWeather();
      const c = d.current;
      const w = WMO[c.weather_code] || ['🌡', 'Noma\'lum'];
      let text = `Toshkent, hozir: ${w[0]} **${w[1]}**, ${Math.round(c.temperature_2m)}°C (hissiy ${Math.round(c.apparent_temperature)}°C)\nNamlik ${c.relative_humidity_2m}% · Shamol ${Math.round(c.wind_speed_10m)} km/soat`;
      if (days === 3) {
        const dl = d.daily;
        for (let i = 1; i < 3; i++) {
          const w2 = WMO[dl.weather_code[i]] || ['🌡', '?'];
          const dt = new Date(dl.time[i] + 'T00:00:00');
          text += `\n${KUN[dt.getDay()]}: ${w2[0]} ${Math.round(dl.temperature_2m_min[i])}–${Math.round(dl.temperature_2m_max[i])}°C`;
        }
      }
      await botSay(text, { chips: days === 1 ? ['/obhavo 3', '/eslatma'] : ['/eslatma'] });
    } catch (e) {
      await botSay('Ob-havoni hozir ochib bo‘lmadi — tarmoqni tekshiring 🌥', {});
    }
  };

  CMD.eslatma = async (args) => {
    const m = String(args).match(/^(\d{1,2}):(\d{2})\s+(.+)$/s);
    if (!m) return botSay('Format: `/eslatma 18:00 Ertalabki uchrashuv`',
      { chips: ['/eslatma 18:00 Choy ich'] });
    const h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return botSay('Vaqt noto‘g‘ri: soat 0–23, daqiqa 0–59.', {});
    const now = new Date();
    const at = new Date(now); at.setHours(h, mi, 0, 0);
    const tomorrow = at.getTime() <= now.getTime();
    if (tomorrow) at.setDate(at.getDate() + 1);
    const r = { id: uid++, at: at.toISOString(), text: m[3].trim().slice(0, 120), done: false };
    S.reminders.push(r); save();
    if (!(await ensureNotif())) showToast('🔔 Bildirishnoma uchun brauzer ruxsati so‘raladi');
    await botSay(`⏰ Eslatma qo‘yildi: **${h}:${String(mi).padStart(2, '0')}** — “${r.text}” (${tomorrow ? 'ertaga' : 'bugun'}) · id ${r.id}`,
      { chips: ['/eslatmalar', `/o'chir ${r.id}`] });
  };

  CMD.eslatmalar = async () => {
    const act = S.reminders.filter(r => !r.done);
    if (!act.length) return botSay('Faol eslatmalar yo‘q 🌿', { chips: ['/eslatma 18:00 Choy ich'] });
    const lines = act.sort((a, b) => a.at.localeCompare(b.at)).slice(0, 10)
      .map(r => `• **${fmtRem(r.at)}** — ${r.text} (id ${r.id})`).join('\n');
    await botSay(`Sizda ${act.length} ta faol eslatma:\n${lines}\n\nO‘chirish: /o'chir raqam`, {});
  };

  CMD.ochir = async (args) => {
    const id = parseInt(args, 10);
    const i = S.reminders.findIndex(r => r.id === id && !r.done);
    if (i < 0) return botSay(`#${id} raqamli faol eslatma topilmadi.`, { chips: ['/eslatmalar'] });
    S.reminders.splice(i, 1); save();
    await botSay(`#${id} eslatma o‘chirildi ✅`, { chips: ['/eslatmalar'] });
  };

  CMD.taymer = async (args) => {
    const min = parseInt(args, 10);
    if (!min || min < 1 || min > 180) return botSay('Format: `/taymer 5` (1–180 daqiqa).', { chips: ['/taymer 5'] });
    if (timers.size >= 3) return botSay('Bir vaqtda 3 tadan ortiq taymer ishlashi mumkin emas ⏳', {});
    const id = uid++;
    let left = min * 60;
    const el = await botSay(`⏳ **${min} daqiqa** taymer boshlandi — **${fmtCountdown(left)}** qoldi`, {});
    const iv = setInterval(() => {
      left -= 1;
      const b = el && el.querySelector('.ino-bubble');
      if (b) b.innerHTML = left > 0
        ? `⏳ ${min} daqiqa taymer — **${fmtCountdown(left)}** qoldi`
        : '⏳ **Tugashda!**';
      if (left <= 0) {
        clearInterval(iv); timers.delete(id);
        beep(); notify('Taymer tugadi ⏳');
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        botSay('Vaqt tugadi! ⏰', { chips: ['/taymer 5'] });
      }
    }, 1000);
    timers.set(id, iv);
  };

  CMD.xotira = async (args) => {
    if (!args) return botSay('Format: `/xotira Bugun zo‘r kun bo‘ldi` — matn bo‘sh bo‘lmasin 📝', { chips: ['/notalar'] });
    const note = { id: uid++, text: args.slice(0, 500), ts: new Date().toISOString() };
    S.notes.push(note); save();
    await botSay(`📝 Xotira **#${note.id}** saqlandi. Tayyor JSON olish uchun:`,
      { chips: [`/json ${note.id}`, '/notalar'] });
  };

  CMD.notalar = async () => {
    if (!S.notes.length) return botSay('Hozircha xotira yo‘q. Birinchisini yozing 📝', { chips: ['/xotira Bugun qanday o‘tdi?'] });
    const lines = S.notes.slice(-10).map(n =>
      `• **#${n.id}** — ${n.text.length > 60 ? n.text.slice(0, 60) + '…' : n.text}`).join('\n');
    await botSay(`Sizda ${S.notes.length} ta xotira (oxirgi ${Math.min(10, S.notes.length)} tasi):\n${lines}\n\nJSON uchun: /json raqam`, {});
  };

  CMD.json = async (args) => {
    const id = parseInt(args, 10);
    const note = S.notes.find(n => n.id === id);
    if (!note) return botSay(`#${id} xotira topilmadi.`, { chips: ['/notalar'] });
    const maxId = await getMaxId();
    const now = new Date();
    const obj = {
      id: maxId + 1,
      date: `${now.getDate()}-${OY[now.getMonth()]}, ${now.getFullYear()}`,
      date_iso: now.toISOString().slice(0, 10),
      time: fmtTime(now.getTime()),
      author: 'InoBot (mahalliy xotira)',
      title: note.text.split(' ').slice(0, 8).join(' '),
      cover_image: null,
      content: note.text,
      tags: ['shaxsiy'],
    };
    await botSay(`#${note.id} xotira uchun **data.json**'ga tayyor snippet — fayl boshiga qo‘ying, keyin git push:`, {});
    addCode(JSON.stringify(obj, null, 2), 'JSON nusxalandi');
  };

  CMD.eksport = async () => {
    await botSay('Barcha ma‘lumotlaringiz (zaxira) — saqlab qo‘ying:', {});
    addCode(JSON.stringify(S, null, 2), 'Zaxira nusxalandi');
  };

  CMD.tozalash = async () => {
    S.chat = []; save();
    body.innerHTML = '';
    await botSay('Chat tozalandi ✨ (eslatmalar va xotiralar o‘z joyida qoladi)', {});
  };

  CMD.faka = async () => {
    let i;
    do { i = Math.floor(Math.random() * FAKALAR.length); } while (i === lastFaka && FAKALAR.length > 1);
    lastFaka = i;
    await botSay(FAKALAR[i] + ' 😄', { chips: ['/faka'] });
  };

  CMD.inobot = async () => {
    const act = S.reminders.filter(r => !r.done).length;
    await botSay(
      'Men **InoBot v1.0** — Samir\'s blog ning ichki yordamchisiman 🌱\n' +
      'Statik · 0$ · server\'siz · LLM\'siz · toza Vanilla JS.\n\n' +
      `Suhbat xabarlari: ${S.chat.length} · Xotiralar: ${S.notes.length} · Faol eslatmalar: ${act}`, {}
    );
  };

  /* ---------- 9. Parser va kirish ---------- */
  async function handle(raw) {
    addMsg('user', esc(raw));
    const t = raw.trim();
    const m = t.match(/^\/([a-z]{2,20})\s*(.*)$/is);
    if (!m) {
      const hi = /^(salom|assalomu|hello|hi)\b/i.test(t);
      await botSay(hi
        ? 'Salom! 😊 Men hozir buyruqlar bilan ishlaman — /yordam deb barcha imkoniyatlarni ko‘ring.'
        : 'Hm, bu buyruq emasdek. /yordam deb ro‘yxatni ko‘ring 🙂',
        { chips: ['/yordam'] });
      return;
    }
    const cmd = m[1].toLowerCase().replace(/['\u2019]/g, '');
    const args = (m[2] || '').trim();
    const fn = CMD[cmd];
    if (!fn) {
      const near = Object.keys(CMD).find(c => c.startsWith(cmd.slice(0, Math.max(2, cmd.length - 2))));
      await botSay(`“/${cmd}” buyrug‘i mavjud emas 🤔${near ? ' Balki: /' + near + '?' : ''}`,
        { chips: near ? ['/' + near, '/yordam'] : ['/yordam'] });
      return;
    }
    try { await fn(args); }
    catch (e) {
      console.error('InoBot:', e);
      await botSay('Kechirasiz, xatolik yuz berdi — qayta urinib ko‘ring.', {});
    }
  }

  /* ---------- 10. Eslatmalar dvijogi ---------- */
  function checkReminders() {
    const now = Date.now();
    for (const r of S.reminders) {
      if (r.done) continue;
      const t = new Date(r.at).getTime();
      if (t <= now && t > openedAt) { // sahifa ochiq bo'lgan paytda tushganlar
        r.done = true; save();
        if (panel && panel.classList.contains('open')) addMsg('ino', lite('⏰ Eslatma: ' + r.text), { chips: ['/eslatmalar'] });
        showToast('⏰ ' + esc(r.text));
        notify(r.text);
        if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
      }
    }
  }
  function overdueToast() {
    setTimeout(() => {
      const now = Date.now();
      const od = S.reminders.filter(r => !r.done && new Date(r.at).getTime() < now);
      if (od.length) showToast(`⏰ ${od.length} ta eslatma muddati o‘tib ketgan — /eslatmalar deb ko‘ring`);
    }, 1200);
  }

  /* ---------- 11. Ishga tushirish ---------- */
  function init() {
    load();
    build();
    overdueToast();
    setInterval(checkReminders, 15000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
