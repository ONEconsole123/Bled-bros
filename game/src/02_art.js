// ============================================================
// Pixel painter: build sprites pixel by pixel, auto sel-out outline
// ============================================================
const _colCache = new Map();
function col32(hex) {
  let v = _colCache.get(hex);
  if (v === undefined) {
    const [r, g, b] = hex2rgb(hex);
    v = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
    _colCache.set(hex, v);
  }
  return v;
}

class PSprite {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  px(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    this.d[y * this.w + x] = col32(c);
  }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[y * this.w + x]; }
  clear(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = 0; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / (rx + 0.35), dy = (y - cy) / (ry + 0.35);
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
  }
  // shaded ellipse: light from top-left
  ball(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / (rx + 0.35), dy = (y - cy) / (ry + 0.35);
        const d = dx * dx + dy * dy;
        if (d <= 1) {
          const l = -dx * 0.6 - dy * 0.8;
          let cc = c;
          if (l > 0.55) cc = shade(c, 0.35);
          else if (l < -0.35 || d > 0.8) cc = shade(c, -0.3);
          this.px(x, y, cc);
        }
      }
  }
  line(x0, y0, x1, y1, c, th = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      if (th === 1) this.px(x, y, c);
      else {
        const o = Math.floor((th - 1) / 2);
        this.rect(Math.round(x) - o, Math.round(y) - o, th, th, c);
      }
    }
  }
  poly(pts, c) { // scanline polygon fill
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) {
          xs.push(a[0] + ((y + 0.5 - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i < xs.length - 1; i += 2)
        for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.px(x, y, c);
    }
  }
  // selective outline: transparent pixels next to opaque ones become a dark, hue-kept version
  outline(dark = 0.32, diag = false) {
    const { w, h, d } = this;
    const out = new Uint32Array(d);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (d[y * w + x]) continue;
        const ns = [this.get(x - 1, y), this.get(x + 1, y), this.get(x, y - 1), this.get(x, y + 1)];
        if (diag) ns.push(this.get(x - 1, y - 1), this.get(x + 1, y - 1), this.get(x - 1, y + 1), this.get(x + 1, y + 1));
        let n = 0;
        for (const v of ns) if (v) { n = v; break; }
        if (n) {
          const r = n & 255, g = (n >> 8) & 255, b = (n >> 16) & 255;
          const R = Math.round(r * dark * 0.8 + 14), G = Math.round(g * dark * 0.7 + 8), B = Math.round(b * dark + 22);
          out[y * w + x] = ((255 << 24) | (B << 16) | (G << 8) | R) >>> 0;
        }
      }
    this.d = out;
    return this;
  }
  canvas() {
    const c = makeCanvas(this.w, this.h);
    const g = c.getContext('2d');
    const img = g.createImageData(this.w, this.h);
    new Uint32Array(img.data.buffer).set(this.d);
    g.putImageData(img, 0, 0);
    return c;
  }
}

// draws a sprite canvas with its bottom-center anchored at (x,y)
function drawSpr(c, x, y, flip = false, alpha = 1) {
  if (!c) return;
  const dx = Math.round(x - c.width / 2), dy = Math.round(y - c.height);
  if (alpha !== 1) ctx.globalAlpha = alpha;
  if (flip) {
    ctx.save();
    ctx.translate(dx + c.width, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(c, 0, 0);
    ctx.restore();
  } else ctx.drawImage(c, dx, dy);
  if (alpha !== 1) ctx.globalAlpha = 1;
}
// tinted copy (white flash, silhouettes)
function tintCanvas(src, color) {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}
const _tintCache = new WeakMap();
function tintOf(src, color) {
  let m = _tintCache.get(src);
  if (!m) { m = new Map(); _tintCache.set(src, m); }
  let c = m.get(color);
  if (!c) { c = tintCanvas(src, color); m.set(color, c); }
  return c;
}
const _flashCache = new WeakMap();
function flashOf(src) {
  let f = _flashCache.get(src);
  if (!f) { f = tintCanvas(src, '#ffffff'); _flashCache.set(src, f); }
  return f;
}

// ordered dithering (4x4 bayer) helpers for 16-bit style gradients
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
function ditherGradient(g, x, y, w, h, stops) {
  // stops: array of hex colors from top to bottom, banded with dithering at transitions
  const n = stops.length - 1;
  for (let j = 0; j < h; j++) {
    const t = (j / Math.max(1, h - 1)) * n;
    const i = Math.min(n - 1, Math.floor(t));
    const f = t - i;
    for (let k = 0; k < w; k += 1) {
      const th = BAYER[(j % 4) * 4 + ((x + k) % 4)];
      g.fillStyle = f > th ? stops[i + 1] : stops[i];
      // draw runs for speed
      let run = 1;
      while (k + run < w && (f > BAYER[(j % 4) * 4 + ((x + k + run) % 4)]) === (f > th)) run++;
      g.fillRect(x + k, y + j, run, 1);
      k += run - 1;
    }
  }
}
