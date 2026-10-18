// ============================================================
// UI: panels, dialog boxes with portraits, tappable menus
// ============================================================
function panel(x, y, w, h, fill = 'rgba(22,12,30,0.88)', border = '#c8a040') {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = border;
  ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = shade(border, -0.4);
  ctx.fillRect(x + 2, y + 2, w - 4, 1); ctx.fillRect(x + 2, y + h - 3, w - 4, 1); ctx.fillRect(x + 2, y + 2, 1, h - 4); ctx.fillRect(x + w - 3, y + 2, 1, h - 4);
  // little zellige corners
  for (const [cx, cy] of [[x, y], [x + w - 4, y], [x, y + h - 4], [x + w - 4, y + h - 4]]) {
    ctx.fillStyle = '#1f8a5a'; ctx.fillRect(cx, cy, 4, 4); ctx.fillStyle = '#f2c230'; ctx.fillRect(cx + 1, cy + 1, 2, 2);
  }
}
function tapIn(r) { const t = Input.tap; return t && t.x >= r.x && t.x <= r.x + r.w && t.y >= r.y && t.y <= r.y + r.h; }

function drawPortrait(c, x, y, size) {
  if (!c) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip();
  ctx.fillStyle = '#2a1838'; ctx.fillRect(x, y, size, size);
  // fit the top part of the sprite (the head) into the box
  const s = Math.max(1, Math.floor(size / Math.min(c.width, c.height * 0.62)));
  const dw = c.width * s, dh = c.height * s;
  ctx.drawImage(c, Math.round(x + (size - dw) / 2), y + 2, dw, dh);
  ctx.restore();
  ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

class Dialog {
  constructor(lines) { this.lines = lines; this.i = 0; this.chars = 0; this.done = false; this.t = 0; }
  get cur() { return this.lines[this.i]; }
  update() {
    if (this.done) return;
    this.t++;
    const full = this.cur.text.length;
    if (this.chars < full) {
      this.chars = Math.min(full, this.chars + 1.2);
      if (Math.floor(this.chars) % 3 === 0) Audio.sfxPlay('text');
      if (Input.pressed('jump') || Input.pressed('attack') || Input.tap) this.chars = full;
    } else if (Input.pressed('jump') || Input.pressed('attack') || Input.tap) {
      Audio.sfxPlay('select');
      this.i++; this.chars = 0;
      if (this.i >= this.lines.length) this.done = true;
    }
  }
  draw() {
    if (this.done) return;
    const l = this.cur;
    const x = 14, y = 184, w = W - 28, h = 76;
    panel(x, y, w, h);
    const pc = typeof l.portrait === 'function' ? l.portrait() : l.portrait;
    drawPortrait(pc, x + 8, y + 10, 56);
    drawText(l.name, x + 74, y + 10, l.color || '#ffe080');
    const lines = wrapText(l.text, w - 90);
    let shown = Math.floor(this.chars);
    lines.forEach((ln, k) => {
      if (shown <= 0) return;
      drawText(ln.slice(0, shown), x + 74, y + 26 + k * 12, '#ffffff');
      shown -= ln.length + 1;
    });
    if (this.chars >= l.text.length && Math.floor(this.t / 20) % 2) drawText('>', x + w - 14, y + h - 14, '#ffe080');
  }
}

// vertical menu; items: [{label: string|fn, action: fn, enabled?: fn}]
class Menu {
  constructor(items, x, y, opts = {}) {
    this.items = items; this.x = x; this.y = y; this.sel = 0; this.sp = opts.spacing || 16;
    this.align = opts.align || 'center'; this.w = opts.w || 160; this.t = 0;
  }
  label(it) { return typeof it.label === 'function' ? it.label() : it.label; }
  rect(i) { return { x: this.align === 'center' ? this.x - this.w / 2 : this.x - 8, y: this.y + i * this.sp - 4, w: this.w, h: this.sp }; }
  update() {
    this.t++;
    const n = this.items.length;
    if (Input.pressed('down')) { this.sel = (this.sel + 1) % n; Audio.sfxPlay('select'); }
    if (Input.pressed('up')) { this.sel = (this.sel + n - 1) % n; Audio.sfxPlay('select'); }
    if (Input.tap) {
      for (let i = 0; i < n; i++) if (tapIn(this.rect(i))) { this.sel = i; Audio.sfxPlay('confirm'); this.items[i].action(); return; }
    }
    if (Input.pressed('jump')) { Audio.sfxPlay('confirm'); this.items[this.sel].action(); }
  }
  draw() {
    this.items.forEach((it, i) => {
      const y = this.y + i * this.sp;
      const on = i === this.sel;
      const lab = this.label(it);
      if (on) {
        const r = this.rect(i);
        ctx.fillStyle = 'rgba(255,220,120,0.14)'; ctx.fillRect(r.x, r.y, r.w, r.h - 2);
      }
      drawText(lab, this.align === 'center' ? this.x : this.x, y, on ? '#ffe060' : '#e8dcc8', 1, '#1a0f14', this.align);
      if (on) {
        const tw = textWidth(lab);
        const lx = this.align === 'center' ? this.x - tw / 2 - 12 : this.x - 12;
        drawSpr(SPR.star[Math.floor(this.t / 8) % 2], lx + 4, y + 8);
      }
    });
  }
}

// small helper for on-screen tappable buttons (menus/map)
function drawButton(r, label, hot) {
  ctx.fillStyle = hot ? 'rgba(255,210,120,0.3)' : 'rgba(22,12,30,0.75)';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = hot ? '#ffe080' : '#c8a040'; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  drawText(label, r.x + r.w / 2, r.y + Math.floor((r.h - 7) / 2), hot ? '#ffe080' : '#ffffff', 1, '#1a0f14', 'center');
}

// big title logo with layered colors
function drawLogo(x, y, t) {
  const word = 'BLED BROS';
  const sc = 5;
  const w = textWidth(word, sc);
  const ox = Math.round(x - w / 2);
  const wob = (i) => Math.round(Math.sin(t * 0.06 + i * 0.7) * 2);
  let cx = ox;
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const gw = (glyphFor(ch).base.w + 1) * sc;
    const yy = y + wob(i);
    drawText(ch, cx + 3, yy + 4, '#3a1020', sc, null);
    drawText(ch, cx + 1, yy + 2, '#a02818', sc, null);
    drawText(ch, cx, yy, i < 4 ? '#ffd040' : '#ff8a30', sc, null);
    // shine line
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    if (ch !== ' ') ctx.fillRect(cx, yy, gw - sc - 1, 2);
    cx += gw;
  }
}
