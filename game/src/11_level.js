// ============================================================
// Level runtime: parsing, update, collisions, rendering, HUD
// ============================================================
const BG_CACHE = {};
const ENEMY_LETTERS = { d: 'djinn', z: 'scorpion', j: 'fireskull', b: 'bat', o: 'cobra' };

class Level {
  constructor(index, checkpoint) {
    const def = LEVELS[index];
    this.def = def; this.index = index;
    const rows = assembleLevel(def);
    this.w = rows[0].length; this.h = ROWS;
    this.tiles = new Uint8Array(this.w * this.h);
    this.enemies = []; this.items = []; this.projs = []; this.parts = []; this.movers = [];
    this.checkpoints = []; this.gate = null; this.boss = null; this.bumps = new Map();
    this.shake = 0; this.t = 0; this.state = 'play'; this.endT = 0; this.darkness = false;
    this.banner = 150; this.dialog = null; this.cpIndex = checkpoint == null ? -1 : checkpoint;
    this.startScore = RUN.score;
    let start = { x: 2 * TS, y: 13 * TS };
    for (let ty = 0; ty < this.h; ty++) {
      for (let tx = 0; tx < this.w; tx++) {
        const c = rows[ty][tx];
        if (CHAR_TILE[c] !== undefined) { this.tiles[ty * this.w + tx] = CHAR_TILE[c]; continue; }
        if (c === 'P') start = { x: tx * TS, y: ty * TS };
        else if (c === 'E') this.gate = { x: tx * TS, y: (ty + 1) * TS, open: true };
        else if (c === 'X') this.checkpoints.push({ x: tx * TS, y: ty * TS, lit: false });
        else if (c === 'c') this.items.push(new Item(this, tx * TS, ty * TS, 'coin'));
        else if (c === 'm') this.movers.push(new Mover(tx * TS, ty * TS + 4, 'h'));
        else if (c === 'v') this.movers.push(new Mover(tx * TS, ty * TS + 4, 'v'));
        else if (c === 'e' || c === 'r' || c === 'f') this.enemies.push(new Enemy(this, tx, ty, def.sub[c]));
        else if (ENEMY_LETTERS[c]) this.enemies.push(new Enemy(this, tx, ty, ENEMY_LETTERS[c]));
      }
    }
    // spawn point (checkpoint resume)
    if (this.cpIndex >= 0 && this.checkpoints[this.cpIndex]) {
      const cp = this.checkpoints[this.cpIndex];
      start = { x: cp.x, y: cp.y };
      for (let i = 0; i <= this.cpIndex; i++) this.checkpoints[i].lit = true;
      this.banner = 0;
    }
    this.theme = def.theme;
    if (!BG_CACHE[def.theme]) BG_CACHE[def.theme] = buildBackground(def.theme);
    this.bg = BG_CACHE[def.theme];
    this.buildStatic();

    const ch = CHARS[SAVE.char];
    let big = RUN.big;
    if (!big && SAVE.inv.msemen > 0) { SAVE.inv.msemen--; big = true; writeSave(); }
    this.player = new Player(this, start.x, start.y, ch, big);
    if (SAVE.inv.khamsa > 0) { SAVE.inv.khamsa--; this.player.khamsa = 600; writeSave(); }
    this.cam = { x: clamp(this.player.cx - W * 0.4, 0, this.w * TS - W), y: this.h * TS - H };

    if (def.boss) {
      this.boss = new BOSS_CLASSES[def.boss](this);
      this.state = 'intro';
      this.banner = 0;
      const info = BOSS_INFO[def.boss];
      this.dialog = new Dialog(info.intro.map((l) => l.who === 'boss'
        ? { name: info.name, color: '#ff9090', text: l.text, portrait: () => bossPortrait(def.boss) }
        : { name: ch.name, color: '#90d0ff', text: HERO_LINES[ch.id], portrait: () => CHAR_SPR[ch.id].big.idle0 }));
      Audio.stop();
    } else Audio.play(def.music);
  }

  // ---------- helpers used by entities ----------
  setTile(tx, ty, t) { this.tiles[ty * this.w + tx] = t; }
  addProj(p) { this.projs.push(p); }
  spawnEnemy(type, tx, ty) {
    const e = new Enemy(this, tx, ty, type);
    e.dir = this.player.cx < e.x ? -1 : 1;
    this.enemies.push(e);
    for (let i = 0; i < 8; i++) this.smoke(e.x + e.w / 2 + rnd(-6, 6), e.y + rnd(0, e.h), '#9a7ab0');
  }
  clearEnemyProjs() { for (const p of this.projs) if (p.owner === 'enemy') p.dead = true; }
  popText(x, y, text, color = '#ffffff') { this.parts.push(new Part({ x, y, vy: -0.5, life: 50, kind: 'text', text, color })); }
  spark(x, y, color) { this.parts.push(new Part({ x, y, vx: rnd(-1, 1), vy: rnd(-1.5, 0.2), life: rndi(12, 24), color })); }
  dust(x, y, color = '#e8dcc8') { for (let i = 0; i < 3; i++) this.parts.push(new Part({ x: x + rnd(-3, 3), y, vx: rnd(-0.8, 0.8), vy: rnd(-0.6, -0.1), life: rndi(10, 18), color, kind: 'smoke', size: 2 })); }
  smoke(x, y, color) { this.parts.push(new Part({ x, y, vx: rnd(-0.4, 0.4), vy: rnd(-0.8, -0.2), life: rndi(20, 34), color, kind: 'smoke', size: 3 })); }
  debris(x, y, color) { this.parts.push(new Part({ x, y, vx: rnd(-2, 2), vy: rnd(-4, -2), grav: 0.25, life: 50, color, size: 3 })); }
  splash(x, y) { for (let i = 0; i < 10; i++) this.parts.push(new Part({ x: x + rnd(-6, 6), y, vx: rnd(-1.2, 1.2), vy: rnd(-3.5, -1.5), grav: 0.2, life: 30, color: liquidColor(THEMES[this.theme], Math.floor(x / TS)), size: 2 })); }
  addScore(n, x, y) { RUN.score += n; if (x !== undefined) this.popText(x, y - 4, String(n), '#fff6c0'); }
  addCoin() {
    RUN.coins++; SAVE.wallet++; RUN.score += 10;
    if (RUN.coins >= 100) { RUN.coins -= 100; this.oneUp(); }
  }
  oneUp() {
    SAVE.lives = Math.min(99, SAVE.lives + 1); writeSave();
    Audio.jingle('life');
    this.popText(this.player.cx, this.player.y - 12, '1UP!', '#80ff80');
  }

  hitBlock(tx, ty, P) {
    const t = tileAt(this, tx, ty);
    const key = ty * this.w + tx;
    if (isQ(t)) {
      this.setTile(tx, ty, T.USED);
      this.bumps.set(key, 8);
      if (t === T.QCOIN) {
        this.addCoin(); Audio.sfxPlay('coin');
        this.parts.push(new Part({ x: tx * TS + 8, y: ty * TS - 2, vy: -4, grav: 0.25, life: 28, kind: 'spr', spr: SPR.coin }));
      } else {
        const type = t === T.QMSEMEN ? 'msemen' : t === T.QKHAMSA ? 'khamsa' : 'tea';
        this.items.push(new Item(this, tx * TS, ty * TS - 16, type, true));
        Audio.sfxPlay('appear');
      }
    } else if (t === T.BRICK) {
      if (P.big) {
        this.setTile(tx, ty, T.EMPTY);
        Audio.sfxPlay('break');
        for (let i = 0; i < 4; i++) this.debris(tx * TS + 4 + (i % 2) * 8, ty * TS + 4 + Math.floor(i / 2) * 8, THEMES[this.theme].brick);
        this.addScore(50);
      } else { this.bumps.set(key, 8); Audio.sfxPlay('bump'); }
    } else Audio.sfxPlay('bump');
    // knock enemies standing on the block
    for (const e of this.enemies) {
      if (e.alive && Math.abs(e.y + e.h - ty * TS) < 3 && e.x + e.w > tx * TS && e.x < tx * TS + TS) e.hit(9, tx * TS);
    }
    for (const it of this.items) if (!it.static && Math.abs(it.y + it.h - ty * TS) < 3 && it.x + it.w > tx * TS && it.x < tx * TS + TS) { it.vy = -4; it.vx = -it.vx || 1; }
  }

  onBossDefeated(boss) {
    this.boss = null;
    this.darkness = false;
    this.addScore(5000, boss.cx, boss.y);
    Audio.jingle('boss');
    this.gate = { x: 15 * TS - 16, y: GROUND_Y, open: true, appear: 40 };
    for (let i = 0; i < 12; i++) {
      const it = new Item(this, rnd(48, 420), rnd(20, 100), 'coin');
      this.items.push(it);
    }
    this.popText(240, 80, 'BRAVO! L\'BLED MERCI!', '#ffe060');
  }

  // ---------- static tile cache ----------
  buildStatic() {
    const c = makeCanvas(this.w * TS, this.h * TS);
    const g = c.getContext('2d');
    const th = this.theme;
    for (let ty = 0; ty < this.h; ty++)
      for (let tx = 0; tx < this.w; tx++) {
        const t = this.tiles[ty * this.w + tx];
        const x = tx * TS, y = ty * TS;
        if (t === T.GROUND) {
          const top = tileAt(this, tx, ty - 1) !== T.GROUND && ty > 0;
          const l = tx > 0 && tileAt(this, tx - 1, ty) !== T.GROUND;
          const r = tx < this.w - 1 && tileAt(this, tx + 1, ty) !== T.GROUND;
          g.drawImage(groundTile(th, top, l, r, (tx * 7 + ty * 13) % 4), x, y);
        } else if (t === T.STONE) g.drawImage(stoneTile(th), x, y);
        else if (t === T.PLAT) {
          const l = tileAt(this, tx - 1, ty) !== T.PLAT, r = tileAt(this, tx + 1, ty) !== T.PLAT;
          g.drawImage(platTile(th, l ? 0 : r ? 2 : 1), x, y);
        } else if (t === T.SPIKE) g.drawImage(spikeTile(th), x, y);
      }
    this.staticCanvas = c;
  }

  // ---------- update ----------
  update() {
    this.t++;
    if (this.banner > 0) this.banner--;
    if (this.shake > 0) this.shake--;
    const P = this.player;

    if (this.state === 'intro') {
      this.dialog.update();
      if (this.dialog.done) { this.state = 'play'; this.dialog = null; Audio.play(this.def.music); }
      this.updateCamera();
      for (const p of this.parts) p.update();
      return;
    }

    for (const m of this.movers) m.update();
    P.prevBottom = P.bottom;
    P.update();

    // enemies
    const camMid = this.cam.x + W / 2;
    for (const e of this.enemies) {
      if (!e.active && Math.abs(e.x - camMid) < W * 0.75) e.active = true;
      if (e.active) e.update(P);
    }
    if (this.boss) this.boss.update(P);
    for (const it of this.items) it.update();
    for (const p of this.projs) p.update(this);
    for (const p of this.parts) p.update();

    if (!P.dead && !P.won) this.collide(P);

    // checkpoints
    this.checkpoints.forEach((cp, i) => {
      if (!cp.lit && P.cx > cp.x + 4 && !P.dead) {
        cp.lit = true; this.cpIndex = i;
        Audio.sfxPlay('checkpoint');
        this.popText(cp.x + 8, cp.y - 20, 'BARAKA!', '#ffe080');
        for (let k = 0; k < 10; k++) this.spark(cp.x + 8, cp.y - 8, '#ffd060');
      }
    });

    // exit gate
    if (this.gate && !P.won && !P.dead) {
      if (this.gate.appear > 0) this.gate.appear--;
      else {
        const gx = this.gate.x + 10;
        if (P.x + P.w > gx && P.x < gx + 12 && P.bottom > this.gate.y - 40) {
          P.won = true; this.state = 'clear'; this.endT = 0;
          Audio.stop(); Audio.jingle('clear'); Audio.sfxPlay('door');
          RUN.big = P.big;
          this.popText(P.cx, P.y - 14, choice(['SAFI!', 'MZYAN!', 'BRAVO!']), '#ffe060');
        }
      }
    }
    if (this.state === 'clear') {
      this.endT++;
      if (this.endT > 150) Game.onLevelClear(this);
    }
    if (P.dead && P.deadT > 140) Game.onPlayerDied(this);

    // cleanup
    this.enemies = this.enemies.filter((e) => !e.remove);
    this.items = this.items.filter((i) => !i.remove);
    this.projs = this.projs.filter((p) => !p.dead);
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const [k, v] of this.bumps) { if (v <= 1) this.bumps.delete(k); else this.bumps.set(k, v - 1); }
    this.updateCamera();
  }

  collide(P) {
    const pb = P;
    // ---- items ----
    for (const it of this.items) {
      if (it.remove || it.emerge > 0 || !overlap(pb, it)) continue;
      it.remove = true;
      if (it.type === 'coin') { this.addCoin(); Audio.sfxPlay('coin'); }
      else if (it.type === 'msemen') {
        if (!P.big) { P.setBig(true); this.popText(P.cx, P.y - 8, 'BSSAHA!', '#ffe080'); }
        else this.addScore(1000, P.cx, P.y);
        Audio.sfxPlay('power');
      } else if (it.type === 'khamsa') {
        P.khamsa = 560; Audio.sfxPlay('khamsa');
        this.popText(P.cx, P.y - 8, 'KHAMSA 3LIK!', '#80d0ff');
      } else if (it.type === 'tea') {
        this.oneUp(); this.popText(P.cx, P.y - 20, 'ATAY!', '#a0ff80');
      }
    }
    // ---- projectiles ----
    for (const p of this.projs) {
      if (p.dead) continue;
      if (p.owner === 'player') {
        for (const e of this.enemies) {
          if (e.alive && overlap(p, e.hitbox()) && e.harmful) { if (e.hit(1, p.x)) { p.dead = true; break; } }
        }
        const b = this.boss;
        if (!p.dead && b && b.canHit && b.visible && overlap(p, b)) { b.damage(1); p.dead = true; }
      } else if (p.harmful && overlap(p, pb)) {
        if (P.khamsa > 0 && p.type !== 'pillar') { p.dead = true; this.spark(p.x, p.y, '#ffffff'); continue; }
        P.hurt(P.cx < p.x ? -2 : 2);
        if (p.type === 'potion' || p.type === 'fireball' || p.type === 'rock' || p.type === 'jar' || p.type === 'bluefire') p.dead = true;
      }
    }
    // ---- melee ----
    if (P.atkBox) {
      const dmg = P.ch.attack === 'cane' ? 2 : 1;
      for (const e of this.enemies) {
        if (e.alive && !P.atkHit.has(e) && overlap(P.atkBox, e.hitbox()) && e.harmful) { P.atkHit.add(e); e.hit(dmg, P.cx); }
      }
      const b = this.boss;
      if (b && !P.atkHit.has(b) && b.canHit && b.visible && overlap(P.atkBox, b)) { if (b.damage(1)) P.atkHit.add(b); }
      for (const p of this.projs) {
        if (p.owner === 'enemy' && !p.dead && ['potion', 'rock', 'jar', 'fireball', 'bluefire'].includes(p.type) && overlap(P.atkBox, p)) {
          p.dead = true; for (let i = 0; i < 5; i++) this.spark(p.x, p.y, '#ffffff');
        }
      }
    }
    // ---- enemy bodies ----
    for (const e of this.enemies) {
      if (!e.alive || !e.active || !e.harmful) continue;
      const hb = e.hitbox();
      if (hb.h <= 0 || !overlap(pb, hb)) continue;
      if (P.khamsa > 0) { e.d.invuln ? (e.alive = false, e.deathKind = 'flip', e.vy = -3) : e.hit(99, P.cx); this.addScore(200); continue; }
      if (P.dashT > 0) { e.hit(1, P.cx); continue; }
      if (e.d.stomp && P.vy > 0 && P.prevBottom <= hb.y + 7) {
        e.stomp(P);
        P.vy = Input.held('jump') || Input.held('up') ? -7 : -4.6;
        P.combo++;
        if (P.combo >= 5) this.oneUp();
        continue;
      }
      P.hurt(P.cx < hb.x + hb.w / 2 ? -2 : 2);
    }
    // ---- boss body ----
    const b = this.boss;
    if (b && !b.dead && b.visible) {
      if (overlap(pb, b)) {
        if (b.canStomp && P.vy > 0 && P.prevBottom <= b.y + 12) {
          b.damage(2); P.vy = -7.5; this.popText(P.cx, P.y - 10, choice(['TAK!', 'HAK!', 'BOOM!']), '#ffe060');
        } else if (P.khamsa > 0) { b.damage(1); }
        else if (b.harmful) P.hurt(P.cx < b.cx ? -3 : 3);
      }
      if (b.whipBox && overlap(pb, b.whipBox)) P.hurt(P.cx < b.cx ? -3 : 3);
    }
  }

  updateCamera() {
    const P = this.player;
    const maxX = this.w * TS - W;
    const look = P.facing * 30;
    const target = clamp(P.cx - W / 2 + look, 0, Math.max(0, maxX));
    if (!P.dead) this.cam.x += (target - this.cam.x) * 0.1;
    this.cam.x = clamp(this.cam.x, 0, Math.max(0, maxX));
    this.cam.y = this.h * TS - H;
  }

  // ---------- render ----------
  draw() {
    const sx = this.shake > 0 ? rndi(-2, 2) : 0, sy = this.shake > 0 ? rndi(-2, 2) : 0;
    const cam = { x: Math.round(this.cam.x) + sx, y: Math.round(this.cam.y) + sy };
    // background
    ctx.drawImage(this.bg.sky, 0, 0);
    for (const l of this.bg.layers) {
      const off = Math.floor(cam.x * l.f) % BGW;
      for (let x = -off; x < W; x += BGW) ctx.drawImage(l.c, x, 0);
    }
    // static tiles
    ctx.drawImage(this.staticCanvas, cam.x, cam.y, W, H, 0, 0, W, H);
    // dynamic tiles
    const th = THEMES[this.theme];
    const x0 = Math.max(0, Math.floor(cam.x / TS)), x1 = Math.min(this.w - 1, Math.floor((cam.x + W) / TS));
    const qf = [0, 1, 2, 1][Math.floor(this.t / 10) % 4];
    for (let ty = 0; ty < this.h; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        const t = this.tiles[ty * this.w + tx];
        if (t === T.EMPTY || t === T.GROUND || t === T.STONE || t === T.PLAT || t === T.SPIKE) continue;
        const bump = this.bumps.get(ty * this.w + tx) || 0;
        const x = tx * TS - cam.x, y = ty * TS - cam.y - (bump ? Math.round(Math.sin((bump / 8) * Math.PI) * 5) : 0);
        if (t === T.BRICK) ctx.drawImage(brickTile(this.theme), x, y);
        else if (isQ(t)) ctx.drawImage(qblockTile(this.theme, qf, false), x, y);
        else if (t === T.USED) ctx.drawImage(qblockTile(this.theme, 0, true), x, y);
        else if (t === T.LIQUID) {
          const top = tileAt(this, tx, ty - 1) !== T.LIQUID;
          const c = liquidColor(th, tx);
          ctx.fillStyle = shade(c, -0.15); ctx.fillRect(x, y, TS, TS);
          if (top) {
            ctx.fillStyle = c; ctx.fillRect(x, y + 3, TS, 5);
            ctx.fillStyle = shade(c, 0.35);
            for (let i = 0; i < TS; i += 4) ctx.fillRect(x + i, y + 2 + Math.round(Math.sin((tx * TS + i) * 0.3 + this.t * 0.1) * 1.5), 3, 1);
          }
        }
      }
    // gate
    if (this.gate) {
      const a = this.gate.appear > 0 ? 1 - this.gate.appear / 40 : 1;
      ctx.globalAlpha = a;
      drawGate(ctx, this.gate.x - cam.x, this.gate.y - cam.y, this.theme, true);
      ctx.globalAlpha = 1;
    }
    for (const cp of this.checkpoints) drawSpr(SPR.lantern[cp.lit ? 1 : 0], cp.x + 8 - cam.x, cp.y + 17 - cam.y);
    for (const m of this.movers) {
      for (let i = 0; i < 3; i++) ctx.drawImage(platTile(this.theme, i), Math.round(m.x + i * TS - cam.x), Math.round(m.y - cam.y));
    }
    for (const it of this.items) it.draw(cam);
    for (const e of this.enemies) if (e.active || Math.abs(e.x - cam.x - W / 2) < W) e.draw(cam);
    if (this.boss) this.boss.draw(cam);
    const P = this.player;
    if (this.state !== 'clear' || this.endT < 60) P.draw(cam);
    for (const p of this.projs) p.draw(cam);
    for (const p of this.parts) p.draw(cam);
    if (th.night) { ctx.fillStyle = 'rgba(20,10,60,0.12)'; ctx.fillRect(0, 0, W, H); }
    if (this.darkness) this.drawDarkness(cam);
    this.drawHUD();
    if (this.banner > 0 && this.state === 'play') this.drawBanner();
    if (this.dialog) this.dialog.draw();
  }

  drawDarkness(cam) {
    if (!this.darkC) this.darkC = makeCanvas(W, H);
    const g = this.darkC.getContext('2d');
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(2,4,14,0.93)'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => {
      const grd = g.createRadialGradient(x, y, r * 0.3, x, y, r);
      grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    };
    const P = this.player;
    hole(P.cx - cam.x, P.y + P.h / 2 - cam.y, 78 + Math.sin(this.t * 0.1) * 3);
    for (const p of this.projs) if (p.type === 'bluefire' || p.type === 'fireball') hole(p.x + 4 - cam.x, p.y + 4 - cam.y, 22);
    if (this.boss && this.boss.visible) hole(this.boss.cx - cam.x, this.boss.y + 14 - cam.y, 26);
    ctx.drawImage(this.darkC, 0, 0);
    if (this.boss && this.boss.visible) { // glowing eyes always visible
      ctx.fillStyle = '#80fff0';
      const ex = this.boss.cx - cam.x, ey = this.boss.y + 6 - cam.y;
      ctx.fillRect(Math.round(ex - 5), Math.round(ey), 3, 2); ctx.fillRect(Math.round(ex + 2), Math.round(ey), 3, 2);
    }
  }

  drawHUD() {
    const P = this.player, ch = P.ch;
    ctx.fillStyle = 'rgba(16,8,20,0.55)'; ctx.fillRect(0, 0, W, 16);
    // head icon
    const head = CHAR_SPR[ch.id].small.idle0;
    ctx.drawImage(head, 7, 9, 16, 16, 3, 0, 16, 16);
    drawText('X' + String(SAVE.lives).padStart(2, '0'), 22, 5, '#ffffff');
    ctx.drawImage(SPR.coinIcon, 58, 2);
    drawText('X' + String(RUN.coins).padStart(2, '0'), 72, 5, '#ffe060');
    drawText(String(RUN.score).padStart(7, '0'), 112, 5, '#ffffff');
    drawText(this.def.id + ' ' + this.def.name, 300, 5, '#ffd8a0', 1, '#1a0f14', 'center');
    // power indicators
    if (P.khamsa > 0) { ctx.drawImage(SPR.khamsa, 400, 0, 14, 18, 404, 1, 10, 13); drawText(String(Math.ceil(P.khamsa / 60)), 418, 5, '#80d0ff'); }
    // boss bar
    const b = this.boss;
    if (b && this.state !== 'intro') {
      const bw = 200, bx = (W - bw) / 2, by = H - 16;
      ctx.fillStyle = 'rgba(16,8,20,0.75)'; ctx.fillRect(bx - 4, by - 12, bw + 8, 24);
      drawText(b.info.name, W / 2, by - 9, '#ffb0b0', 1, '#1a0f14', 'center');
      ctx.fillStyle = '#3a1020'; ctx.fillRect(bx, by, bw, 6);
      ctx.fillStyle = b.phase2 ? '#ff4040' : '#e8a020';
      ctx.fillRect(bx, by, Math.round((bw * b.hp) / b.maxhp), 6);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx, by, Math.round((bw * b.hp) / b.maxhp), 1);
    }
  }

  drawBanner() {
    const a = Math.min(1, this.banner / 30);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(16,8,20,0.7)'; ctx.fillRect(0, 96, W, 54);
    const wd = WORLDS[this.def.world];
    drawText('MONDE ' + this.def.id + ' - ' + wd.name, W / 2, 104, wd.color, 1, '#1a0f14', 'center');
    drawText(this.def.name, W / 2, 118, '#ffffff', 2, '#1a0f14', 'center');
    drawText('YALLAH!', W / 2, 140, '#ffe060', 1, '#1a0f14', 'center');
    ctx.globalAlpha = 1;
  }
}

function bossPortrait(kind) {
  return { shuwafa: SPR.shuwafa.float0, ghoula: SPR.ghoula.walk0, afrit: SPR.afrit.float0, kandicha: SPR.kandicha.idle0 }[kind];
}
