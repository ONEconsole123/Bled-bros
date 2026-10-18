// ============================================================
// Tiles + body physics (AABB vs tile grid, one-way, movers)
// ============================================================
const T = {
  EMPTY: 0, GROUND: 1, STONE: 2, BRICK: 3, QCOIN: 4, QMSEMEN: 5, QKHAMSA: 6, QTEA: 7,
  USED: 8, PLAT: 9, LIQUID: 10, SPIKE: 11, WALL: 12,
};
const CHAR_TILE = { '#': T.GROUND, S: T.STONE, B: T.BRICK, '?': T.QCOIN, M: T.QMSEMEN, K: T.QKHAMSA, T: T.QTEA, '=': T.PLAT, '~': T.LIQUID, '^': T.SPIKE };
const SOLID = new Set([T.GROUND, T.STONE, T.BRICK, T.QCOIN, T.QMSEMEN, T.QKHAMSA, T.QTEA, T.USED, T.WALL]);
const isQ = (t) => t >= T.QCOIN && t <= T.QTEA;

const GRAV = 0.62, GRAV_HOLD = 0.3, MAXFALL = 6.5;

function tileAt(L, tx, ty) {
  if (tx < 0 || tx >= L.w) return T.WALL;
  if (ty < 0 || ty >= L.h) return T.EMPTY;
  return L.tiles[ty * L.w + tx];
}
function isSolid(L, tx, ty) { return SOLID.has(tileAt(L, tx, ty)); }

// Moves body b {x,y,w,h,vx,vy} through the level; sets b.onGround, b.hitWall, b.ceil
function moveBody(b, L, opts = {}) {
  b.hitWall = 0; b.ceil = null;
  const wasGround = b.onGround;
  b.onGround = false;
  // ---- horizontal ----
  if (b.vx) {
    b.x += b.vx;
    const top = Math.floor(b.y / TS), bot = Math.floor((b.y + b.h - 0.01) / TS);
    if (b.vx > 0) {
      const tx = Math.floor((b.x + b.w) / TS);
      for (let ty = top; ty <= bot; ty++) if (isSolid(L, tx, ty)) { b.x = tx * TS - b.w; b.hitWall = 1; break; }
    } else {
      const tx = Math.floor(b.x / TS);
      for (let ty = top; ty <= bot; ty++) if (isSolid(L, tx, ty)) { b.x = (tx + 1) * TS; b.hitWall = -1; break; }
    }
  }
  // ---- vertical ----
  const prevBottom = b.y + b.h;
  b.y += b.vy;
  const left = Math.floor((b.x + 0.5) / TS), right = Math.floor((b.x + b.w - 0.5) / TS);
  if (b.vy >= 0) {
    const ty = Math.floor((b.y + b.h) / TS);
    for (let tx = left; tx <= right; tx++) {
      const t = tileAt(L, tx, ty);
      if (SOLID.has(t) || (t === T.PLAT && !opts.dropThrough && prevBottom <= ty * TS + 0.5)) {
        b.y = ty * TS - b.h; b.vy = 0; b.onGround = true; break;
      }
    }
  } else {
    const ty = Math.floor(b.y / TS);
    let best = null, bestD = 99;
    for (let tx = left; tx <= right; tx++) {
      if (isSolid(L, tx, ty)) {
        const d = Math.abs(tx * TS + 8 - (b.x + b.w / 2));
        if (d < bestD) { bestD = d; best = { tx, ty }; }
      }
    }
    if (best) { b.y = (best.ty + 1) * TS; b.vy = 0; b.ceil = best; }
  }
  // ---- moving platforms ----
  if (b.vy >= 0 && L.movers) {
    for (const m of L.movers) {
      if (b.x + b.w > m.x && b.x < m.x + m.w && prevBottom <= m.y - m.dy + 1 && b.y + b.h >= m.y) {
        b.y = m.y - b.h; b.vy = 0; b.onGround = true; b.ride = m; break;
      }
    }
  }
  if (!b.onGround) b.ride = null;
  b.justLanded = b.onGround && !wasGround;
}

// is there ground ahead of a walker (used to turn at ledges)
function groundAhead(L, b, dir) {
  const fx = dir > 0 ? b.x + b.w + 1 : b.x - 1;
  const ty = Math.floor((b.y + b.h + 2) / TS);
  const t = tileAt(L, Math.floor(fx / TS), ty);
  return SOLID.has(t) || t === T.PLAT;
}

class Mover {
  constructor(x, y, kind) {
    this.x = x; this.y = y; this.w = 48; this.h = 8; this.kind = kind;
    this.ox = x; this.oy = y; this.t = 0; this.dx = 0; this.dy = 0;
  }
  update() {
    this.t++;
    const px = this.x, py = this.y;
    if (this.kind === 'h') this.x = this.ox + (1 - Math.cos(this.t * 0.012)) * 0.5 * 7 * TS;
    else this.y = this.oy - (1 - Math.cos(this.t * 0.014)) * 0.5 * 5 * TS;
    this.dx = this.x - px; this.dy = this.y - py;
  }
}
