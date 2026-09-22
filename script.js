'use strict';

const CONFIG = {
  repo: 'samirbekjs/samirbekjs.github.io',
  dataUrl: 'data.json',
  excerptLen: 180,
  pollMs: 60000,
};
const PALETTE = ['#0071E3', '#7D5AFC', '#FF9500', '#30B0C7', '#34C759', '#A2845E', '#FF2D55', '#5E5CE6'];
const state = { posts: [], q: '', filterAuthor: null };
let lastData = '';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function hashOf(value) { let h = 0; for (const c of String(value)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function authorName(post) { return post.author || 'Samirbek Jabborov'; }
function authorColor(name) { return PALETTE[hashOf(name) % PALETTE.length]; }
function toPlain(value) { return String(value || '').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/^\s*[-*]\s+/gm, '').replace(/\s+/g, ' ').trim(); }
function renderMd(value) {
  return String(value || '').split(/\r?\n/).filter(Boolean).map(line => {
    let safe = esc(line).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    if (/^\s*[-*]\s+/.test(safe)) return `<li>${safe.replace(/^\s*[-*]\s+/, '')}</li>`;
    return `<p>${safe}</p>`;
  }).join('');
}
function sortPosts() { state.posts.sort((a, b) => String(b.date_iso || '').localeCompare(String(a.date_iso || '')) || Number(b.id || 0) - Number(a.id || 0)); }

function buildTree() {
  const box = $('#tree');
  if (!box) return;
  const authors = [...new Set(state.posts.map(authorName))];
  box.innerHTML = `<div class="tree-fallback">${authors.map(name => `<button class="tree-author" data-name="${esc(name)}" style="--ac:${authorColor(name)}">${esc(name)}</button>`).join('')}</div>`;
  $$('.tree-author', box).forEach(button => button.addEventListener('click', () => {
    state.filterAuthor = state.filterAuthor === button.dataset.name ? null : button.dataset.name;
    applyFilter();
  }));
}
function visiblePosts() {
  const query = state.q.trim().toLowerCase();
  return state.posts.filter(post => {
    if (state.filterAuthor && authorName(post) !== state.filterAuthor) return false;
    if (!query) return true;
    return [post.title, post.author, (post.tags || []).join(' '), toPlain(post.content)].join(' ').toLowerCase().includes(query);
  });
}
function rowHtml(post, index) {
  const plain = toPlain(post.content);
  const cover = post.cover_image ? `<figure class="post-cover"><img src="${esc(post.cover_image)}" alt="${esc(post.title)}" loading="lazy"></figure>` : '';
  return `<article class="post-row" style="--d:${Math.min(index * 45, 360)}ms;--ac:${authorColor(authorName(post))}"><span class="post-node" aria-hidden="true"></span><div class="post-card" data-id="${esc(post.id)}" role="button" tabindex="0"><div class="post-meta"><span class="author"><span class="author-dot"></span>${esc(authorName(post))}</span><span class="post-date">${esc(post.date || '')}${post.time ? ` · ${esc(post.time)}` : ''}</span></div><h2 class="post-title">${esc(post.title || 'Mening xotiram')}</h2>${cover}<p class="post-excerpt">${esc(plain.slice(0, CONFIG.excerptLen))}${plain.length > CONFIG.excerptLen ? '…' : ''}</p><span class="read-more">To'liq o'qish</span></div></article>`;
}
function renderFeed() {
  const feed = $('#feed');
  if (!feed) return;
  const posts = visiblePosts();
  feed.innerHTML = posts.map(rowHtml).join('');
  $('#empty').hidden = posts.length > 0;
  $('#feedEnd').hidden = posts.length === 0;
  $$('.post-card', feed).forEach(card => {
    const open = () => openPost(Number(card.dataset.id));
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
}
function applyFilter() { renderFeed(); buildTree(); }
function openPost(id) {
  const post = state.posts.find(item => Number(item.id) === id);
  if (!post || !$('#postModal')) return;
  $('#pmBody').innerHTML = `<header class="pm-head" style="--ac:${authorColor(authorName(post))}"><span class="pm-author"><span class="author-dot"></span>${esc(authorName(post))}</span><time>${esc(post.date || '')}${post.time ? ` · ${esc(post.time)}` : ''}</time></header><h1 class="pm-title">${esc(post.title || '')}</h1><div class="pm-content">${renderMd(post.content)}</div>`;
  showLayer($('#postModal'));
}
function showLayer(element) { if (!element) return; element.hidden = false; requestAnimationFrame(() => element.classList.add('open')); document.body.classList.add('lock'); }
function hideLayer(element) { if (!element) return; element.classList.remove('open'); setTimeout(() => { element.hidden = true; }, 260); document.body.classList.remove('lock'); }
function bindForm() {
  const form = $('#addForm');
  if (!form) return;
  const text = $('#fText');
  text?.addEventListener('input', () => { const count = $('#charCount'); if (count) count.textContent = `${text.value.length} / 3000`; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const content = text.value.trim();
    const error = $('#formErr');
    if (content.length < 20) { error.textContent = 'Xotira kamida 20 ta belgi bo‘lishi kerak.'; error.hidden = false; return; }
    const title = `[Xotira] Samirbek Jabborov — ${content.split(/\s+/).slice(0, 8).join(' ')}`;
    const body = `## Muallif\n**Ism:** Samirbek Jabborov\n\n## Xotira\n${content}`;
    window.open(`https://github.com/${CONFIG.repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`, '_blank', 'noopener');
    $('#formView').hidden = true; $('#formSuccess').hidden = false;
  });
}
function bindUI() {
  $('#search')?.addEventListener('input', event => { state.q = event.target.value; renderFeed(); });
  $('#pmClose')?.addEventListener('click', () => hideLayer($('#postModal')));
  $('#fmClose')?.addEventListener('click', () => hideLayer($('#formModal')));
  $('#lbClose')?.addEventListener('click', () => hideLayer($('#lightbox')));
  $('#btn-add')?.addEventListener('click', () => showLayer($('#formModal')));
  $('#btnAgain')?.addEventListener('click', () => { $('#formView').hidden = false; $('#formSuccess').hidden = true; });
  bindForm();
}
async function loadData() {
  try {
    const response = await fetch(`${CONFIG.dataUrl}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = await response.text();
    if (raw === lastData) return;
    lastData = raw; state.posts = JSON.parse(raw); sortPosts(); renderFeed(); buildTree();
  } catch (error) {
    const feed = $('#feed');
    if (feed) feed.innerHTML = `<div class="empty"><p>Ma'lumot yuklanmadi</p><span>${esc(error.message)}</span></div>`;
  }
}
document.addEventListener('DOMContentLoaded', async () => { bindUI(); await loadData(); setInterval(loadData, CONFIG.pollMs); });
