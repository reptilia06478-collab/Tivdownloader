/* ============================================================
   Tiv Downloader — games.js
   Developer: PANN
   ============================================================ */

/* ---------- GAME STATE ---------- */
const gameState = {
  current: 'quiz',
  quiz: {
    questions: [],
    index: 0,
    score: 0,
    answered: false,
    best: 0
  },
  reaction: {
    phase: 'idle', // idle | waiting | ready | tapped
    startTime: 0,
    timer: null,
    last: 0,
    best: 0,
    tries: 0
  },
  memory: {
    cards: [],
    flipped: [],
    matched: 0,
    moves: 0,
    startTime: 0,
    timer: null,
    running: false,
    lock: false
  },
  snake: {
    canvas: null,
    ctx: null,
    snake: [],
    dir: { x: 0, y: 0 },
    nextDir: { x: 0, y: 0 },
    food: { x: 0, y: 0 },
    score: 0,
    best: 0,
    speed: 1,
    interval: null,
    running: false,
    gridSize: 16,
    cellSize: 20
  }
};

/* ---------- QUIZ DATA ---------- */
const QUIZ_DATA = [
  {
    q: "Apa nama aplikasi TikTok sebelumnya?",
    options: ["Musical.ly", "Vine", "Dubsmash", "Byte"],
    correct: 0
  },
  {
    q: "TikTok dikembangkan oleh perusahaan mana?",
    options: ["Meta", "ByteDance", "Google", "Tencent"],
    correct: 1
  },
  {
    q: "Berapa durasi maksimal video TikTok standar?",
    options: ["1 menit", "3 menit", "10 menit", "15 menit"],
    correct: 2
  },
  {
    q: "Fitur TikTok untuk video pendek yang hilang 24 jam namanya?",
    options: ["Reels", "Story", "Snap", "Fleets"],
    correct: 1
  },
  {
    q: "Efek visual populer yang mengubah wajah disebut?",
    options: ["Filter", "Overlay", "Sticker", "Mask"],
    correct: 0
  },
  {
    q: "Apa arti 'FYP' di TikTok?",
    options: ["For You Page", "Follow Your Post", "Find Your People", "Feed Your Profile"],
    correct: 0
  },
  {
    q: "Tahun berapa TikTok dirilis secara global?",
    options: ["2016", "2018", "2019", "2020"],
    correct: 1
  },
  {
    q: "Sound viral di TikTok biasanya diambil dari?",
    options: ["Radio", "Musik populer & kreator lain", "TV", "Film"],
    correct: 1
  },
  {
    q: "Tanda centang biru di TikTok artinya?",
    options: ["Akun Premium", "Akun Terverifikasi", "Akun Lama", "Akun Bisnis"],
    correct: 1
  },
  {
    q: "Berapa jumlah minimum follower untuk live TikTok?",
    options: ["100", "500", "1000", "10000"],
    correct: 2
  }
];

/* ---------- HELPER ---------- */
function $(id) { return document.getElementById(id); }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showGameResult(icon, title, score) {
  const modal = $('gameResult');
  if (!modal) return;
  $('gameResultIcon').textContent = icon;
  $('gameResultTitle').textContent = title;
  $('gameResultScore').innerHTML = 'Skor: <strong>' + score + '</strong>';
  modal.classList.add('show');
}

function closeGameResult() {
  const modal = $('gameResult');
  if (modal) modal.classList.remove('show');
}

function restartCurrentGame() {
  closeGameResult();
  const g = gameState.current;
  if (g === 'quiz') startQuiz();
  else if (g === 'reaction') resetReaction();
  else if (g === 'memory') startMemory();
  else if (g === 'snake') startSnake();
}

/* ---------- SWITCH GAME ---------- */
function switchGame(name) {
  gameState.current = name;
  document.querySelectorAll('.game-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.game === name);
  });
  document.querySelectorAll('.game-panel').forEach(p => {
    p.classList.remove('active');
  });
  const panel = $('game-' + name);
  if (panel) panel.classList.add('active');

  // Stop snake kalau pindah game
  if (name !== 'snake' && gameState.snake.running) {
    stopSnake();
  }

  // Init game kalau perlu
  if (name === 'quiz' && gameState.quiz.questions.length === 0) startQuiz();
  if (name === 'memory' && gameState.memory.cards.length === 0) startMemory();
  if (name === 'snake') initSnakeCanvas();

  if (typeof playSound === 'function') playSound('click');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   GAME 1: KUIS TIKTOK
   ============================================================ */
function startQuiz() {
  const best = parseInt(localStorage.getItem('tiv_quiz_best') || '0');
  gameState.quiz = {
    questions: shuffle(QUIZ_DATA).slice(0, 10),
    index: 0,
    score: 0,
    answered: false,
    best: best
  };
  const restart = $('quizRestart');
  if (restart) restart.style.display = 'none';
  renderQuiz();
}

function renderQuiz() {
  const q = gameState.quiz;
  const question = q.questions[q.index];
  if (!question) return;

  const qEl = $('quizQuestion');
  const oEl = $('quizOptions');
  if (!qEl || !oEl) return;

  qEl.textContent = question.q;
  $('quizScore').textContent = q.score;
  $('quizQ').textContent = (q.index + 1) + '/10';
  $('quizBest').textContent = q.best;

  oEl.innerHTML = '';
  question.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.onclick = () => answerQuiz(i, btn);
    oEl.appendChild(btn);
  });

  q.answered = false;
}

function answerQuiz(idx, btn) {
  const q = gameState.quiz;
  if (q.answered) return;
  q.answered = true;

  const question = q.questions[q.index];
  const allBtns = document.querySelectorAll('.quiz-option');
  allBtns.forEach(b => b.disabled = true);

  if (idx === question.correct) {
    q.score += 10;
    btn.classList.add('correct');
    if (typeof playSound === 'function') playSound('success');
  } else {
    btn.classList.add('wrong');
    if (allBtns[question.correct]) allBtns[question.correct].classList.add('correct');
    if (typeof playSound === 'function') playSound('error');
  }

  $('quizScore').textContent = q.score;

  setTimeout(() => {
    q.index++;
    if (q.index >= q.questions.length) {
      finishQuiz();
    } else {
      renderQuiz();
    }
  }, 1200);
}

function finishQuiz() {
  const q = gameState.quiz;
  const final = q.score;
  if (final > q.best) {
    localStorage.setItem('tiv_quiz_best', String(final));
    q.best = final;
    if (typeof fireConfetti === 'function') fireConfetti();
    showGameResult('🏆', 'Rekor Baru!', final);
  } else {
    showGameResult('🎯', 'Selesai!', final);
  }
  const qEl = $('quizQuestion');
  if (qEl) qEl.textContent = 'Kuis selesai! Skor akhir: ' + final;
  const oEl = $('quizOptions');
  if (oEl) oEl.innerHTML = '';
  const restart = $('quizRestart');
  if (restart) restart.style.display = 'block';
}

/* ============================================================
   GAME 2: REACTION TAP
   ============================================================ */
function resetReaction() {
  const r = gameState.reaction;
  r.phase = 'idle';
  r.last = 0;
  r.best = parseInt(localStorage.getItem('tiv_reaction_best') || '0') || 0;
  r.tries = 0;
  updateReactionUI();
  const arena = $('reactionArena');
  if (arena) {
    arena.className = 'reaction-arena wait';
    const txt = $('reactionText');
    if (txt) txt.innerHTML = '<div style="font-size:42px;margin-bottom:8px;">🔴</div>Klik untuk mulai';
  }
}

function updateReactionUI() {
  const r = gameState.reaction;
  const last = $('reactionLast');
  const best = $('reactionBest');
  const tries = $('reactionTries');
  if (last) last.textContent = r.last ? r.last + '' : '-';
  if (best) best.textContent = r.best ? r.best + '' : '-';
  if (tries) tries.textContent = r.tries;
}

function reactionTap() {
  const r = gameState.reaction;
  const arena = $('reactionArena');
  const txt = $('reactionText');
  if (!arena || !txt) return;

  if (r.phase === 'idle') {
    r.phase = 'waiting';
    arena.className = 'reaction-arena wait';
    txt.innerHTML = '<div style="font-size:42px;margin-bottom:8px;">🔴</div>Tunggu warna hijau...';
    const delay = 1500 + Math.random() * 2500;
    r.timer = setTimeout(() => {
      r.phase = 'ready';
      r.startTime = performance.now();
      arena.className = 'reaction-arena ready';
      txt.innerHTML = '<div style="font-size:42px;margin-bottom:8px;">🟢</div>TAP SEKARANG!';
    }, delay);
  } else if (r.phase === 'waiting') {
    clearTimeout(r.timer);
    r.phase = 'idle';
    txt.innerHTML = '<div style="font-size:42px;margin-bottom:8px;">⚠️</div>Terlalu cepat! Coba lagi';
    if (typeof playSound === 'function') playSound('error');
  } else if (r.phase === 'ready') {
    const elapsed = Math.round(performance.now() - r.startTime);
    r.last = elapsed;
    r.tries++;
    if (r.best === 0 || elapsed < r.best) {
      r.best = elapsed;
      localStorage.setItem('tiv_reaction_best', String(elapsed));
      if (typeof fireConfetti === 'function') fireConfetti();
      txt.innerHTML = '<div style="font-size:42px;margin-bottom:8px;">🏆</div>Rekor baru: ' + elapsed + ' ms!';
    } else {
      txt.innerHTML = '<div style="font-size:42px;margin-bottom:8px;">⚡</div>' + elapsed + ' ms!';
    }
    if (typeof playSound === 'function') playSound('success');
    r.phase = 'idle';
    updateReactionUI();
  } else {
    resetReaction();
  }
}

/* ============================================================
   GAME 3: MEMORY CARD
   ============================================================ */
const MEMORY_EMOJIS = ['🎬', '🎵', '🔥', '💎', '🚀', '🌟', '🎮', '🎨'];

function startMemory() {
  const m = gameState.memory;
  const cards = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS];
  m.cards = shuffle(cards).map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false
  }));
  m.flipped = [];
  m.matched = 0;
  m.moves = 0;
  m.running = true;
  m.lock = false;
  m.startTime = Date.now();
  if (m.timer) clearInterval(m.timer);
  m.timer = setInterval(updateMemoryTime, 1000);
  renderMemory();
  updateMemoryUI();
}

function updateMemoryTime() {
  const m = gameState.memory;
  if (!m.running) return;
  const secs = Math.floor((Date.now() - m.startTime) / 1000);
  const timeEl = $('memoryTime');
  if (timeEl) timeEl.textContent = secs + 's';
}

function updateMemoryUI() {
  const m = gameState.memory;
  const movesEl = $('memoryMoves');
  const pairsEl = $('memoryPairs');
  if (movesEl) movesEl.textContent = m.moves;
  if (pairsEl) pairsEl.textContent = (m.matched / 2) + '/8';
}

function renderMemory() {
  const grid = $('memoryGrid');
  if (!grid) return;
  grid.innerHTML = '';
  gameState.memory.cards.forEach(card => {
    const el = document.createElement('div');
    el.className = 'memory-card';
    if (card.flipped || card.matched) {
      el.classList.add('flipped');
      el.textContent = card.emoji;
    } else {
      el.innerHTML = '<span class="card-back">❓</span>';
    }
    if (card.matched) el.classList.add('matched');
    el.onclick = () => flipMemoryCard(card.id);
    grid.appendChild(el);
  });
}

function flipMemoryCard(id) {
  const m = gameState.memory;
  if (m.lock) return;
  const card = m.cards.find(c => c.id === id);
  if (!card || card.flipped || card.matched) return;
  if (m.flipped.length >= 2) return;

  card.flipped = true;
  m.flipped.push(card);
  renderMemory();

  if (m.flipped.length === 2) {
    m.moves++;
    updateMemoryUI();
    const [a, b] = m.flipped;
    if (a.emoji === b.emoji) {
      a.matched = true;
      b.matched = true;
      m.matched += 2;
      m.flipped = [];
      if (typeof playSound === 'function') playSound('pop');
      renderMemory();
      updateMemoryUI();
      if (m.matched === m.cards.length) {
        finishMemory();
      }
    } else {
      m.lock = true;
      if (typeof playSound === 'function') playSound('error');
      setTimeout(() => {
        a.flipped = false;
        b.flipped = false;
        m.flipped = [];
        m.lock = false;
        renderMemory();
      }, 800);
    }
  }
}

function finishMemory() {
  const m = gameState.memory;
  m.running = false;
  clearInterval(m.timer);
  const secs = Math.floor((Date.now() - m.startTime) / 1000);
  const best = parseInt(localStorage.getItem('tiv_memory_best') || '9999');
  const score = Math.max(0, 1000 - m.moves * 10 - secs * 2);
  if (m.moves < best || best === 9999) {
    localStorage.setItem('tiv_memory_best', String(m.moves));
    if (typeof fireConfetti === 'function') fireConfetti();
    showGameResult('🏆', 'Rekor Baru!', score);
  } else {
    showGameResult('🧠', 'Selesai!', score);
  }
}

/* ============================================================
   GAME 4: SNAKE CLASSIC
   ============================================================ */
function initSnakeCanvas() {
  const canvas = $('snakeCanvas');
  if (!canvas) return;
  gameState.snake.canvas = canvas;
  gameState.snake.ctx = canvas.getContext('2d');
  if (!gameState.snake.running) {
    drawSnake();
  }
}

function startSnake() {
  const s = gameState.snake;
  initSnakeCanvas();
  if (!s.canvas) return;

  const gridSize = 16;
  const canvasSize = s.canvas.width;
  const cellSize = canvasSize / gridSize;

  s.gridSize = gridSize;
  s.cellSize = cellSize;
  s.snake = [
    { x: 8, y: 8 },
    { x: 7, y: 8 },
    { x: 6, y: 8 }
  ];
  s.dir = { x: 1, y: 0 };
  s.nextDir = { x: 1, y: 0 };
  s.score = 0;
  s.speed = 1;
  s.running = true;
  s.best = parseInt(localStorage.getItem('tiv_snake_best') || '0');
  spawnSnakeFood();

  const scoreEl = $('snakeScore');
  if (scoreEl) scoreEl.textContent = '0';
  const bestEl = $('snakeBest');
  if (bestEl) bestEl.textContent = s.best;
  const speedEl = $('snakeSpeed');
  if (speedEl) speedEl.textContent = '1x';

  if (s.interval) clearInterval(s.interval);
  s.interval = setInterval(tickSnake, 150);
  drawSnake();
}

function stopSnake() {
  const s = gameState.snake;
  s.running = false;
  if (s.interval) {
    clearInterval(s.interval);
    s.interval = null;
  }
}

function spawnSnakeFood() {
  const s = gameState.snake;
  const g = s.gridSize;
  let attempts = 0;
  while (attempts < 100) {
    const fx = Math.floor(Math.random() * g);
    const fy = Math.floor(Math.random() * g);
    if (!s.snake.some(seg => seg.x === fx && seg.y === fy)) {
      s.food = { x: fx, y: fy };
      return;
    }
    attempts++;
  }
  s.food = { x: 0, y: 0 };
}

function tickSnake() {
  const s = gameState.snake;
  if (!s.running) return;

  s.dir = { ...s.nextDir };

  const head = s.snake[0];
  const newHead = { x: head.x + s.dir.x, y: head.y + s.dir.y };

  // Cek tabrakan dinding
  if (newHead.x < 0 || newHead.x >= s.gridSize || newHead.y < 0 || newHead.y >= s.gridSize) {
    endSnake();
    return;
  }

  // Cek tabrakan diri sendiri
  if (s.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
    endSnake();
    return;
  }

  s.snake.unshift(newHead);

  // Makan apel?
  if (newHead.x === s.food.x && newHead.y === s.food.y) {
    s.score += 10;
    if (typeof playSound === 'function') playSound('pop');
    const scoreEl = $('snakeScore');
    if (scoreEl) scoreEl.textContent = s.score;

    // Speed up tiap 50 poin
    const newSpeed = Math.floor(s.score / 50) + 1;
    if (newSpeed !== s.speed) {
      s.speed = newSpeed;
      const speedEl = $('snakeSpeed');
      if (speedEl) speedEl.textContent = s.speed + 'x';
      clearInterval(s.interval);
      const interval = Math.max(60, 150 - (s.speed - 1) * 15);
      s.interval = setInterval(tickSnake, interval);
    }

    spawnSnakeFood();
  } else {
    s.snake.pop();
  }

  drawSnake();
}

function drawSnake() {
  const s = gameState.snake;
  if (!s.ctx || !s.canvas) return;
  const ctx = s.ctx;
  const cell = s.cellSize;
  const canvasSize = s.canvas.width;

  // Background
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Grid lines
  ctx.strokeStyle = 'rgba(59,91,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= s.gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, canvasSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cell);
    ctx.lineTo(canvasSize, i * cell);
    ctx.stroke();
  }

  // Food
  if (s.food) {
    const fx = s.food.x * cell + cell / 2;
    const fy = s.food.y * cell + cell / 2;
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(fx, fy, cell / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Snake
  s.snake.forEach((seg, i) => {
    const x = seg.x * cell;
    const y = seg.y * cell;
    if (i === 0) {
      ctx.fillStyle = '#5b7bff';
      ctx.shadowColor = '#3b5bff';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = `rgba(59,91,255,${1 - i / (s.snake.length + 5)})`;
      ctx.shadowBlur = 0;
    }
    ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4);
    ctx.shadowBlur = 0;
  });

  // Overlay kalau game selesai
  if (!s.running && s.score > 0) {
    ctx.fillStyle = 'rgba(10,15,30,0.75)';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvasSize / 2, canvasSize / 2 - 10);
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Skor: ' + s.score, canvasSize / 2, canvasSize / 2 + 18);
  }
}

function snakeDir(dir) {
  const s = gameState.snake;
  if (!s.running) return;
  const map = {
    up:    { x: 0,  y: -1 },
    down:  { x: 0,  y: 1 },
    left:  { x: -1, y: 0 },
    right: { x: 1,  y: 0 }
  };
  const d = map[dir];
  if (!d) return;
  // Nggak bisa belok 180 derajat
  if (s.dir.x + d.x === 0 && s.dir.y + d.y === 0) return;
  s.nextDir = d;
  if (typeof playSound === 'function') playSound('click');
}

function endSnake() {
  const s = gameState.snake;
  stopSnake();
  drawSnake();
  if (typeof playSound === 'function') playSound('error');

  if (s.score > s.best) {
    s.best = s.score;
    localStorage.setItem('tiv_snake_best', String(s.score));
    if (typeof fireConfetti === 'function') fireConfetti();
    setTimeout(() => showGameResult('🏆', 'Rekor Baru!', s.score), 400);
  } else {
    setTimeout(() => showGameResult('🐍', 'Game Over', s.score), 400);
  }
  const bestEl = $('snakeBest');
  if (bestEl) bestEl.textContent = s.best;
}

/* ============================================================
   KEYBOARD: SNAKE + ESC
   ============================================================ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (typeof closeGameResult === 'function') closeGameResult();
  }
  if (gameState.current !== 'snake') return;
  if (!gameState.snake.running) return;
  const key = e.key.toLowerCase();
  if (key === 'arrowup' || key === 'w')    { e.preventDefault(); snakeDir('up'); }
  if (key === 'arrowdown' || key === 's')  { e.preventDefault(); snakeDir('down'); }
  if (key === 'arrowleft' || key === 'a')  { e.preventDefault(); snakeDir('left'); }
  if (key === 'arrowright' || key === 'd') { e.preventDefault(); snakeDir('right'); }
});

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const yr = $('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // Init game pertama
  startQuiz();
  resetReaction();
  initSnakeCanvas();

  // Auto-start memory pas pertama buka
  setTimeout(() => {
    if (gameState.memory.cards.length === 0) startMemory();
  }, 500);
});

/* ---------- EXPOSE ---------- */
window.switchGame = switchGame;
window.startQuiz = startQuiz;
window.resetReaction = resetReaction;
window.reactionTap = reactionTap;
window.startMemory = startMemory;
window.startSnake = startSnake;
window.snakeDir = snakeDir;
window.closeGameResult = closeGameResult;
window.restartCurrentGame = restartCurrentGame;
