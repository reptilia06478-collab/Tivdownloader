/* ============================================================
   Tiv Downloader — script.js
   Developer: PANN
   ============================================================ */

/* ---------- KONFIGURASI ---------- */
const ENDPOINT = 'https://www.tikwm.com/api/';
const PROXIES = ['https://corsproxy.io/?url=', 'https://api.allorigins.win/raw?url='];
const KEYS = {
  history: 'tiv_history_v10',
  theme:   'tiv_theme_v10',
  stats:   'tiv_stats_v10',
  settings:'tiv_settings_v10'
};
const MAX_HISTORY = 60;
const MAX_RETRY = 2;

let state = {
  filter: 'all',
  slides: null,
  slideIdx: 0,
  caption: '',
  deferredPrompt: null,
  lastScrollY: 0
};

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

/* ---------- CANVAS: AURORA ---------- */
(function initAurora() {
  const canvas = document.getElementById('auroraCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const blobs = [
    { x: 0.15, y: 0.15, r: 0.5,  c: [59,91,255],   vx:  0.00030, vy:  0.00020 },
    { x: 0.85, y: 0.25, r: 0.45, c: [239,68,68],   vx: -0.00022, vy:  0.00028 },
    { x: 0.5,  y: 0.85, r: 0.5,  c: [30,58,138],   vx:  0.00020, vy: -0.00020 },
    { x: 0.7,  y: 0.7,  r: 0.4,  c: [220,38,38],   vx: -0.00030, vy:  0.00012 },
    { x: 0.25, y: 0.6,  r: 0.4,  c: [99,102,241],  vx:  0.00025, vy: -0.00025 },
    { x: 0.9,  y: 0.85, r: 0.35, c: [248,113,113], vx: -0.00015, vy:  0.00022 }
  ];
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  let t = 0;
  function draw() {
    const isLight = document.body.classList.contains('light');
    ctx.fillStyle = isLight ? '#f1f5f9' : '#0a0f1e';
    ctx.fillRect(0, 0, W, H);
    blobs.forEach((b, i) => {
      b.x += b.vx + Math.sin(t * 0.001 + i) * 0.0006;
      b.y += b.vy + Math.cos(t * 0.001 + i) * 0.0006;
      if (b.x < 0 || b.x > 1) b.vx *= -1;
      if (b.y < 0 || b.y > 1) b.vy *= -1;
      const cx = b.x * W, cy = b.y * H, rad = b.r * Math.max(W, H);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      const [r,g,bl] = b.c;
      const a = isLight ? 0.18 : 0.32;
      grad.addColorStop(0, `rgba(${r},${g},${bl},${a})`);
      grad.addColorStop(1, `rgba(${r},${g},${bl},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    });
    t++;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- CANVAS: PARTIKEL ---------- */
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    particles = [];
    const count = Math.min(55, Math.floor(W * H / 30000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.5
      });
    }
  }
  resize();
  window.addEventListener('resize', resize);
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const isLight = document.body.classList.contains('light');
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? 'rgba(59,91,255,0.4)' : 'rgba(147,180,255,0.55)';
      ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 130) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const a = (isLight ? 0.15 : 0.12) * (1 - d/130);
          ctx.strokeStyle = `rgba(59,91,255,${a})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- CANVAS: SHOOTING STARS ---------- */
(function initStars() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  function spawn() {
    stars.push({
      x: Math.random() * W * 0.9,
      y: Math.random() * H * 0.35,
      len: 80 + Math.random() * 110,
      speed: 9 + Math.random() * 5,
      angle: Math.PI / 4,
      life: 1
    });
  }
  setInterval(spawn, 3200);
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const isLight = document.body.classList.contains('light');
    stars.forEach((s, i) => {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len);
      const grad = ctx.createLinearGradient(
        s.x, s.y,
        s.x - Math.cos(s.angle) * s.len,
        s.y - Math.sin(s.angle) * s.len
      );
      grad.addColorStop(0, isLight
        ? `rgba(59,91,255,${s.life})`
        : `rgba(255,255,255,${s.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.stroke();
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.life -= 0.008;
      if (s.life <= 0) stars.splice(i, 1);
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- CANVAS: MESH GRADIENT ---------- */
(function initMesh() {
  const canvas = document.getElementById('meshCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  function draw() {
    const isLight = document.body.classList.contains('light');
    ctx.clearRect(0, 0, W, H);
    const cx1 = W * (0.5 + Math.sin(t * 0.0006) * 0.15);
    const cy1 = H * (0.4 + Math.cos(t * 0.0008) * 0.15);
    const grad = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, Math.max(W, H) * 0.6);
    if (isLight) {
      grad.addColorStop(0, 'rgba(99,102,241,0.04)');
    } else {
      grad.addColorStop(0, 'rgba(99,102,241,0.10)');
    }
    grad.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    t++;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- HELPER ---------- */
function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }

function setStatus(elId, msg, type) {
  const el = typeof elId === 'string' ? $(elId) : elId;
  if (!el) return;
  if (!msg) {
    el.className = 'status';
    el.innerHTML = '';
    return;
  }
  el.className = 'status show ' + (type || 'info');
  el.innerHTML = msg;
}

function toast(msg, duration) {
  duration = duration || 2400;
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

function showAchievement(text, icon) {
  const a = $('achievement');
  if (!a) return;
  a.querySelector('.achievement-icon').textContent = icon || '🏆';
  const txt = $('achievementText');
  if (txt) txt.textContent = text;
  a.classList.add('show');
  setTimeout(() => a.classList.remove('show'), 2800);
}

function formatNumber(n) {
  n = Number(n) || 0;
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isValidUrl(url) {
  return url && /(?:tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/i.test(url);
}

/* ---------- SUARA ---------- */
let audioCtx = null;
function playSound(type) {
  try {
    const settings = getSettings();
    if (settings.sound === false) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    if (type === 'click') {
      o.frequency.value = 640;
      g.gain.value = 0.05;
      o.start();
      o.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'success') {
      o.frequency.setValueAtTime(520, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(920, audioCtx.currentTime + 0.15);
      g.gain.value = 0.08;
      o.start();
      o.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'error') {
      o.frequency.setValueAtTime(320, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 0.2);
      g.gain.value = 0.08;
      o.start();
      o.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'pop') {
      o.frequency.setValueAtTime(880, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.08);
      g.gain.value = 0.06;
      o.start();
      o.stop(audioCtx.currentTime + 0.1);
    }
  } catch (e) {}
}

/* ---------- STATISTIK ---------- */
function getStats() {
  try {
    const s = JSON.parse(localStorage.getItem(KEYS.stats) || '{}');
    return {
      total: s.total || 0,
      today: s.today || 0,
      date: s.date || '',
      streak: s.streak || 0
    };
  } catch {
    return { total: 0, today: 0, date: '', streak: 0 };
  }
}

function bumpStats() {
  const s = getStats();
  const today = new Date().toDateString();
  if (s.date !== today) {
    if (s.date && (new Date(s.date).getTime() > Date.now() - 2 * 86400000)) {
      s.streak = (s.streak || 0) + 1;
    } else {
      s.streak = 1;
    }
    s.today = 0;
    s.date = today;
  }
  s.total = (s.total || 0) + 1;
  s.today = (s.today || 0) + 1;
  localStorage.setItem(KEYS.stats, JSON.stringify(s));
  renderStats();
}

function renderStats() {
  const s = getStats();
  animateNumber('statTotal', s.total);
  animateNumber('statToday', s.today);
  animateNumber('statStreak', s.streak);
}

function animateNumber(id, target) {
  const el = $(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const t0 = performance.now();
  const duration = 600;
  function step(t) {
    const p = Math.min((t - t0) / duration, 1);
    el.textContent = Math.floor(start + (target - start) * p);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

/* ---------- PENGATURAN ---------- */
function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.settings) || '{}');
  } catch {
    return {};
  }
}

function saveSettings(s) {
  try {
    localStorage.setItem(KEYS.settings, JSON.stringify(s));
  } catch {}
}

/* ---------- LOADING OVERLAY ---------- */
function showLoading(text) {
  const o = $('loadingOverlay');
  if (!o) return;
  const t = $('loadingText');
  if (t) t.textContent = text || 'MEMPROSES...';
  const p = $('loadingProgress');
  if (p) p.style.width = '0%';
  o.classList.add('show');
  let val = 0;
  const interval = setInterval(() => {
    val += Math.random() * 15;
    if (val > 90) val = 90;
    if (p) p.style.width = val + '%';
  }, 150);
  o._interval = interval;
}

function hideLoading() {
  const o = $('loadingOverlay');
  if (!o) return;
  const p = $('loadingProgress');
  if (p) p.style.width = '100%';
  setTimeout(() => {
    o.classList.remove('show');
    clearInterval(o._interval);
  }, 300);
}

/* ---------- MODAL ---------- */
function openModal(id) {
  const m = $(id);
  if (m) m.classList.add('show');
}

function closeModal(id) {
  const m = $(id);
  if (m) m.classList.remove('show');
}

/* ---------- DRAWER MENU ---------- */
function openDrawer() {
  const d = $('drawer');
  const b = $('drawerBackdrop');
  if (d) d.classList.add('show');
  if (b) b.classList.add('show');
  document.body.classList.add('menu-open');
  const btn = $('menuBtn');
  if (btn) btn.classList.add('menu-active');
}

function closeDrawer() {
  const d = $('drawer');
  const b = $('drawerBackdrop');
  if (d) d.classList.remove('show');
  if (b) b.classList.remove('show');
  document.body.classList.remove('menu-open');
  const btn = $('menuBtn');
  if (btn) btn.classList.remove('menu-active');
}

/* ---------- TEMA ---------- */
function toggleTheme() {
  playSound('click');
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem(KEYS.theme, isLight ? 'light' : 'dark');
  const btn = $('themeBtn');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  // Redraw aurora dengan warna baru
  setTimeout(() => {
    const canvas = $('auroraCanvas');
    if (canvas) {
      const evt = new Event('resize');
      window.dispatchEvent(evt);
    }
  }, 100);
}

function initTheme() {
  if (localStorage.getItem(KEYS.theme) === 'light') {
    document.body.classList.add('light');
    const btn = $('themeBtn');
    if (btn) btn.textContent = '☀️';
  }
}

/* ---------- TAB ---------- */
function switchTab(name) {
  playSound('click');
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.nav === name));
  $$('.panel').forEach(p => p.classList.remove('active'));
  const panel = $('panel-' + name);
  if (panel) panel.classList.add('active');
  if (name === 'history') renderHistory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- FAQ ---------- */
function toggleFaq(el) {
  if (!el || !el.parentElement) return;
  el.parentElement.classList.toggle('open');
  playSound('click');
}

/* ---------- CONFETTI ---------- */
function fireConfetti() {
  const colors = ['#3b5bff', '#ef4444', '#ffffff', '#5b7bff', '#f87171', '#6366f1'];
  for (let i = 0; i < 55; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.top = '-20px';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    c.style.width = c.style.height = (6 + Math.random() * 9) + 'px';
    c.style.animationDuration = (1.5 + Math.random() * 1.6) + 's';
    c.style.animationDelay = (Math.random() * 0.35) + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3600);
  }
}

/* ---------- RIWAYAT ---------- */
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.history) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(arr) {
  try {
    localStorage.setItem(KEYS.history, JSON.stringify(arr.slice(0, MAX_HISTORY)));
  } catch {}
}

function addHistory(d, url) {
  const arr = getHistory();
  const isSlide = Array.isArray(d.images) && d.images.length > 0;
  arr.unshift({
    url,
    title: d.title || '(tanpa deskripsi)',
    author: d.author && d.author.unique_id ? d.author.unique_id : '',
    cover: d.origin_cover || d.cover || '',
    type: isSlide ? 'slide' : 'video',
    date: new Date().toISOString()
  });
  saveHistory(arr);
}

function setFilter(f) {
  state.filter = f;
  $$('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === f));
  renderHistory();
  playSound('click');
}

function renderHistory() {
  const arr = getHistory();
  const search = $('historySearch');
  const q = search ? search.value.toLowerCase() : '';
  let filtered = arr;
  if (state.filter !== 'all') {
    filtered = filtered.filter(h => h.type === state.filter);
  }
  if (q) {
    filtered = filtered.filter(h => (
      h.title + ' ' + h.author + ' ' + h.url
    ).toLowerCase().includes(q));
  }
  const el = $('historyList');
  if (!el) return;
  if (!filtered.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">${q || state.filter !== 'all' ? 'Tidak ada hasil.' : 'Belum ada riwayat.'}</div>
      </div>`;
    return;
  }
  el.innerHTML = filtered.map(h => {
    const origIdx = arr.indexOf(h);
    return `
      <div class="history-item">
        <div class="batch-item-thumb">
          ${h.cover
            ? `<img src="${escapeHtml(h.cover)}" onerror="this.parentElement.innerHTML='🎬'">`
            : '🎬'}
        </div>
        <div class="history-item-info">
          <div class="history-item-title">${escapeHtml(h.title)}</div>
          <div class="history-item-date">
            ${h.type === 'slide' ? '🖼️' : '🎬'}
            ${h.author ? '@' + escapeHtml(h.author) + ' · ' : ''}
            ${new Date(h.date).toLocaleString('id-ID')}
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="reuseHistory(${origIdx})" title="Download ulang">↻</button>
      </div>`;
  }).join('');
}

function reuseHistory(i) {
  const arr = getHistory();
  if (!arr[i]) return;
  switchTab('video');
  const inp = $('urlInput');
  if (inp) inp.value = arr[i].url;
  handleFetch();
}

function clearHistory() {
  if (!confirm('Hapus semua riwayat?')) return;
  localStorage.removeItem(KEYS.history);
  renderHistory();
  toast('✅ Riwayat dihapus');
}

function copyAllHistory() {
  const arr = getHistory();
  if (!arr.length) {
    toast('Tidak ada riwayat.');
    return;
  }
  const text = arr.map(h => h.url).join('\n');
  navigator.clipboard.writeText(text)
    .then(() => toast('📋 Semua link tersalin!'))
    .catch(() => toast('❌ Gagal menyalin.'));
}

/* ---------- PASTE ---------- */
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      const inp = $('urlInput');
      if (inp) inp.value = text.trim();
      toast('📋 Link ditempel!');
    }
  } catch {
    toast('❌ Gagal akses clipboard.');
  }
}

/* ---------- TRENDING ---------- */
const TRENDING_LINKS = {
  anime:   'https://vt.tiktok.com/ZSqHKbkMa/',
  music:   'https://vt.tiktok.com/ZSqHKbkMa/',
  comedy:  'https://vt.tiktok.com/ZSqHKbkMa/',
  dance:   'https://vt.tiktok.com/ZSqHKbkMa/'
};

function fillTrending(type) {
  const inp = $('urlInput');
  if (inp) inp.value = TRENDING_LINKS[type] || TRENDING_LINKS.anime;
  switchTab('video');
  handleFetch();
}

/* ---------- FETCH API ---------- */
async function fetchFromAPI(tiktokUrl) {
  const apiUrl = ENDPOINT + '?url=' + encodeURIComponent(tiktokUrl) + '&hd=1';

  try {
    const res = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.code === 0 && data.data) return data;
    }
  } catch (e) {}

  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy + encodeURIComponent(apiUrl));
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.code === 0 && data.data) return data;
    } catch (e) {}
  }

  const err = new Error('Gagal mengambil data.');
  err.code = 'FETCH_FAIL';
  throw err;
}

async function fetchWithRetry(url) {
  let lastErr;
  for (let i = 0; i <= MAX_RETRY; i++) {
    try {
      return await fetchFromAPI(url);
    } catch (e) {
      lastErr = e;
      if (i < MAX_RETRY) {
        await new Promise(r => setTimeout(r, 800 * (i + 1)));
        toast(`⏳ Coba ulang ${i + 1}/${MAX_RETRY}...`, 1500);
      }
    }
  }
  throw lastErr;
}

function getErrorMessage(err, url) {
  if (!url || !isValidUrl(url)) {
    return 'Link tidak valid. Pastikan dari tiktok.com';
  }
  if (err.message && err.message.includes('private')) {
    return 'Akun private. Coba video dari akun publik.';
  }
  if (err.message && (err.message.includes('not found') || err.message.includes('404'))) {
    return 'Video tidak ditemukan atau sudah dihapus.';
  }
  if (err.message && (err.message.includes('timeout') || err.message.includes('network'))) {
    return 'Koneksi lambat. Coba lagi.';
  }
  if (err.code === 'FETCH_FAIL') {
    return 'Server sedang sibuk. Coba lagi 1-2 menit.';
  }
  return err.message || 'Terjadi kesalahan.';
}

/* ---------- DOWNLOAD VIDEO ---------- */
async function handleFetch() {
  const btn = $('fetchBtn');
  const inp = $('urlInput');
  if (!inp) return;
  const url = inp.value.trim();

  if (!url) {
    setStatus('status', 'Masukkan link TikTok dulu.', 'error');
    playSound('error');
    return;
  }
  if (!isValidUrl(url)) {
    setStatus('status', 'Link tidak valid. Pastikan dari tiktok.com', 'error');
    playSound('error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Loading';
  }
  showLoading('MENGAMBIL DATA...');
  setStatus('status', '', '');

  try {
    const data = await fetchWithRetry(url);
    hideLoading();
    setStatus('status', '✅ Berhasil! Data siap.', 'success');
    renderResult(data.data);
    addHistory(data.data, url);
    bumpStats();
    fireConfetti();
    playSound('success');
    showAchievement('Download siap! 🎉', '🏆');
  } catch (err) {
    hideLoading();
    setStatus('status', '❌ ' + getErrorMessage(err, url), 'error');
    const rc = $('resultContainer');
    if (rc) rc.innerHTML = '';
    playSound('error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Download';
    }
  }
}

function renderResult(d) {
  if (!d) {
    setStatus('status', 'Data kosong.', 'error');
    return;
  }
  const isSlideshow = Array.isArray(d.images) && d.images.length > 0;
  const avatar = d.author && d.author.avatar
    ? `<img src="${escapeHtml(d.author.avatar)}" onerror="this.parentElement.innerHTML='👤'">`
    : '👤';
  const name = d.author && d.author.unique_id
    ? '@' + escapeHtml(d.author.unique_id)
    : 'TikTok User';
  const desc = d.title || '(tanpa deskripsi)';

  let previewHtml = '';
  if (isSlideshow) {
    previewHtml = `
      <div class="video-preview" id="slideshowPreview">
        <img id="slideImg" src="${escapeHtml(d.images[0])}" loading="lazy">
        ${d.images.length > 1 ? `
          <div class="slideshow-nav">
            <button onclick="prevSlide()">‹</button>
            <div class="slideshow-indicator">
              <span id="slideIdx">1</span>/${d.images.length}
            </div>
            <button onclick="nextSlide()">›</button>
          </div>` : ''}
      </div>`;
    state.slides = d.images;
    state.slideIdx = 0;
  } else {
    previewHtml = `
      <div class="video-preview">
        <video controls playsinline preload="metadata" poster="${escapeHtml(d.origin_cover || '')}">
          <source src="${escapeHtml(d.play || d.wmplay || '')}" type="video/mp4">
        </video>
      </div>`;
  }

  const statsHtml = `
    <div class="stats">
      <div class="stat"><div class="stat-value">${formatNumber(d.play_count)}</div><div class="stat-label">Views</div></div>
      <div class="stat"><div class="stat-value">${formatNumber(d.digg_count)}</div><div class="stat-label">Likes</div></div>
      <div class="stat"><div class="stat-value">${formatNumber(d.comment_count)}</div><div class="stat-label">Comments</div></div>
      <div class="stat"><div class="stat-value">${formatNumber(d.share_count)}</div><div class="stat-label">Shares</div></div>
    </div>`;

  let extraMeta = '';
  if (d.music_info && d.music_info.title) {
    extraMeta = `
      <div style="padding: 10px 16px; font-size: 12px; color: var(--text-muted); border-bottom: 1px solid var(--border);">
        🎵 ${escapeHtml(d.music_info.title)}
        ${d.music_info.author ? ' · ' + escapeHtml(d.music_info.author) : ''}
      </div>`;
  }

  let downloadHtml = '';
  if (isSlideshow) {
    downloadHtml = `
      <div class="download-group-title">Slide Foto (${d.images.length})</div>
      <div class="download-row">
        ${d.images.slice(0, 4).map((img, i) =>
          `<a class="btn" href="${escapeHtml(img)}" target="_blank" rel="noopener" download="tiv_slide_${i+1}.jpg">🖼️ Foto ${i+1}</a>`
        ).join('')}
      </div>
      ${d.music ? `
        <div class="download-group-title" style="margin-top: 10px;">Audio</div>
        <div class="download-row" style="grid-template-columns:1fr;">
          <a class="btn btn-secondary" href="${escapeHtml(d.music)}" target="_blank" rel="noopener" download="tiv_audio.mp3">🎵 MP3</a>
        </div>` : ''}
    `;
  } else {
    downloadHtml = `
      <div class="download-group-title">Video</div>
      <div class="download-row">
        <a class="btn" href="${escapeHtml(d.hdplay || d.play)}" target="_blank" rel="noopener" download="tiv_hd.mp4">🎬 HD (No WM)</a>
        <a class="btn btn-secondary" href="${escapeHtml(d.play || d.wmplay)}" target="_blank" rel="noopener" download="tiv_sd.mp4">📱 SD</a>
      </div>
      ${d.music ? `
        <div class="download-group-title" style="margin-top: 10px;">Audio</div>
        <div class="download-row" style="grid-template-columns:1fr;">
          <a class="btn btn-secondary" href="${escapeHtml(d.music)}" target="_blank" rel="noopener" download="tiv_audio.mp3">🎵 MP3</a>
        </div>` : ''}
    `;
  }

  const safeDesc = desc
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/'/g, "\\'");
  const inp = $('urlInput');
  const originalUrl = inp ? inp.value.trim() : '';
  const safeUrl = originalUrl.replace(/'/g, "\\'");

  const rc = $('resultContainer');
  if (!rc) return;
  rc.innerHTML = `
    <div class="result">
      <div class="result-header">
        <div class="author-avatar">${avatar}</div>
        <div class="author-info">
          <div class="author-name">${name}</div>
          <div class="author-desc">${escapeHtml(desc)}</div>
        </div>
      </div>
      ${previewHtml}
      ${statsHtml}
      ${extraMeta}
      <div class="download-section">${downloadHtml}</div>
      <div class="actions-row">
        <button class="btn btn-secondary" onclick="copyCaption('${safeDesc}')">📋 Copy</button>
        <button class="btn btn-secondary" onclick="copyOriginalUrl('${safeUrl}')">🔗 Link</button>
        <button class="btn btn-secondary" onclick="shareVideo('${escapeHtml(name)}','${safeUrl}')">📤 Share</button>
        <button class="btn btn-secondary" onclick="resetAll()">🔄 Reset</button>
      </div>
    </div>`;

  state.caption = desc;
}

function prevSlide() {
  if (!state.slides) return;
  state.slideIdx = (state.slideIdx - 1 + state.slides.length) % state.slides.length;
  const img = $('slideImg');
  const idx = $('slideIdx');
  if (img) img.src = state.slides[state.slideIdx];
  if (idx) idx.textContent = state.slideIdx + 1;
}

function nextSlide() {
  if (!state.slides) return;
  state.slideIdx = (state.slideIdx + 1) % state.slides.length;
  const img = $('slideImg');
  const idx = $('slideIdx');
  if (img) img.src = state.slides[state.slideIdx];
  if (idx) idx.textContent = state.slideIdx + 1;
}

function copyCaption(text) {
  if (!text) {
    toast('Tidak ada caption.');
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => {
      toast('✅ Caption tersalin!');
      playSound('success');
    })
    .catch(() => toast('❌ Gagal.'));
}

function copyOriginalUrl(url) {
  if (!url) {
    toast('Tidak ada link.');
    return;
  }
  navigator.clipboard.writeText(url)
    .then(() => toast('🔗 Link asli tersalin!'))
    .catch(() => toast('❌ Gagal.'));
}

function shareVideo(name, url) {
  const text = `Tonton video ${name} di TikTok: ${url}`;
  if (navigator.share) {
    navigator.share({ title: 'Tiv Downloader', text, url }).catch(() => {});
  } else {
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, '_blank');
  }
}

function resetAll() {
  const inp = $('urlInput');
  const rc = $('resultContainer');
  if (inp) inp.value = '';
  if (rc) rc.innerHTML = '';
  setStatus('status', '');
  if (inp) inp.focus();
  state.slides = null;
}

/* ---------- AUDIO ---------- */
async function handleAudio() {
  const inp = $('audioInput');
  if (!inp) return;
  const url = inp.value.trim();

  if (!url) {
    setStatus('audioStatus', 'Masukkan link dulu.', 'error');
    return;
  }
  if (!isValidUrl(url)) {
    setStatus('audioStatus', 'Link tidak valid.', 'error');
    return;
  }

  showLoading('MENGAMBIL AUDIO...');
  const ar = $('audioResult');
  if (ar) ar.innerHTML = '';

  try {
    const data = await fetchWithRetry(url);
    const d = data.data;
    if (!d.music) throw new Error('Audio tidak ditemukan.');
    hideLoading();
    setStatus('audioStatus', '✅ Audio siap diunduh!', 'success');
    fireConfetti();
    playSound('success');
    showAchievement('Audio siap! 🎵', '🎵');
    if (ar) {
      ar.innerHTML = `
        <div class="result">
          <div class="result-header">
            <div class="author-avatar">🎵</div>
            <div class="author-info">
              <div class="author-name">Audio TikTok</div>
              <div class="author-desc">${escapeHtml((d.music_info && d.music_info.title) || d.title || 'Audio')}</div>
            </div>
          </div>
          <div class="download-section">
            <audio controls style="width: 100%;" src="${escapeHtml(d.music)}"></audio>
            <a class="btn btn-block" href="${escapeHtml(d.music)}" target="_blank" rel="noopener" download="tiv_audio.mp3" style="margin-top: 12px;">⬇️ Download MP3</a>
          </div>
        </div>`;
    }
  } catch (err) {
    hideLoading();
    setStatus('audioStatus', '❌ ' + getErrorMessage(err, url), 'error');
    playSound('error');
  }
}

/* ---------- BATCH ---------- */
async function handleBatch() {
  const inp = $('batchInput');
  if (!inp) return;
  const raw = inp.value.trim();

  if (!raw) {
    setStatus('batchStatus', 'Tempel minimal 1 link.', 'error');
    return;
  }
  const urls = raw.split('\n').map(s => s.trim()).filter(s => s && isValidUrl(s));
  if (!urls.length) {
    setStatus('batchStatus', 'Tidak ada link valid.', 'error');
    return;
  }

  const btn = $('batchBtn');
  if (btn) btn.disabled = true;
  const bl = $('batchList');
  if (bl) bl.innerHTML = '';
  const bp = $('batchProgressWrap');
  if (bp) {
    bp.innerHTML = `
      <div class="batch-progress">
        <span id="batchCount">0/${urls.length}</span>
        <div class="batch-progress-bar">
          <div class="batch-progress-fill" id="batchFill"></div>
        </div>
      </div>`;
  }
  setStatus('batchStatus', '<span class="spinner"></span> Memproses...', 'info');

  let ok = 0, fail = 0;
  for (let i = 0; i < urls.length; i++) {
    const bc = $('batchCount');
    const bf = $('batchFill');
    if (bc) bc.textContent = `${i+1}/${urls.length}`;
    if (bf) bf.style.width = ((i) / urls.length * 100) + '%';

    const item = document.createElement('div');
    item.className = 'batch-item';
    item.innerHTML = `
      <div class="batch-item-thumb">⏳</div>
      <div class="batch-item-info">
        <div class="batch-item-title">${escapeHtml(urls[i])}</div>
        <div class="batch-item-status">Memproses...</div>
      </div>`;
    if (bl) bl.appendChild(item);

    try {
      const data = await fetchWithRetry(urls[i]);
      const d = data.data;
      const cover = d.origin_cover || d.cover || '';
      const thumb = item.querySelector('.batch-item-thumb');
      const title = item.querySelector('.batch-item-title');
      const status = item.querySelector('.batch-item-status');
      const info = item.querySelector('.batch-item-info');
      if (thumb) {
        thumb.innerHTML = cover
          ? `<img src="${escapeHtml(cover)}" onerror="this.parentElement.innerHTML='🎬'">`
          : '🎬';
      }
      if (title) title.textContent = d.title || 'Tanpa deskripsi';
      const isSlide = Array.isArray(d.images) && d.images.length > 0;
      if (status) {
        status.innerHTML = `✅ Siap (${isSlide ? d.images.length + ' foto' : 'video'})`;
        status.className = 'batch-item-status ok';
      }
      const dlUrl = isSlide ? d.images[0] : (d.hdplay || d.play);
      if (info) {
        info.insertAdjacentHTML('beforeend', `
          <div style="margin-top: 8px;">
            <a class="btn btn-sm" href="${escapeHtml(dlUrl)}" target="_blank" rel="noopener" download="tiv_${ok+1}.mp4">⬇️ Download</a>
          </div>`);
      }
      ok++;
      bumpStats();
    } catch (e) {
      const thumb = item.querySelector('.batch-item-thumb');
      const status = item.querySelector('.batch-item-status');
      if (thumb) thumb.innerHTML = '❌';
      if (status) {
        status.textContent = '❌ Gagal';
        status.className = 'batch-item-status err';
      }
      fail++;
    }
    await new Promise(r => setTimeout(r, 600));
  }

  const bf = $('batchFill');
  if (bf) bf.style.width = '100%';
  setStatus('batchStatus', `✅ Selesai: ${ok} berhasil, ${fail} gagal.`, 'success');
  if (ok > 0) {
    fireConfetti();
    playSound('success');
    showAchievement(`${ok} video siap! 🎉`, '🏆');
  }
  if (btn) btn.disabled = false;
}

function clearBatch() {
  const inp = $('batchInput');
  const bl = $('batchList');
  const bp = $('batchProgressWrap');
  if (inp) inp.value = '';
  if (bl) bl.innerHTML = '';
  if (bp) bp.innerHTML = '';
  setStatus('batchStatus', '');
}

/* ---------- PWA INSTALL ---------- */
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  state.deferredPrompt = e;
  const banner = $('installBanner');
  if (banner) banner.classList.add('show');
});

function installPWA() {
  if (!state.deferredPrompt) {
    const banner = $('installBanner');
    if (banner) banner.classList.remove('show');
    return;
  }
  state.deferredPrompt.prompt();
  state.deferredPrompt.userChoice.then(() => {
    state.deferredPrompt = null;
    const banner = $('installBanner');
    if (banner) banner.classList.remove('show');
  });
}

/* ---------- AUTO-HIDE BOTTOM NAV ---------- */
window.addEventListener('scroll', () => {
  const nav = $('bottomNav');
  if (!nav) return;
  const y = window.scrollY;
  if (y > state.lastScrollY && y > 300) {
    nav.classList.add('hide');
  } else {
    nav.classList.remove('hide');
  }
  state.lastScrollY = y;
}, { passive: true });

/* ---------- SCROLL REVEAL ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(el => obs.observe(el));
}

/* ---------- KEYBOARD SHORTCUT ---------- */
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    if (document.activeElement === document.body) {
      setTimeout(() => {
        const inp = $('urlInput');
        if (!inp) return;
        const v = inp.value.trim();
        if (isValidUrl(v)) handleFetch();
      }, 100);
    }
  }
  if (e.key === 'Escape') {
    closeDrawer();
    $$('.modal-backdrop').forEach(m => m.classList.remove('show'));
  }
});

/* ---------- AUTO-DETECT CLIPBOARD ON LOAD ---------- */
window.addEventListener('load', async () => {
  try {
    const text = await navigator.clipboard.readText();
    const inp = $('urlInput');
    if (text && isValidUrl(text) && inp && !inp.value) {
      inp.value = text.trim();
      toast('📋 Link TikTok terdeteksi di clipboard!');
    }
  } catch {}
});

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const yr = $('year');
  if (yr) yr.textContent = new Date().getFullYear();
  initTheme();
  renderStats();
  renderHistory();
  initReveal();

  // Wire up input events
  const inp = $('urlInput');
  if (inp) {
    inp.addEventListener('paste', () => {
      setTimeout(() => {
        const v = inp.value.trim();
        if (isValidUrl(v)) handleFetch();
      }, 100);
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleFetch();
    });
  }

  const ai = $('audioInput');
  if (ai) {
    ai.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAudio();
    });
  }

  // Register service worker kalau ada
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.catch(() => {});
  }
});

/* ---------- EXPOSE KE WINDOW ---------- */
window.switchTab = switchTab;
window.toggleTheme = toggleTheme;
window.toggleFaq = toggleFaq;
window.openModal = openModal;
window.closeModal = closeModal;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.handleFetch = handleFetch;
window.handleAudio = handleAudio;
window.handleBatch = handleBatch;
window.clearBatch = clearBatch;
window.clearHistory = clearHistory;
window.copyAllHistory = copyAllHistory;
window.reuseHistory = reuseHistory;
window.setFilter = setFilter;
window.pasteFromClipboard = pasteFromClipboard;
window.fillTrending = fillTrending;
window.prevSlide = prevSlide;
window.nextSlide = nextSlide;
window.copyCaption = copyCaption;
window.copyOriginalUrl = copyOriginalUrl;
window.shareVideo = shareVideo;
window.resetAll = resetAll;
window.installPWA = installPWA;
