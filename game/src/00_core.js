// ============================================================
// BLED BROS — core: canvas, timing, input, save, utils, font
// ============================================================
'use strict';

const W = 480, H = 270, TS = 16;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
cv.width = W; cv.height = H;
ctx.imageSmoothingEnabled = false;

// On a phone held upright the browser often won't rotate (auto-rotate off, or an app that stays
// in portrait): the whole stage is then drawn turned 90deg, so turning the phone sideways shows
// the game upright either way. Touch coordinates are converted back into stage space.
const stage = document.getElementById('stage');
let rotated = false;
function resize() {
  const iw = window.innerWidth, ih = window.innerHeight;
  const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  rotated = coarse && ih > iw && !window.ReactNativeWebView;
  const sw = rotated ? ih : iw, sh = rotated ? iw : ih;
  stage.style.width = sw + 'px';
  stage.style.height = sh + 'px';
  stage.style.left = rotated ? iw + 'px' : '0px';
  stage.style.transform = rotated ? 'rotate(90deg)' : 'none';
  const s = Math.min(sw / W, sh / H);
  cv.style.width = Math.floor(W * s) + 'px';
  cv.style.height = Math.floor(H * s) + 'px';
  layoutTouch();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 250));
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
// screen point -> stage point (undoes the 90deg rotation)
function toStage(x, y) { return rotated ? { x: y, y: window.innerWidth - x } : { x, y }; }
// element box in stage space (layout offsets ignore CSS transforms)
function rectOf(el) {
  let l = 0, t = 0, e = el;
  while (e && e !== stage) { l += e.offsetLeft; t += e.offsetTop; e = e.offsetParent; }
  return { left: l, top: t, right: l + el.offsetWidth, bottom: t + el.offsetHeight, width: el.offsetWidth, height: el.offsetHeight };
}

// ---------- utils ----------
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return c;
}

// ---------- save ----------
const SAVE_KEY = 'bledbros_save_v1';
const defaultSave = () => ({
  unlocked: 0,          // highest level index playable
  cleared: {},          // levelIndex -> true
  wallet: 0,            // dirhams for the hanout
  lives: 5,
  char: 0,
  sound: true,
  inv: { msemen: 0, khamsa: 0 },
  baraka: 0,            // attack upgrade level
  best: {},             // levelIndex -> best score
  ending: false,
});
let SAVE = defaultSave();
function loadSave() {
  let raw = null;
  try { raw = window.__BLED_SAVE__ || localStorage.getItem(SAVE_KEY); } catch (e) { raw = window.__BLED_SAVE__ || null; }
  if (raw) {
    try { SAVE = Object.assign(defaultSave(), JSON.parse(raw)); } catch (e) { SAVE = defaultSave(); }
  }
}
function writeSave() {
  const s = JSON.stringify(SAVE);
  try { localStorage.setItem(SAVE_KEY, s); } catch (e) { /* storage unavailable */ }
  // mirror to the native shell (Expo) when embedded in a WebView
  if (window.ReactNativeWebView) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'save', data: s })); } catch (e) {}
  }
}

// ---------- input ----------
const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'attack', 'pause'];
const Input = {
  key: {}, touch: {}, pad: {}, mouse: {}, down: {}, prev: {},
  tap: null,           // {x,y} in game coords for this frame
  usedTouch: false,
  held(a) { return !!this.down[a]; },
  pressed(a) { return !!this.down[a] && !this.prev[a]; },
  update() {
    pollGamepad();
    for (const a of ACTIONS) this.down[a] = !!(this.key[a] || this.touch[a] || this.pad[a]);
    // left mouse button attacks, only while actually playing (in menus a click is a tap)
    if (this.mouse.attack && Game.scene === PlayScene && !PlayScene.paused && Game.level && Game.level.state !== 'intro') this.down.attack = true;
  },
  endFrame() {
    for (const a of ACTIONS) this.prev[a] = this.down[a];
    this.tap = null;
  },
  anyPressed() { return this.pressed('jump') || this.pressed('attack') || this.pressed('pause') || !!this.tap; },
};
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', KeyZ: 'jump', KeyI: 'jump',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyK: 'jump',
  KeyX: 'attack', KeyJ: 'attack', ShiftLeft: 'attack', KeyC: 'attack',
  Enter: 'pause', Escape: 'pause', KeyP: 'pause',
};
window.addEventListener('keydown', (e) => {
  const a = KEYMAP[e.code];
  if (a) { Input.key[a] = true; e.preventDefault(); }
  if (e.code === 'KeyF' && !e.repeat) toggleFullscreen();
  Audio.unlock();
});
window.addEventListener('keyup', (e) => {
  const a = KEYMAP[e.code];
  if (a) { Input.key[a] = false; e.preventDefault(); }
});
window.addEventListener('blur', () => { Input.key = {}; Input.touch = {}; Input.mouse = {}; });
// leaving the tab / app: release keys, pause the game and silence the music
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    Input.key = {}; Input.touch = {}; Input.mouse = {};
    if (Audio.ac) Audio.ac.suspend();
    if (Game.onHide) Game.onHide();
  } else if (Audio.ac) Audio.ac.resume();
});

// web on phones: go fullscreen + landscape on the first touch (Android browsers; iOS ignores it).
// The Expo app is already fullscreen and locked to landscape.
let fsTried = false;
document.addEventListener('touchend', () => { if (!fsTried) { fsTried = true; goFullscreen(); } }, { passive: true });
function goFullscreen() {
  if (window.ReactNativeWebView) return;
  const el = document.documentElement;
  if (document.fullscreenElement || !el.requestFullscreen) return;
  if (window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) return;
  el.requestFullscreen({ navigationUI: 'hide' })
    .then(() => (screen.orientation && screen.orientation.lock ? screen.orientation.lock('landscape') : null))
    .catch(() => {});
}
function toggleFullscreen() {
  if (window.ReactNativeWebView) return;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
}

function pollGamepad() {
  Input.pad = {};
  if (!navigator.getGamepads) return;
  const pads = navigator.getGamepads();
  for (const p of pads) {
    if (!p) continue;
    const ax = p.axes[0] || 0;
    const b = (i) => p.buttons[i] && p.buttons[i].pressed;
    if (ax < -0.4 || b(14)) Input.pad.left = true;
    if (ax > 0.4 || b(15)) Input.pad.right = true;
    if ((p.axes[1] || 0) < -0.5 || b(12)) Input.pad.up = true;
    if ((p.axes[1] || 0) > 0.5 || b(13)) Input.pad.down = true;
    if (b(0)) Input.pad.jump = true;
    if (b(2) || b(1)) Input.pad.attack = true;
    if (b(9)) Input.pad.pause = true;
  }
}

// ---------- touch controls (HTML overlay, multi-touch) ----------
const touchUI = document.getElementById('touch');
const tButtons = {};
['left', 'right', 'jump', 'attack', 'pause'].forEach((n) => {
  const el = document.createElement('div');
  el.className = 'tb tb-' + n;
  el.innerHTML = { left: '&#9664;', right: '&#9654;', jump: 'A', attack: 'B', pause: 'II' }[n];
  touchUI.appendChild(el);
  tButtons[n] = el;
});
function layoutTouch() {
  if (!touchUI) return;
  touchUI.style.display = Input.usedTouch ? 'block' : 'none';
}
// both take screen (client) coordinates
function toGame(clientX, clientY) {
  const p = toStage(clientX, clientY), r = rectOf(cv);
  return { x: ((p.x - r.left) / r.width) * W, y: ((p.y - r.top) / r.height) * H };
}
function hitButton(el, clientX, clientY, pad) {
  const p = toStage(clientX, clientY), r = rectOf(el);
  return p.x >= r.left - pad && p.x <= r.right + pad && p.y >= r.top - pad && p.y <= r.bottom + pad;
}
function handleTouches(e) {
  e.preventDefault();
  if (!Input.usedTouch) { Input.usedTouch = true; layoutTouch(); }
  Audio.unlock();
  const t = {};
  for (const tc of e.touches) {
    const { x, y } = toStage(tc.clientX, tc.clientY);
    // d-pad: left half of the dpad zone = left, right half = right (thumb can slide)
    const lr = rectOf(tButtons.left);
    const rr = rectOf(tButtons.right);
    if (y > lr.top - 40 && x < rr.right + 30) {
      if (x < (lr.right + rr.left) / 2) t.left = true; else t.right = true;
      if (y < lr.top - 10) t.up = true;
      continue;
    }
    if (hitButton(tButtons.jump, tc.clientX, tc.clientY, 18)) { t.jump = true; continue; }
    if (hitButton(tButtons.attack, tc.clientX, tc.clientY, 18)) { t.attack = true; continue; }
    if (hitButton(tButtons.pause, tc.clientX, tc.clientY, 10)) { t.pause = true; continue; }
  }
  Input.touch = t;
  for (const n of ['left', 'right', 'jump', 'attack', 'pause']) tButtons[n].classList.toggle('on', !!t[n]);
}
function handleTouchStartTap(e) {
  // a tap anywhere that is not on a control is forwarded to menus as a pointer tap
  for (const tc of e.changedTouches) {
    let onBtn = false;
    for (const n in tButtons) if (hitButton(tButtons[n], tc.clientX, tc.clientY, 18)) onBtn = true;
    if (!onBtn || !Input.usedTouch) Input.tap = toGame(tc.clientX, tc.clientY);
  }
}
document.addEventListener('touchstart', (e) => { handleTouchStartTap(e); handleTouches(e); }, { passive: false });
document.addEventListener('touchmove', handleTouches, { passive: false });
document.addEventListener('touchend', handleTouches, { passive: false });
document.addEventListener('touchcancel', handleTouches, { passive: false });
cv.addEventListener('mousedown', (e) => {
  Audio.unlock();
  Input.tap = toGame(e.clientX, e.clientY);
  if (e.button === 0 && !Input.usedTouch) Input.mouse.attack = true;
});
window.addEventListener('mouseup', (e) => { if (e.button === 0) Input.mouse.attack = false; });

// messages from the native shell (Android back button)
function onNativeMessage(ev) {
  let m = ev.data;
  try { m = typeof m === 'string' ? JSON.parse(m) : m; } catch (e) { return; }
  if (m && m.type === 'back') Game.onBack && Game.onBack();
}
window.addEventListener('message', onNativeMessage);
document.addEventListener('message', onNativeMessage);

// ---------- color helpers ----------
function hex2rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgb2hex(r, g, b) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
// amt > 0 lightens toward white, < 0 darkens; slight hue shift for nicer 16-bit ramps
function shade(h, amt) {
  const [r, g, b] = hex2rgb(h);
  if (amt >= 0) return rgb2hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (240 - b) * amt * 0.9);
  const a = -amt;
  return rgb2hex(r * (1 - a) * 0.95 + 10 * a, g * (1 - a), b * (1 - a) + 30 * a);
}

// ---------- pixel font (5x7, uppercase, accents) ----------
const GLYPHS = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
  B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.',
  D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####',
  F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####',
  H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '###|.#.|.#.|.#.|.#.|.#.|###',
  J: '..###|...#.|...#.|...#.|#..#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
  L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
  N: '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
  R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.',
  T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#',
  X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
  Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
  1: '.#.|##.|.#.|.#.|.#.|.#.|###',
  2: '.###.|#...#|....#|...#.|..#..|.#...|#####',
  3: '####.|....#|....#|.###.|....#|....#|####.',
  4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
  5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '.###.|#....|#....|####.|#...#|#...#|.###.',
  7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
  8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  9: '.###.|#...#|#...#|.####|....#|....#|.###.',
  '!': '#|#|#|#|#|.|#',
  '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '.': '.|.|.|.|.|.|#',
  ',': '..|..|..|..|..|.#|#.',
  ':': '.|#|.|.|.|#|.',
  ';': '..|.#|..|..|..|.#|#.',
  '-': '...|...|...|###|...|...|...',
  "'": '#|#|.|.|.|.|.',
  '/': '....#|...#.|...#.|..#..|.#...|.#...|#....',
  '(': '.#|#.|#.|#.|#.|#.|.#',
  ')': '#.|.#|.#|.#|.#|.#|#.',
  '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
  '=': '....|....|####|....|####|....|....',
  '>': '#...|.#..|..#.|...#|..#.|.#..|#...',
  '<': '...#|..#.|.#..|#...|.#..|..#.|...#',
  '·': '.|.|.|#|.|.|.',
  '@': '.....|##.##|#####|#####|.###.|..#..|.....', // heart
  '*': '..#..|#.#.#|.###.|#####|.###.|#.#.#|..#..', // sparkle / star
  ' ': '...|...|...|...|...|...|...',
};
const ACCENTS = {
  'É': ['E', 'acute'], 'È': ['E', 'grave'], 'Ê': ['E', 'circ'], 'Ë': ['E', 'uml'],
  'À': ['A', 'grave'], 'Â': ['A', 'circ'], 'Ç': ['C', 'ced'], 'Ù': ['U', 'grave'],
  'Û': ['U', 'circ'], 'Ô': ['O', 'circ'], 'Î': ['I', 'circ'], 'Ï': ['I', 'uml'],
};
const FONT = {};
for (const k in GLYPHS) {
  const rows = GLYPHS[k].split('|');
  FONT[k] = { w: rows[0].length, rows };
}
function glyphFor(ch) {
  ch = ch.toUpperCase();
  if (ch === '"') ch = "'";
  if (ch === '×') ch = 'X';
  if (ACCENTS[ch]) return { base: FONT[ACCENTS[ch][0]], acc: ACCENTS[ch][1] };
  return { base: FONT[ch] || FONT['?'], acc: null };
}
function textWidth(str, scale = 1) {
  let w = 0;
  for (const ch of str) w += (glyphFor(ch).base.w + 1) * scale;
  return Math.max(0, w - scale);
}
const textCache = new Map();
function renderTextCanvas(str, color, shadow) {
  const tw = textWidth(str) + 1;
  const c = makeCanvas(Math.max(1, tw), 11);
  const g = c.getContext('2d');
  const draw = (ox, oy, col) => {
    g.fillStyle = col;
    let x = ox;
    for (const ch of str) {
      const { base, acc } = glyphFor(ch);
      for (let r = 0; r < 7; r++)
        for (let q = 0; q < base.w; q++) if (base.rows[r][q] === '#') g.fillRect(x + q, oy + 2 + r, 1, 1);
      if (acc) {
        const m = Math.floor(base.w / 2);
        const pts = {
          acute: [[m + 1, 0], [m, 1]], grave: [[m - 1, 0], [m, 1]],
          circ: [[m - 1, 1], [m, 0], [m + 1, 1]], uml: [[m - 1, 1], [m + 1, 1]],
          ced: [[m, 9], [m - 1, 10]],
        }[acc];
        for (const [px, py] of pts) g.fillRect(x + px, oy + py, 1, 1);
      }
      x += base.w + 1;
    }
  };
  if (shadow) draw(1, 1, shadow);
  draw(0, 0, color);
  return c;
}
// draws text; y is the top of the cap height (accents go 2px above)
function drawText(str, x, y, color = '#fff', scale = 1, shadow = '#1a0f14', align = 'left') {
  str = String(str);
  const key = str + '|' + color + '|' + shadow;
  let c = textCache.get(key);
  if (!c) {
    if (textCache.size > 400) textCache.clear();
    c = renderTextCanvas(str, color, shadow);
    textCache.set(key, c);
  }
  let dx = x;
  if (align === 'center') dx = x - Math.floor(textWidth(str, scale) / 2);
  else if (align === 'right') dx = x - textWidth(str, scale);
  ctx.drawImage(c, Math.round(dx), Math.round(y - 2 * scale), c.width * scale, c.height * scale);
}
// word-wrap for dialog boxes
function wrapText(str, maxW) {
  const words = str.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textWidth(t) > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
