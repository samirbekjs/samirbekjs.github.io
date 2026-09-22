/* =============================================================
   SAMIR'S BLOG — "Xotiralarning daraxti"
   Vanilla JS · framework'siz · 0$
   jonli daraxt (hero) · data.json render · qidiruv · modal ·
   lightbox · minimal forma · shoxa bosish (filtr) · avto-raqam
   ============================================================= */
'use strict';

/* ---------- 1. Sozlamalar ---------- */
const CONFIG = {
  repo: 'pycadev/pycadev.github.io', // ← o'z repozitoriyangiz bo'lsa, shu qatorni o'zgartiring
  dataUrl: 'data.json',
  excerptLen: 180,
  minLen: 20,
  maxLen: 3000,
  pollMs: 60000, // yangi xotirani qancha tez sezamiz: 60 soniya
};

/* Muallif palitrasi — har bir ism doim bir xil rangga tushadi (barqaror) */
const PALETTE = ['#0071E3', '#7D5AFC', '#FF9500', '#30B0C7', '#34C759', '#A2845E', '#FF2D55', '#5E5CE6'];

const state = { posts: [], q: '', filterAuthor: null };
let lastData = '';

/* ---------- 2. Yordamchilar ---------- */
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
/* barqaror "tasodifiy" 0..1 — shoxa shakllari har doim bir xil */
function jit(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/* Muallif → barqaror rang */
function authorColor(name) {
  return PALETTE[hashOf(String(name || 'Misafir')) % PALETTE.length];
}

function authorName(p) { return p.author || 'Misafir'; }

/* ---------- 3. Mini Markdown (xavfsiz: avval escape, keyin format) ---------- */
function inlineMd(s) {
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, src) => {
    if (!/^(media\/|https?:\/\/)/.test(src)) return m;
    return `<img class="md-img" src="${src}" alt="${alt}" loading="lazy">`;
  });
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return s;
}

function renderMd(src) {
  const out = [];
  let list = [];
  const flush = () => {
    if (list.length) { out.push(`<ul>${list.join('')}</ul>`); list = []; }
  };
  for (const raw of String(src).split(/\r?\n/)) {
    const line = esc(raw);
    const m = line.match(/^\s*[-*]\s+(.*)$/);
    if (m) { list.push(`<li>${inlineMd(m[1])}</li>`); continue; }
    flush();
    if (!line.trim()) continue;
    out.push(`<p>${inlineMd(line)}</p>`);
  }
  flush();
  return out.join('');
}

function toPlain(src) {
  return String(src)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- 4. Jonli daraxt (hero grafigi) ----------
   Qalin trunk + har muallifga qalin shoxa + uchinida barg to'plami.
   Shabadada silyanadi (CSS). Shoxani bosish = faqat o'shanning
   yozganini ko'rsatish. Yangi muallif = yangi o'sadigan shoxa.   */
function buildTree(known) {
  const box = $('#tree');
  if (!box) return;

  const counts = {};
  state.posts.forEach(p => {
    const a = authorName(p);
    counts[a] = (counts[a] || 0) + 1;
  });
  const all = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
  const shown = all.slice(0, 9);
  const extra = all.length - shown.length;

  const W = 360, H = 250, hx = 180, hy = 118, baseY = 232;
  const parts = [];

  parts.push(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Xotiralarning daraxti">`);
  parts.push(`<defs><radialGradient id="tg" cx="50%" cy="42%" r="62%">` +
    `<stop offset="0%" stop-color="rgba(0,113,227,.07)"/><stop offset="100%" stop-color="rgba(0,113,227,0)"/>` +
    `</radialGradient></defs>`);
  parts.push(`<ellipse cx="180" cy="92" rx="158" ry="88" fill="url(#tg)"/>`);
  parts.push(`<line class="t-ground" x1="112" y1="${baseY + 8}" x2="248" y2="${baseY + 8}"/>`);
  parts.push(`<path class="t-root" d="M${hx} ${baseY} C 170 ${baseY - 9}, 160 ${baseY - 6}, 150 ${baseY + 2}"/>`);
  parts.push(`<path class="t-root" d="M${hx} ${baseY} C 190 ${baseY - 9}, 200 ${baseY - 6}, 210 ${baseY + 2}"/>`);
  parts.push(`<path class="t-trunk" pathLength="1" d="M${hx} ${baseY} C 174 196, 186 154, ${hx} ${hy}"/>`);

  const N = shown.length;
  shown.forEach((name, i) => {
    const color = authorColor(name);
    const h = hashOf(name);
    const t = N === 1 ? 0.5 : i / (N - 1);
    const ang = (t - 0.5) * 2.44;               // ±70° — shoxalar fanaadi
    const R = 82 + Math.floor(jit(h + 7) * 20); // shoxa uzunligi (muallifga barqaror)
    const tx = hx + Math.sin(ang) * R;
    const ty = hy - Math.cos(ang) * R * 0.88;

    const isNew = known ? !known.has(name) : true;
    const gd = (0.3 + i * 0.22).toFixed(2);
    const sd = (3.8 + jit(h + 3) * 2.4).toFixed(2);
    const sa = (1.2 + jit(h + 5) * 1.2).toFixed(2);
    const so = (-jit(h + 9) * 5).toFixed(2);
    const cs = 1 + Math.min(counts[name], 5) * 0.06; // ko'p xotira = biroz katta tajo

    let g = `<g class="${isNew ? 't-branch' : 't-branch still'}" data-name="${esc(name)}" ` +
      `tabindex="0" role="button" aria-label="${esc(name)} yozgan xotiralarni ko'rsatish" ` +
      `style="--ac:${color};--gd:${gd}s;--sd:${sd}s;--sa:${sa}deg;--so:${so}s">`;
    g += `<path pathLength="1" d="M${hx} ${hy} Q ${(hx + Math.sin(ang) * R * 0.52).toFixed(1)} ${(hy - Math.cos(ang) * R * 0.5 - 16).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}"/>`;

    // tajo: kichik nur + 8 ta qatlamli barg
    g += `<circle class="t-leaf" style="--ld:${(parseFloat(gd) + 0.35).toFixed(2)}s;--lo:.14" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="${(21 * cs).toFixed(1)}"/>`;
    for (let j = 0; j < 8; j++) {
      const a = jit(h * 29 + j * 3) * 6.283;
      const rr = (4.5 + jit(h * 31 + j * 7) * 9) * cs;
      const d = 1 + jit(h * 37 + j) * 13;
      const lx = tx + Math.cos(a) * d * (0.55 + rr / 26);
      const ly = ty + Math.sin(a) * d * (0.5 + rr / 26) - 3;
      const lo = (0.32 + jit(h * 43 + j) * 0.5).toFixed(2);
      g += `<circle class="t-leaf" style="--ld:${(parseFloat(gd) + 0.4 + j * 0.06).toFixed(2)}s;--lo:${lo}" ` +
        `cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="${rr.toFixed(1)}"/>`;
    }

    // ism — tajo ostida, oq "nur" bilan (barqaror o'qiladi)
    const lx2 = Math.max(44, Math.min(W - 44, tx));
    const ly2 = Math.min(H - 10, ty + 38 * cs);
    g += `<text class="t-label" style="--ld:${(parseFloat(gd) + 0.62).toFixed(2)}s;--lo:1" ` +
      `x="${lx2.toFixed(1)}" y="${ly2.toFixed(1)}" text-anchor="middle">${esc(name)}</text>`;
    g += `</g>`;
    parts.push(g);
  });

  if (extra > 0) parts.push(`<text class="t-extra" x="${W - 10}" y="${H - 8}" text-anchor="end">+${extra} muallif</text>`);
  parts.push('</svg>');
  box.innerHTML = parts.join('');
  applyTreeSel();
}

/* tanlangan shoxani belgilash (yoki filtri o'chirish) */
function applyTreeSel() {
  const box = $('#tree');
  if (!box) return;
  if (state.filterAuthor && !Array.from(box.querySelectorAll('.t-branch')).some(g => g.dataset.name === state.filterAuthor)) {
    state.filterAuthor = null;
  }
  box.classList.toggle('has-sel', !!state.filterAuthor);
  $$('.t-branch', box).forEach(g => g.classList.toggle('sel', g.dataset.name === state.filterAuthor));
}

function toggleAuthorFilter(name) {
  state.filterAuthor = state.filterAuthor === name ? null : name;
  applyTreeSel();
  renderFeed();
}

function bindTree() {
  const box = $('#tree');
  const pick = e => {
    const g = e.target.closest('.t-branch');
    if (g) toggleAuthorFilter(g.dataset.name);
  };
  box.addEventListener('click', pick);
  box.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const g = e.target.closest('.t-branch');
    if (!g) return;
    e.preventDefault();
    toggleAuthorFilter(g.dataset.name);
  });
}

/* ---------- 5. Qidiruv ---------- */
function visiblePosts() {
  const q = state.q.trim().toLowerCase();
  return state.posts.filter(p => {
    if (state.filterAuthor && authorName(p) !== state.filterAuthor) return false;
    if (!q) return true;
    const hay = [p.title, p.author, (p.tags || []).join(' '), toPlain(p.content)]
      .join(' ').toLowerCase();
    return hay.includes(q);
  });
}

/* ---------- 6. Feed render ---------- */
function rowHtml(p, delay) {
  const ac = authorColor(p.author);
  const plain = toPlain(p.content);
  const cover = p.cover_image
    ? `<figure class="post-cover"><img src="${esc(p.cover_image)}" alt="${esc(p.title)}" loading="lazy"></figure>`
    : '';
  return `
  <article class="post-row" style="--d:${delay}ms;--ac:${ac}">
    <span class="post-node" aria-hidden="true"></span>
    <svg class="branch" viewBox="0 0 28 20" aria-hidden="true"><path d="M1 11 C 12 11, 15 3, 26 3"/></svg>
    <div class="post-card" data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(p.title)} — to'liq o'qish">
      <div class="post-meta">
        <span class="author"><span class="author-dot"></span>${esc(authorName(p))}</span>
        <span class="post-date">${esc(p.date || '')}${p.time ? ' · ' + esc(p.time) : ''}</span>
      </div>
      <h2 class="post-title">${esc(p.title)}</h2>
      ${cover}
      <p class="post-excerpt">${esc(plain.slice(0, CONFIG.excerptLen))}${plain.length > CONFIG.excerptLen ? '…' : ''}</p>
      <span class="read-more">To'liq o'qish
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </span>
    </div>
  </article>`;
}

function renderFeed() {
  const list = visiblePosts();
  const feed = $('#feed');
  if (!list.length) {
    feed.innerHTML = '';
    $('#empty').hidden = false;
    $('#feedEnd').hidden = true;
    return;
  }
  $('#empty').hidden = true;
  $('#feedEnd').hidden = false;
  feed.innerHTML = list.map((p, i) => rowHtml(p, Math.min(i * 45, 360))).join('');

  $$('.post-card', feed).forEach(card => {
    const open = () => openPost(+card.dataset.id);
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      open();
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
  $$('.post-cover img, .md-img', feed).forEach(img =>
    img.addEventListener('click', e => { e.stopPropagation(); openLightbox(img.src, img.alt); })
  );
}

/* ---------- 7. Modal (to'liq ko'rinish) ---------- */
function openPost(id) {
  const p = state.posts.find(x => x.id === id);
  if (!p) return;
  const ac = authorColor(p.author);
  $('#pmBody').innerHTML = `
    <header class="pm-head" style="--ac:${ac}">
      <span class="pm-author"><span class="author-dot"></span>${esc(authorName(p))}</span>
      <time>${esc(p.date || '')}${p.time ? ' · ' + esc(p.time) : ''}</time>
    </header>
    <h1 class="pm-title">${esc(p.title)}</h1>
    ${p.cover_image ? `<figure class="pm-cover"><img src="${esc(p.cover_image)}" alt="" loading="lazy"></figure>` : ''}
    <div class="pm-content">${renderMd(p.content)}</div>
  `;
  $$('.pm-content img, .pm-cover img').forEach(img =>
    img.addEventListener('click', () => openLightbox(img.src, img.alt))
  );
  showLayer($('#postModal'));
  $('#pmClose').focus();
}

/* ---------- 8. Lightbox ---------- */
function openLightbox(src, alt) {
  if (!src) return;
  $('#lbImg').src = src;
  $('#lbImg').alt = alt || '';
  showLayer($('#lightbox'));
}

/* ---------- 9. Layer ochish-yopish ---------- */
function showLayer(el) {
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('open'));
  document.body.classList.add('lock');
}
function hideLayer(el) {
  el.classList.remove('open');
  setTimeout(() => { el.hidden = true; }, 260);
  if (!['#postModal', '#formModal', '#lightbox'].some(s => !$(s).hidden)) {
    document.body.classList.remove('lock');
  }
}

/* ---------- 10. Yozish formasi → GitHub Issue (minimal) ---------- */
function firstWords(text, n) {
  return text.trim().split(/\s+/).slice(0, n).join(' ');
}

function openForm() {
  $('#formView').hidden = false;
  $('#formSuccess').hidden = true;
  $('#addForm').reset();
  $('#charCount').textContent = '0 / ' + CONFIG.maxLen;
  $('#formErr').hidden = true;
  showLayer($('#formModal'));
  setTimeout(() => $('#fText').focus(), 250);
}

function showFormErr(msg) {
  const e = $('#formErr');
  e.textContent = msg;
  e.hidden = false;
}

function bindForm() {
  const text = $('#fText');
  text.addEventListener('input', () => {
    $('#charCount').textContent = `${text.value.length} / ${CONFIG.maxLen}`;
  });

  $('#addForm').addEventListener('submit', e => {
    e.preventDefault();
    $('#formErr').hidden = true;

    const ism = $('#fIsm').value.trim() || 'Misafir';
    const matn = text.value.trim();

    if (matn.length < CONFIG.minLen) return showFormErr(`Xotira juda qisqa — kamida ${CONFIG.minLen} ta belgi yozing (hozir: ${matn.length}).`);
    if (matn.length > CONFIG.maxLen) return showFormErr(`Xotira uzun — ${CONFIG.maxLen} belgidan oshirmang.`);

    const title = `[Xotira] ${ism} — ${firstWords(matn, 8)}`;
    const body =
      `## Muallif\n` +
      `**Ism:** ${ism}\n\n` +
      `## Xotira\n${matn}\n\n---\n*Samir's blog orqali yuborildi*`;

    const url = `https://github.com/${CONFIG.repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener');

    $('#formView').hidden = true;
    $('#formSuccess').hidden = false;
  });

  $('#btnAgain').addEventListener('click', openForm);
}

/* ---------- 11. UI hodisalari ---------- */
function bindUI() {
  const toolbar = $('#toolbar');

  $('#search').addEventListener('input', e => {
    state.q = e.target.value;
    renderFeed();
  });

  $('#btn-add').addEventListener('click', openForm);
  $('#pmClose').addEventListener('click', () => hideLayer($('#postModal')));
  $('#fmClose').addEventListener('click', () => hideLayer($('#formModal')));
  $('#lbClose').addEventListener('click', () => hideLayer($('#lightbox')));

  ['#postModal', '#formModal'].forEach(s => {
    $(s).addEventListener('click', e => { if (e.target === $(s)) hideLayer($(s)); });
  });
  $('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') hideLayer($('#lightbox')); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#lightbox').hidden) return hideLayer($('#lightbox'));
    if (!$('#postModal').hidden) return hideLayer($('#postModal'));
    if (!$('#formModal').hidden) hideLayer($('#formModal'));
  });

  let tick = false;
  addEventListener('scroll', () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => {
      toolbar.classList.toggle('scrolled', scrollY > 8);
      tick = false;
    });
  }, { passive: true });

  bindForm();
  bindTree();
}

/* ---------- 12. Avto-raqam: yangi xotira → daraxt avtomatik o'sadi ---------- */
async function checkForUpdates() {
  try {
    const res = await fetch(CONFIG.dataUrl, { cache: 'no-store' });
    if (!res.ok) return;
    const raw = await res.text();
    if (raw === lastData) return;
    lastData = raw;
    const prevAuthors = new Set(state.posts.map(authorName));
    state.posts = JSON.parse(raw);
    sortPosts();
    renderFeed();
    buildTree(prevAuthors);
  } catch (e) { /* tarmoq yo'q — keyin qayta urinamiz */ }
}

function sortPosts() {
  state.posts.sort((a, b) =>
    String(b.date_iso || '').localeCompare(String(a.date_iso || '')) || (b.id - a.id)
  );
}

/* ---------- 13. Ishga tushirish ---------- */
async function init() {
  bindUI();
  try {
    const res = await fetch(CONFIG.dataUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    lastData = await res.text();
  } catch (err) {
    $('#feed').innerHTML =
      `<div class="empty"><svg class="empty-leaf" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" aria-hidden="true"><path d="M48 82 V52"/><path d="M48 58 C48 44 38 38 28 38 C28 50 38 58 48 58 Z"/><path d="M48 64 C48 50 58 44 68 44 C68 56 58 64 48 64 Z"/></svg>` +
      `<p>data.json yuklanmadi</p><span>${esc(err.message)} — fayl manzili va ismini tekshiring</span></div>`;
    return;
  }
  state.posts = JSON.parse(lastData);
  sortPosts();
  renderFeed();
  buildTree(null);
  setInterval(checkForUpdates, CONFIG.pollMs);
}

document.addEventListener('DOMContentLoaded', init);
