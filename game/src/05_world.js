// ============================================================
// Themes: tiles (autotiled) + parallax backgrounds
// ============================================================
const THEMES = {
  fes: {
    sky: ['#5ab0e8', '#8ccaf0', '#c8e4f0', '#f6e2b8'], bg: 'medina', night: false,
    ground: { top: '#d8c0a0', top2: '#b89a78', body: '#9a6a44', body2: '#7a4e30', line: '#5e3a24' },
    brick: '#c0603a', stone: 'zellige', plat: '#8a5a30', liquid: 'dye', spike: 'iron',
  },
  tannery: {
    sky: ['#4aa0e0', '#80c0ec', '#d0e6ee', '#f0d8a8'], bg: 'tannery', night: false,
    ground: { top: '#d0b48a', top2: '#ae8c64', body: '#a06a3e', body2: '#7c4c2a', line: '#5a3620' },
    brick: '#b85a34', stone: 'zellige', plat: '#7a5028', liquid: 'dye', spike: 'iron',
  },
  souknight: {
    sky: ['#120a2a', '#24164a', '#3a2460', '#5a3060'], bg: 'souknight', night: true,
    ground: { top: '#8a7a6a', top2: '#6a5a50', body: '#5a3a2a', body2: '#44281c', line: '#2c1a14' },
    brick: '#8a4030', stone: 'zellige', plat: '#5a3a20', liquid: 'dye', spike: 'iron',
  },
  chaouen: {
    sky: ['#58b8f8', '#90d4fc', '#d0f0ff', '#f0faff'], bg: 'chaouen', night: false,
    ground: { top: '#f4f8ff', top2: '#c8d8f0', body: '#3a7ad8', body2: '#2a5cb0', line: '#1c3c80' },
    brick: '#4a8ae8', stone: 'blueblock', plat: '#2a5cb0', liquid: 'water', spike: 'iron',
  },
  rasma: {
    sky: ['#4ab0e8', '#80ccf0', '#c0ecf8', '#e8fff8'], bg: 'rasma', night: false,
    ground: { top: '#7ac050', top2: '#4a9a3a', body: '#4a7ac8', body2: '#2e58a0', line: '#1c3a78' },
    brick: '#4a8ae8', stone: 'blueblock', plat: '#7a5a3a', liquid: 'water', spike: 'iron',
  },
  cedar: {
    sky: ['#2a1a40', '#5a2a50', '#c0504a', '#f0a050'], bg: 'cedar', night: true,
    ground: { top: '#4a7a3a', top2: '#2e5a2a', body: '#5a3e2a', body2: '#3e2a1c', line: '#24180e' },
    brick: '#7a5a3a', stone: 'rock', plat: '#6a4a2a', liquid: 'water', spike: 'iron',
  },
  desert: {
    sky: ['#3a90e0', '#70b8f0', '#b8e0f0', '#ffe8b0'], bg: 'dunes', night: false,
    ground: { top: '#f8d488', top2: '#e8b868', body: '#e0a858', body2: '#c88a40', line: '#a06a2a' },
    brick: '#c07848', stone: 'kasbah', plat: '#a07040', liquid: 'quicksand', spike: 'cactus',
  },
  desertnight: {
    sky: ['#06061a', '#101438', '#20285a', '#3a3a6a'], bg: 'dunesnight', night: true,
    ground: { top: '#b8a0a0', top2: '#9a8090', body: '#8a6a6a', body2: '#6a5060', line: '#4a3448' },
    brick: '#8a5a50', stone: 'kasbah', plat: '#6a5040', liquid: 'quicksand', spike: 'cactus',
  },
  dunesfire: {
    sky: ['#1a0610', '#4a0a14', '#a02a14', '#f07a20'], bg: 'dunesfire', night: false,
    ground: { top: '#e0a060', top2: '#c07840', body: '#a85a30', body2: '#88401e', line: '#5a2410' },
    brick: '#a05030', stone: 'kasbah', plat: '#7a4a2a', liquid: 'quicksand', spike: 'cactus',
  },
  atlas: {
    sky: ['#3a7ad0', '#6aa0e0', '#a8cce8', '#e0ecf4'], bg: 'atlas', night: false,
    ground: { top: '#f4f8ff', top2: '#c8d8e8', body: '#a8503a', body2: '#86382a', line: '#5a2218' },
    brick: '#b05a3a', stone: 'rock', plat: '#6a4a2a', liquid: 'ice', spike: 'iron',
  },
  jemaa: {
    sky: ['#0a0a24', '#1a1640', '#2e1e50', '#4a2a50'], bg: 'jemaa', night: true,
    ground: { top: '#c88058', top2: '#a8603e', body: '#8a4a30', body2: '#6a3420', line: '#401c10' },
    brick: '#b05038', stone: 'zellige', plat: 'awning', liquid: 'dye', spike: 'coals',
  },
  oued: {
    sky: ['#04040e', '#0a1028', '#142040', '#1e3048'], bg: 'oued', night: true,
    ground: { top: '#7a8a7a', top2: '#5a6a60', body: '#4a4a52', body2: '#36363e', line: '#202028' },
    brick: '#5a5a66', stone: 'rock', plat: '#4a4048', liquid: 'water', spike: 'iron',
  },
};

// ---------------- tiles ----------------
const tileCache = {};
function tileCanvas(theme, key, fn) {
  const k = theme + ':' + key;
  if (!tileCache[k]) {
    const c = makeCanvas(TS, TS);
    fn(c.getContext('2d'), THEMES[theme]);
    tileCache[k] = c;
  }
  return tileCache[k];
}
function px(g, x, y, c, w = 1, h = 1) { g.fillStyle = c; g.fillRect(x, y, w, h); }

// ground tile with autotile flags: t = exposed top, l/r = exposed sides, v = variant
function groundTile(theme, t, l, r, v) {
  return tileCanvas(theme, `g${+t}${+l}${+r}${v}`, (g, th) => {
    const G = th.ground;
    const R = mulberry32(v * 977 + 13);
    px(g, 0, 0, G.body, 16, 16);
    if (th.stone === 'kasbah' || th.liquid === 'quicksand') {
      // sand: ripples + specks
      for (let i = 0; i < 10; i++) px(g, Math.floor(R() * 16), Math.floor(R() * 16), R() < 0.5 ? G.body2 : shade(G.body, 0.15));
      for (let y = 4; y < 16; y += 5) for (let x = 0; x < 16; x++) if ((x + y + v) % 7 < 3) px(g, x, y + (x % 3 === 0 ? 1 : 0), G.body2);
    } else {
      // stones / bricks pattern
      const off = v % 2 ? 4 : 0;
      for (let row = 0; row < 4; row++) {
        const y = row * 4;
        px(g, 0, y + 3, G.line, 16, 1);
        const s = (row % 2 ? 6 : 0) + off;
        for (let x = s % 8; x < 16; x += 8) px(g, x, y, G.line, 1, 3);
        for (let x = 0; x < 16; x++) if (R() < 0.12) px(g, x, y + 1, shade(G.body, 0.12));
        px(g, (s + 2) % 16, y, shade(G.body, 0.18), 3, 1);
      }
      for (let i = 0; i < 4; i++) px(g, Math.floor(R() * 16), Math.floor(R() * 16), G.body2);
    }
    if (l) { px(g, 0, 0, G.line, 1, 16); px(g, 1, 0, G.body2, 1, 16); }
    if (r) { px(g, 15, 0, G.line, 1, 16); px(g, 14, 0, G.body2, 1, 16); }
    if (t) {
      px(g, 0, 0, G.top, 16, 4);
      px(g, 0, 4, G.top2, 16, 1);
      for (let x = 0; x < 16; x++) {
        if ((x + v) % 3 === 0) px(g, x, 5, G.top2);
        if ((x * 7 + v) % 5 === 0) px(g, x, 1, shade(G.top, 0.3));
      }
      px(g, 0, 0, shade(G.top, 0.35), 16, 1);
      if (th === THEMES.chaouen) { px(g, 0, 5, G.line, 16, 1); }
      if (th.bg === 'atlas' || th.bg === 'rasma' || th.bg === 'cedar') { // snow drips / grass blades
        for (let x = 0; x < 16; x += 3) px(g, x + (v % 2), 5, G.top2, 1, 1 + ((x + v) % 3));
      }
      if (l) px(g, 0, 0, G.line, 1, 5);
      if (r) px(g, 15, 0, G.line, 1, 5);
    }
  });
}
function brickTile(theme) {
  return tileCanvas(theme, 'brick', (g, th) => {
    const c = th.brick, d = shade(c, -0.35), l = shade(c, 0.25);
    px(g, 0, 0, c, 16, 16);
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      px(g, 0, y + 3, d, 16, 1);
      const s = row % 2 ? 4 : 0;
      for (let x = s; x < 16; x += 8) { px(g, x, y, d, 1, 3); px(g, x + 1, y, l, 3, 1); }
    }
    px(g, 0, 0, l, 16, 1); px(g, 0, 15, d, 16, 1);
  });
}
function stoneTile(theme) {
  return tileCanvas(theme, 'stone', (g, th) => {
    if (th.stone === 'zellige') {
      px(g, 0, 0, '#f0e8d8', 16, 16);
      const cs = th.night ? ['#2a7a5a', '#2a4a9a'] : ['#1f8a5a', '#2a5ab8'];
      // 8-point star tile
      px(g, 5, 1, cs[0], 6, 14); px(g, 1, 5, cs[0], 14, 6);
      px(g, 3, 3, cs[0], 10, 10);
      px(g, 6, 6, '#f2c230', 4, 4); px(g, 7, 7, cs[1], 2, 2);
      px(g, 0, 0, cs[1], 2, 2); px(g, 14, 0, cs[1], 2, 2); px(g, 0, 14, cs[1], 2, 2); px(g, 14, 14, cs[1], 2, 2);
      px(g, 0, 15, '#a89880', 16, 1); px(g, 15, 0, '#a89880', 1, 16);
      if (th.night) { g.fillStyle = 'rgba(20,10,50,0.35)'; g.fillRect(0, 0, 16, 16); }
    } else if (th.stone === 'blueblock') {
      px(g, 0, 0, '#f4f8ff', 16, 16); px(g, 2, 2, '#4a8ae8', 12, 12); px(g, 3, 3, '#6aa8f8', 10, 2);
      px(g, 2, 13, '#2a5cb0', 12, 1); px(g, 0, 15, '#b8c8e0', 16, 1); px(g, 15, 0, '#b8c8e0', 1, 16);
    } else if (th.stone === 'kasbah') {
      const c = th.brick;
      px(g, 0, 0, shade(c, 0.1), 16, 16);
      px(g, 0, 0, shade(c, 0.3), 16, 2);
      for (let i = 0; i < 4; i++) px(g, 2 + i * 4, 6, shade(c, -0.35), 2, 2); // triangle motif
      for (let i = 0; i < 3; i++) px(g, 4 + i * 4, 9, shade(c, -0.35), 2, 2);
      px(g, 0, 15, shade(c, -0.4), 16, 1); px(g, 15, 0, shade(c, -0.3), 1, 16);
    } else { // rock
      const c = th.ground.body;
      px(g, 0, 0, c, 16, 16);
      px(g, 1, 1, shade(c, 0.2), 9, 6); px(g, 9, 8, shade(c, 0.1), 6, 6);
      px(g, 0, 7, shade(c, -0.35), 16, 1); px(g, 8, 0, shade(c, -0.35), 1, 7); px(g, 5, 8, shade(c, -0.35), 1, 8);
      px(g, 0, 15, shade(c, -0.4), 16, 1);
    }
  });
}
function qblockTile(theme, frame, used) {
  return tileCanvas(theme, `q${frame}${+used}`, (g) => {
    if (used) {
      px(g, 0, 0, '#7a5030', 16, 16); px(g, 1, 1, '#9a6a40', 14, 14);
      px(g, 1, 1, '#b08050', 14, 1); px(g, 1, 14, '#5a3820', 14, 1);
      [[2, 2], [12, 2], [2, 12], [12, 12]].forEach(([x, y]) => px(g, x, y, '#5a3820', 2, 2));
      return;
    }
    const base = ['#f2c230', '#f8d850', '#ffe878', '#f8d850'][frame];
    px(g, 0, 0, '#9a5a10', 16, 16);
    px(g, 1, 1, base, 14, 14);
    px(g, 1, 1, shade(base, 0.45), 14, 1); px(g, 1, 1, shade(base, 0.45), 1, 14);
    px(g, 1, 14, '#c8801a', 14, 1); px(g, 14, 1, '#c8801a', 1, 14);
    // khatam star motif instead of a "?"
    const c = '#1f6ab8';
    px(g, 7, 3, c, 2, 10); px(g, 3, 7, c, 10, 2);
    px(g, 5, 5, c, 6, 6);
    px(g, 4, 4, c, 1, 1); px(g, 11, 4, c, 1, 1); px(g, 4, 11, c, 1, 1); px(g, 11, 11, c, 1, 1);
    px(g, 7, 7, '#c8302a', 2, 2);
    [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(([x, y]) => px(g, x, y, '#9a5a10'));
  });
}
function platTile(theme, part) { // part: 0 left, 1 mid, 2 right
  return tileCanvas(theme, 'p' + part, (g, th) => {
    if (th.plat === 'awning') { // striped market awning
      for (let x = 0; x < 16; x++) px(g, x, 0, (Math.floor(x / 4) % 2) ? '#f0e8d8' : '#c8302a', 1, 5);
      for (let x = 0; x < 16; x += 4) px(g, x, 5, (Math.floor(x / 4) % 2) ? '#f0e8d8' : '#c8302a', 3, 2);
      px(g, 0, 0, '#ffffff', 16, 1);
      return;
    }
    const c = th.plat;
    px(g, 0, 0, c, 16, 6);
    px(g, 0, 0, shade(c, 0.3), 16, 1);
    px(g, 0, 5, shade(c, -0.4), 16, 1);
    for (let x = 3; x < 16; x += 6) px(g, x, 2, shade(c, -0.25), 2, 1);
    if (part === 0) { px(g, 0, 0, shade(c, -0.4), 1, 6); px(g, 2, 6, shade(c, -0.2), 2, 3); }
    if (part === 2) { px(g, 15, 0, shade(c, -0.4), 1, 6); px(g, 12, 6, shade(c, -0.2), 2, 3); }
  });
}
function spikeTile(theme) {
  return tileCanvas(theme, 'spike', (g, th) => {
    if (th.spike === 'cactus') { // prickly pear (hendiya)
      px(g, 3, 6, '#3a8a3a', 10, 10); px(g, 1, 9, '#3a8a3a', 4, 5); px(g, 11, 4, '#3a8a3a', 4, 6);
      px(g, 4, 7, '#5ab04a', 3, 3); px(g, 12, 5, '#5ab04a', 2, 2);
      px(g, 6, 3, '#e83a6a', 3, 3); px(g, 12, 2, '#f0a020', 2, 2);
      for (const [x, y] of [[3, 8], [8, 9], [11, 12], [5, 13], [13, 7], [2, 11]]) px(g, x, y, '#f0f0d0');
    } else if (th.spike === 'coals') {
      px(g, 1, 9, '#3a2a2a', 14, 7);
      for (let i = 0; i < 6; i++) px(g, 2 + i * 2, 10 + (i % 2), i % 2 ? '#ff6a20' : '#ffc040', 2, 2);
      px(g, 4, 5, '#ff8a20', 2, 4); px(g, 9, 3, '#ffd040', 2, 6); px(g, 12, 6, '#ff6a20', 1, 3);
    } else {
      for (let i = 0; i < 4; i++) {
        const x = i * 4;
        for (let h = 0; h < 8; h++) px(g, x + Math.floor(h / 4), 15 - h * 1.5, h < 4 ? '#8a8a9a' : '#c8c8d8', 4 - Math.floor(h / 2.2), 2);
        px(g, x + 1, 4, '#ffffff');
      }
      px(g, 0, 14, '#4a4a5a', 16, 2);
    }
  });
}
const DYE = ['#d8302a', '#f0c030', '#8a4a2a', '#3a9a4a', '#d87a20'];
function liquidColor(th, col) {
  if (th.liquid === 'dye') return DYE[Math.abs(Math.floor(col / 3)) % DYE.length];
  if (th.liquid === 'quicksand') return '#c8904a';
  if (th.liquid === 'ice') return '#7ac8f0';
  return th.night ? '#1a4a8a' : '#3aa0e0';
}

// ---------------- backgrounds (periodic, 512px wide layers) ----------------
const BGW = 512;
function pr(g, x, y, w, h, c) {
  if (c === undefined) { c = w; w = 1; h = 1; }
  g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function periodic(R, n, maxK) {
  const comps = [];
  for (let i = 0; i < n; i++) comps.push({ k: 1 + Math.floor(R() * maxK), a: R(), p: R() * Math.PI * 2 });
  const sum = comps.reduce((s, c) => s + c.a, 0);
  return (x) => comps.reduce((s, c) => s + c.a * Math.sin((x / BGW) * Math.PI * 2 * c.k + c.p), 0) / sum;
}
function layer(fn) { const c = makeCanvas(BGW, H); fn(c.getContext('2d')); return c; }
function wrapDraw(fn, x, w) { fn(x); if (x + w > BGW) fn(x - BGW); if (x < 0) fn(x + BGW); }

function ridge(g, R, base, amp, color, light, n = 5, maxK = 6, snow) {
  const f = periodic(R, n, maxK);
  for (let x = 0; x < BGW; x++) {
    const y = Math.round(base - amp * (0.5 + 0.5 * f(x)));
    const slope = f(x + 1) - f(x);
    g.fillStyle = color; g.fillRect(x, y, 1, H - y);
    if (light && slope > 0) { g.fillStyle = light; g.fillRect(x, y, 1, Math.min(14, H - y)); }
    if (snow && y < base - amp * 0.62) { g.fillStyle = snow; g.fillRect(x, y, 1, Math.max(2, Math.round((base - amp * 0.62 - y) * 0.9))); }
  }
}
function minaret(g, x, base, w, h, c, trim, night) {
  const d = shade(c, -0.25);
  pr(g, x, base - h, w, h, c);
  pr(g, x + w - 3, base - h, 3, h, d);
  pr(g, x - 1, base - h, w + 2, 3, trim);
  pr(g, x - 1, base - h - 3, w + 2, 1, trim);
  // decorative arches panels
  for (let i = 0; i < 2; i++) {
    const py = base - h + 10 + i * 18;
    pr(g, x + 2, py, w - 4, 10, shade(c, -0.15));
    pr(g, x + 3, py + 2, 2, 7, night ? '#ffd070' : '#3a2a2a'); pr(g, x + w - 5, py + 2, 2, 7, night ? '#ffd070' : '#3a2a2a');
  }
  pr(g, x + 3, base - h - 11, w - 6, 8, c);
  pr(g, x + w - 5, base - h - 11, 2, 8, d);
  pr(g, x + Math.floor(w / 2), base - h - 20, 1, 9, '#c8a040');
  for (let i = 0; i < 3; i++) pr(g, x + Math.floor(w / 2) - 1, base - h - 14 - i * 3, 3, 2, '#f2c230');
}
function houseRow(g, R, base, hMin, hMax, palette, opts = {}) {
  let x = -10;
  while (x < BGW) {
    const w = 18 + Math.floor(R() * 26), h = hMin + Math.floor(R() * (hMax - hMin));
    const c = palette[Math.floor(R() * palette.length)];
    const draw = (xx) => {
      pr(g, xx, base - h, w, h, c);
      pr(g, xx + w - 2, base - h, 2, h, shade(c, -0.2));
      pr(g, xx, base - h, w, 2, shade(c, 0.15));
      if (opts.roofTiles && R() < 0.5) { // green tiled roof
        const rc = opts.roofTiles;
        for (let i = 0; i < 6; i++) pr(g, xx + 2 + i, base - h - 6 + i, w - 4 - i * 2 > 0 ? w - 4 - i * 2 : 1, 1, i % 2 ? rc : shade(rc, 0.2));
      }
      for (let wy = base - h + 6; wy < base - 8; wy += 12)
        for (let wx = xx + 4; wx < xx + w - 6; wx += 9) {
          if (R() < 0.55) {
            const win = opts.lit && R() < 0.6 ? '#ffd070' : opts.window || shade(c, -0.45);
            pr(g, wx, wy, 3, 5, win); pr(g, wx, wy - 1, 3, 1, shade(c, -0.2));
            if (opts.arch) pr(g, wx + 1, wy - 2, 1, 1, win);
          }
        }
      if (opts.door && R() < 0.4) { pr(g, xx + 4, base - 12, 6, 12, opts.door); pr(g, xx + 5, base - 13, 4, 1, opts.door); }
    };
    wrapDraw(draw, x, w);
    x += w - (opts.overlap ? 4 : 0) + Math.floor(R() * 3);
  }
}
function palm(g, x, base, h, c, fr) {
  for (let i = 0; i < h; i++) pr(g, x + Math.round(Math.sin(i / h * 1.2) * 4), base - i, 3, 1, i % 4 ? c : shade(c, -0.3));
  const tx = x + Math.round(Math.sin(1.2) * 4) + 1, ty = base - h;
  for (let a = 0; a < 7; a++) {
    const ang = -Math.PI + (a / 6) * Math.PI;
    for (let r = 0; r < 14; r++) {
      const xx = tx + Math.cos(ang) * r, yy = ty + Math.sin(ang) * r * 0.5 + (r * r) / 26;
      pr(g, Math.round(xx), Math.round(yy), 2, 1, fr);
    }
  }
}
function kasbah(g, x, base, w, h, c) {
  const d = shade(c, -0.25);
  pr(g, x, base - h, w, h, c);
  const tw = 10;
  for (const tx of [x - 4, x + w - 6]) {
    pr(g, tx, base - h - 14, tw, h + 14, shade(c, 0.05));
    pr(g, tx + tw - 2, base - h - 14, 2, h + 14, d);
    for (let i = 0; i < 3; i++) pr(g, tx + i * 4, base - h - 18, 2, 4, c);
    pr(g, tx + 3, base - h - 6, 3, 2, d); pr(g, tx + 4, base - h - 8, 1, 1, d);
  }
  for (let i = 0; i < Math.floor(w / 5); i++) pr(g, x + i * 5, base - h - 3, 3, 3, c);
  pr(g, x + Math.floor(w / 2) - 3, base - 12, 6, 12, shade(c, -0.45));
  for (let i = 0; i < 4; i++) pr(g, x + 6 + i * 6, base - h + 8, 2, 2, d);
}

function buildBackground(themeKey) {
  const th = THEMES[themeKey];
  const R = mulberry32(themeKey.length * 7919 + themeKey.charCodeAt(0));
  const sky = makeCanvas(W, H);
  const sg = sky.getContext('2d');
  ditherGradient(sg, 0, 0, W, H, th.sky);
  const L = [];
  const bg = th.bg;
  // sun / moon
  if (th.night) {
    const s2 = mulberry32(42);
    for (let i = 0; i < 90; i++) { const x = Math.floor(s2() * W), y = Math.floor(s2() * 150); pr(sg, x, y, s2() < 0.25 ? '#ffffff' : '#9098c0'); }
    if (bg !== 'cedar') {
      sg.fillStyle = '#f4f0d8'; sg.beginPath(); sg.arc(380, 52, 18, 0, Math.PI * 2); sg.fill();
      sg.fillStyle = '#e0dcc0'; sg.fillRect(372, 46, 5, 4); sg.fillRect(384, 58, 6, 3); sg.fillRect(386, 44, 3, 3);
    }
  } else if (bg !== 'rasma') {
    sg.fillStyle = bg === 'dunes' ? '#fff4c0' : '#fffae8';
    sg.beginPath(); sg.arc(400, 46, 15, 0, Math.PI * 2); sg.fill();
  }
  if (bg === 'cedar' || bg === 'dunesfire') {
    sg.fillStyle = bg === 'cedar' ? '#ffd080' : '#ffb040';
    sg.beginPath(); sg.arc(330, 200, 34, 0, Math.PI * 2); sg.fill();
  }

  if (bg === 'medina' || bg === 'tannery' || bg === 'souknight') {
    const night = bg === 'souknight';
    L.push({ f: 0.12, c: layer((g) => ridge(g, R, 200, 70, night ? '#2a2850' : '#a8b8c8', night ? '#3a3868' : '#b8c8d4', 4, 4)) });
    L.push({ f: 0.3, c: layer((g) => {
      houseRow(g, R, 236, 40, 90, night ? ['#4a3048', '#55384a', '#3e2a40'] : ['#e8c898', '#d8b080', '#f0d8b0', '#e0bc8c'], { roofTiles: night ? '#1a4a3a' : '#2a8a5a', lit: night });
      minaret(g, 90, 200, 16, 80, night ? '#5a3a4a' : '#d8a878', night ? '#2a6a5a' : '#2a8a5a', night);
      minaret(g, 340, 210, 12, 60, night ? '#4a3040' : '#e0b888', night ? '#2a6a5a' : '#2a8a5a', night);
    }) });
    if (bg === 'tannery') {
      L.push({ f: 0.55, c: layer((g) => {
        // tannery vats seen from above (Chouara)
        for (let x = 0; x < BGW; x += 22) for (let r = 0; r < 2; r++) {
          const y = 226 + r * 14, cc = DYE[(x / 22 + r * 2) % DYE.length];
          pr(g, x + r * 11, y, 20, 12, '#e8d8c0'); pr(g, x + 2 + r * 11, y + 2, 16, 8, cc); pr(g, x + 3 + r * 11, y + 3, 6, 1, shade(cc, 0.3));
        }
        pr(g, 0, 254, BGW, 16, '#c8a880');
      }) });
    } else {
      L.push({ f: 0.55, c: layer((g) => houseRow(g, R, 270, 30, 70, night ? ['#3a2232', '#45283a'] : ['#c89a68', '#b88a58', '#d0a070'], { door: night ? '#2a1420' : '#6a3a1a', arch: true, lit: night, window: night ? '#20101a' : '#5a3020' })) });
    }
  } else if (bg === 'chaouen' || bg === 'rasma') {
    L.push({ f: 0.1, c: layer((g) => ridge(g, R, 190, 90, '#6a9ac0', '#80b0d0', 4, 3)) });
    L.push({ f: 0.2, c: layer((g) => ridge(g, R, 210, 60, '#4a8a5a', '#5aa06a', 5, 5)) });
    if (bg === 'chaouen') {
      L.push({ f: 0.35, c: layer((g) => houseRow(g, R, 250, 30, 70, ['#4a8ae8', '#6aa8f8', '#f4f8ff', '#3a7ad8', '#8ac0ff'], { overlap: true, door: '#2a4a9a', arch: true, window: '#1c3c80' })) });
      L.push({ f: 0.6, c: layer((g) => houseRow(g, R, 270, 40, 80, ['#3a7ad8', '#2a6ac8', '#5a9af0'], { door: '#c86a2a', arch: true, window: '#14306a' })) });
    } else {
      L.push({ f: 0.4, c: layer((g) => {
        // waterfalls of Ras el Ma
        ridge(g, R, 250, 40, '#3a6a4a', '#4a8a5a', 4, 5);
        for (const x of [80, 260, 420]) for (let y = 120; y < 270; y++) {
          pr(g, x + Math.round(Math.sin(y * 0.3) * 1), y, 14, 1, (y + x) % 7 < 2 ? '#ffffff' : '#a8dcff');
        }
      }) });
      L.push({ f: 0.6, c: layer((g) => houseRow(g, R, 270, 20, 50, ['#f4f8ff', '#4a8ae8'], { door: '#2a4a9a', window: '#1c3c80' })) });
    }
  } else if (bg === 'cedar') {
    L.push({ f: 0.12, c: layer((g) => ridge(g, R, 200, 80, '#5a2a4a', '#6a3458', 4, 4)) });
    const trees = (g, base, col, n, hh) => {
      for (let i = 0; i < n; i++) {
        const x = Math.floor(R() * BGW), h = hh * (0.6 + R() * 0.6);
        wrapDraw((xx) => {
          pr(g, xx - 1, base - h * 0.3, 3, h * 0.3, '#2a1a1a');
          for (let l = 0; l < 5; l++) { const y = base - h * 0.25 - l * h * 0.16, w = (5 - l) * h * 0.09; pr(g, Math.round(xx - w), Math.round(y), Math.round(w * 2), Math.ceil(h * 0.12), col); }
        }, x - 20, 40);
      }
    };
    L.push({ f: 0.3, c: layer((g) => trees(g, 230, '#2a2a3a', 16, 90)) });
    L.push({ f: 0.6, c: layer((g) => trees(g, 275, '#14141e', 10, 130)) });
  } else if (bg === 'dunes' || bg === 'dunesnight' || bg === 'dunesfire') {
    const n = bg === 'dunesnight', fire = bg === 'dunesfire';
    L.push({ f: 0.12, c: layer((g) => ridge(g, R, 210, 50, n ? '#3a3050' : fire ? '#6a2a20' : '#f0c890', n ? '#4a4060' : fire ? '#8a3a28' : '#f8dcaa', 3, 3)) });
    L.push({ f: 0.3, c: layer((g) => {
      ridge(g, R, 235, 45, n ? '#5a4060' : fire ? '#8a3a20' : '#e8a860', n ? '#6a5070' : fire ? '#a84a28' : '#f8c880', 3, 4);
      kasbah(g, 140, 220, 50, 40, n ? '#4a3040' : fire ? '#5a2018' : '#c07848');
      palm(g, 210, 225, 30, n ? '#2a2030' : '#6a4a2a', n ? '#1a3020' : '#3a8a3a');
      palm(g, 230, 228, 24, n ? '#2a2030' : '#6a4a2a', n ? '#1a3020' : '#3a8a3a');
    }) });
    L.push({ f: 0.55, c: layer((g) => ridge(g, R, 270, 40, n ? '#6a5068' : fire ? '#a04a28' : '#e09a50', n ? '#7a6078' : fire ? '#c05a30' : '#f0b870', 3, 3)) });
  } else if (bg === 'atlas') {
    L.push({ f: 0.08, c: layer((g) => ridge(g, R, 200, 130, '#7a8aa8', '#8a9ab8', 5, 5, '#f4f8ff')) });
    L.push({ f: 0.22, c: layer((g) => ridge(g, R, 220, 90, '#8a5a50', '#a06a5a', 5, 6, '#e8eef8')) });
    L.push({ f: 0.45, c: layer((g) => {
      ridge(g, R, 260, 50, '#9a4a34', '#b05a40', 4, 5);
      for (let i = 0; i < 5; i++) kasbah(g, 30 + i * 100, 236 - (i % 2) * 10, 30, 22, '#b0603e');
    }) });
  } else if (bg === 'jemaa') {
    L.push({ f: 0.06, c: layer((g) => minaret(g, 300, 230, 22, 120, '#4a2a40', '#2a6a5a', true)) });
    L.push({ f: 0.25, c: layer((g) => {
      houseRow(g, R, 240, 30, 60, ['#3a2030', '#45253a'], { lit: true });
      for (let x = 20; x < BGW; x += 70) for (let y = 230; y > 120; y -= 6) pr(g, x + Math.round(Math.sin(y * 0.1 + x) * 3), y, 4, 4, 'rgba(200,200,220,0.08)');
    }) });
    L.push({ f: 0.5, c: layer((g) => {
      // food stalls with lanterns
      for (let x = 0; x < BGW; x += 64) {
        pr(g, x + 6, 226, 50, 44, '#2a1a20');
        for (let i = 0; i < 50; i++) pr(g, x + 6 + i, 220, 1, 6, Math.floor(i / 6) % 2 ? '#f0e8d8' : '#a82828');
        pr(g, x + 10, 236, 42, 3, '#ffb040');
        pr(g, x + 20, 228, 4, 6, '#ffd070'); pr(g, x + 40, 228, 4, 6, '#ffd070');
      }
      for (let x = 0; x < BGW; x++) pr(g, x, 200 + Math.round(Math.sin(x / BGW * Math.PI * 8) * 6), 1, 1, '#4a3a3a');
      for (let x = 16; x < BGW; x += 32) { const y = 200 + Math.round(Math.sin(x / BGW * Math.PI * 8) * 6); pr(g, x - 2, y + 1, 5, 6, ['#ffd070', '#ff7050', '#70d0ff'][(x / 32) % 3 | 0]); }
    }) });
  } else if (bg === 'oued') {
    L.push({ f: 0.1, c: layer((g) => ridge(g, R, 210, 60, '#141c30', '#1a2440', 4, 4)) });
    L.push({ f: 0.3, c: layer((g) => {
      ridge(g, R, 240, 20, '#1a2232', null, 3, 4);
      for (let i = 0; i < 6; i++) { // qobbas (white domed shrines) + tombs
        const x = 30 + i * 85;
        pr(g, x, 214, 26, 20, '#c8ccd8'); g.fillStyle = '#d8dce8'; g.beginPath(); g.arc(x + 13, 214, 13, Math.PI, 0); g.fill();
        pr(g, x + 9, 222, 8, 12, '#1a2232'); pr(g, x + 12, 198, 2, 4, '#c8a040');
      }
      palm(g, 140, 236, 46, '#141820', '#101a18'); palm(g, 400, 236, 52, '#141820', '#101a18');
    }) });
    L.push({ f: 0.55, c: layer((g) => { for (let i = 0; i < 26; i++) { const x = Math.floor(R() * BGW); pr(g, x, 258, 4, 12, '#5a6070'); pr(g, x - 1, 256, 6, 2, '#6a7080'); } }) });
  }
  return { sky, layers: L, th };
}
