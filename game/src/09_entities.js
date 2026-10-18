// ============================================================
// Enemies, items, projectiles, particles, gate, checkpoint
// ============================================================
const ENEMY_DEF = {
  ghoul: { w: 12, h: 15, speed: 0.45, stomp: true, walker: true, ledge: false, score: 100 },
  cat: { w: 14, h: 10, speed: 1.15, stomp: true, walker: true, ledge: true, score: 150 },
  scorpion: { w: 16, h: 10, speed: 0.55, stomp: true, walker: true, ledge: true, score: 150 },
  witch: { w: 14, h: 16, stomp: true, flyer: true, score: 200 },
  bat: { w: 12, h: 9, stomp: true, flyer: true, score: 150 },
  djinn: { w: 14, h: 16, stomp: false, flyer: true, hp: 2, score: 300 },
  fireskull: { w: 10, h: 10, stomp: false, invuln: true, score: 0 },
  cobra: { w: 10, h: 20, stomp: true, score: 200 },
};

class Enemy {
  constructor(L, tx, ty, type) {
    const d = ENEMY_DEF[type];
    this.L = L; this.type = type; this.d = d;
    this.w = d.w; this.h = d.h;
    this.x = tx * TS + (TS - d.w) / 2; this.y = (ty + 1) * TS - d.h;
    this.vx = 0; this.vy = 0; this.dir = -1; this.t = rndi(0, 100);
    this.hp = d.hp || 1; this.alive = true; this.dying = 0; this.deathKind = null; this.flash = 0;
    this.active = false; this.ox = this.x; this.oy = this.y; this.state = 0; this.cool = rndi(60, 140);
    if (type === 'witch' || type === 'djinn') { this.y -= 20; this.oy = this.y; }
    if (type === 'bat') { this.y = Math.max(0, this.y); this.state = 0; }
    if (type === 'fireskull') { this.y = L.h * TS + 10; this.oy = this.y; this.cool = rndi(20, 90); }
    if (type === 'cobra') { this.rise = 0; }
  }
  get harmful() {
    if (!this.alive) return false;
    if (this.type === 'cobra') return this.rise > 0.4;
    if (this.type === 'bat') return this.state > 0 || true;
    return true;
  }
  hitbox() {
    if (this.type === 'cobra') {
      const hh = Math.round(this.h * this.rise);
      return { x: this.x, y: this.y + this.h - hh, w: this.w, h: hh };
    }
    return this;
  }
  update(P) {
    const L = this.L;
    this.t++;
    if (this.flash > 0) this.flash--;
    if (!this.alive) {
      this.dying++;
      if (this.deathKind === 'flip') { this.vy += 0.3; this.y += this.vy; this.x += this.vx; if (this.y > L.h * TS + 40) this.remove = true; }
      else if (this.dying > 30) this.remove = true;
      return;
    }
    const d = this.d;
    switch (this.type) {
      case 'ghoul': case 'cat': case 'scorpion': {
        let sp = d.speed;
        if (this.type === 'scorpion') { // stop & strike
          if (this.t % 160 > 125) sp = 0;
        }
        this.vx = this.dir * sp;
        this.vy = Math.min(this.vy + GRAV, MAXFALL);
        if (this.type === 'cat' && this.onGround && this.t % 130 === 0) this.vy = -4.2;
        moveBody(this, L);
        if (this.hitWall) this.dir = -this.dir;
        else if (d.ledge && this.onGround && !groundAhead(L, this, this.dir)) this.dir = -this.dir;
        if (this.y > L.h * TS + 20) this.remove = true;
        break;
      }
      case 'witch': {
        this.x = this.ox + Math.sin(this.t * 0.012) * 56;
        this.y = this.oy + Math.sin(this.t * 0.05) * 10;
        this.dir = Math.cos(this.t * 0.012) > 0 ? 1 : -1;
        if (--this.cool <= 0 && Math.abs(P.cx - this.x) < 220 && !P.dead) {
          this.cool = rndi(130, 190);
          const dx = P.cx - (this.x + 7), tt = 50;
          L.addProj(new Proj(this.x + 7, this.y + 10, dx / tt, -3.2, 'potion', 'enemy'));
          if (Math.random() < 0.3) Audio.sfxPlay('laugh');
        }
        break;
      }
      case 'bat': {
        if (this.state === 0) {
          if (Math.abs(P.cx - (this.x + 6)) < 90 && P.y > this.y) { this.state = 1; this.t = 0; this.tx = P.cx; this.dir = P.cx > this.x ? 1 : -1; }
        } else {
          this.x += this.dir * 1.6;
          this.y = this.oy + Math.sin(Math.min(Math.PI, this.t * 0.035)) * 90;
          if (this.t > 200) { this.state = 0; this.oy = this.y; this.t = 0; }
        }
        break;
      }
      case 'djinn': {
        const looking = (P.cx < this.x + 7 && P.facing < 0) || (P.cx > this.x + 7 && P.facing > 0);
        this.shy = looking;
        if (!looking && !P.dead) {
          const dx = P.cx - (this.x + 7), dy = P.y + 4 - this.y;
          const m = Math.hypot(dx, dy) || 1;
          this.x += (dx / m) * 0.55; this.y += (dy / m) * 0.55;
          this.dir = dx > 0 ? 1 : -1;
        }
        this.y += Math.sin(this.t * 0.08) * 0.2;
        break;
      }
      case 'fireskull': {
        if (this.state === 0) {
          if (--this.cool <= 0) { this.state = 1; this.vy = -7.4; Audio.sfxPlay('fire'); }
        } else {
          this.vy += 0.18; this.y += this.vy;
          if (this.y >= this.oy) { this.y = this.oy; this.state = 0; this.cool = rndi(70, 120); }
        }
        break;
      }
      case 'cobra': {
        const near = Math.abs(P.cx - (this.x + 5)) < 70;
        if (this.state === 0) { if (near && --this.cool <= 0) this.state = 1; this.rise = Math.max(0, this.rise - 0.05); }
        else if (this.state === 1) { this.rise += 0.05; if (this.rise >= 1) { this.rise = 1; this.state = 2; this.t = 0; } }
        else if (this.state === 2) { if (this.t > 100) this.state = 3; }
        else if (this.state === 3) { this.rise -= 0.04; if (this.rise <= 0) { this.rise = 0; this.state = 0; this.cool = 70; } }
        break;
      }
    }
  }
  stomp(P) {
    this.L.addScore(this.d.score, this.x + this.w / 2, this.y);
    Audio.sfxPlay('stomp');
    if (this.type === 'ghoul') { this.alive = false; this.deathKind = 'squash'; }
    else if (this.type === 'witch' || this.type === 'bat') { this.alive = false; this.deathKind = 'flip'; this.vy = -1; this.vx = P.vx * 0.3; }
    else { this.alive = false; this.deathKind = 'flip'; this.vy = -2; }
    for (let i = 0; i < 5; i++) this.L.spark(this.x + this.w / 2, this.y, '#ffffff');
  }
  hit(dmg, fromX) {
    if (!this.alive || this.d.invuln) return false;
    this.hp -= dmg; this.flash = 8;
    if (this.hp <= 0) {
      this.alive = false; this.deathKind = 'flip'; this.vy = -3.5; this.vx = fromX < this.x ? 1 : -1;
      this.L.addScore(this.d.score, this.x + this.w / 2, this.y);
      Audio.sfxPlay('kill');
      if (this.type === 'djinn') { this.deathKind = 'poof'; for (let i = 0; i < 12; i++) this.L.smoke(this.x + rnd(0, 14), this.y + rnd(0, 16), '#8a7af0'); }
    } else Audio.sfxPlay('bump');
    return true;
  }
  draw(cam) {
    const x = this.x + this.w / 2 - cam.x, y = this.y + this.h + 1 - cam.y;
    let c, flip = this.dir > 0;
    const f = Math.floor(this.t / 10) % 2;
    switch (this.type) {
      case 'ghoul': c = !this.alive && this.deathKind === 'squash' ? SPR.ghoulSquash : SPR.ghoul[f]; break;
      case 'cat': c = SPR.cat[f]; break;
      case 'scorpion': c = SPR.scorpion[this.t % 160 > 125 ? 1 : f]; break;
      case 'witch': c = SPR.witch[f]; break;
      case 'bat': c = SPR.bat[this.state === 0 ? 2 : Math.floor(this.t / 6) % 2]; break;
      case 'djinn': c = this.shy ? SPR.djinnShy : SPR.djinn[f]; break;
      case 'fireskull': c = SPR.fireskull[Math.floor(this.t / 5) % 2]; flip = false; break;
      case 'cobra': {
        const sy = y;
        if (this.rise > 0) {
          const cc = SPR.cobra[Math.floor(this.t / 14) % 2];
          const vis = Math.round(cc.height * (0.35 + 0.65 * this.rise));
          ctx.drawImage(cc, 0, 0, cc.width, vis, Math.round(x - cc.width / 2), Math.round(sy - vis + (cc.height - vis) * 0), cc.width, vis);
        }
        drawSpr(SPR.basket, x, sy + 1);
        return;
      }
    }
    if (this.deathKind === 'poof') return;
    if (!this.alive && this.deathKind === 'flip') {
      ctx.save(); ctx.translate(Math.round(x), Math.round(y - this.h / 2)); ctx.scale(flip ? -1 : 1, -1);
      ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore();
      return;
    }
    if (this.type === 'djinn') ctx.globalAlpha = 0.88;
    drawSpr(this.flash > 0 && this.flash % 2 ? flashOf(c) : c, x, y + (this.type === 'witch' ? 6 : 0), flip);
    ctx.globalAlpha = 1;
  }
}

// ---------------- items ----------------
class Item {
  constructor(L, x, y, type, emerge) {
    this.L = L; this.type = type; this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.t = rndi(0, 40);
    this.w = type === 'coin' ? 10 : 12; this.h = type === 'coin' ? 12 : 12;
    this.emerge = emerge ? 20 : 0; this.static = type === 'coin';
    if (emerge) { this.x = x + (TS - this.w) / 2; this.y = y + 2; }
    else if (type === 'coin') { this.x = x + 3; this.y = y + 2; }
  }
  update() {
    this.t++;
    if (this.static) return;
    if (this.emerge > 0) { this.emerge--; this.y -= 0.8; if (this.emerge === 0) this.vx = this.type === 'khamsa' ? 1.4 : 1; return; }
    this.vy = Math.min(this.vy + GRAV * 0.7, MAXFALL);
    moveBody(this, this.L);
    if (this.hitWall) this.vx = -this.vx;
    if (this.type === 'khamsa' && this.onGround) this.vy = -4.5;
    if (this.y > this.L.h * TS + 20) this.remove = true;
  }
  draw(cam) {
    const x = this.x + this.w / 2 - cam.x, y = this.y + this.h + 1 - cam.y;
    let c;
    if (this.type === 'coin') c = SPR.coin[Math.floor(this.t / 7) % 4];
    else if (this.type === 'msemen') c = SPR.msemen;
    else if (this.type === 'khamsa') c = SPR.khamsa;
    else c = SPR.tea;
    const bob = this.type === 'coin' ? 0 : 0;
    if (this.emerge > 0) { // clip behind block
      const vis = Math.min(c.height, Math.round((20 - this.emerge) * 0.8) + 2);
      ctx.drawImage(c, 0, 0, c.width, vis, Math.round(x - c.width / 2), Math.round(y - c.height), c.width, vis);
      return;
    }
    drawSpr(c, x, y + bob);
    if (this.type === 'khamsa' && this.t % 8 === 0) this.L.spark(this.x + rnd(0, 12), this.y + rnd(0, 12), '#ffe060');
  }
}

// ---------------- projectiles ----------------
const PROJ_DEF = {
  babouche: { w: 9, h: 6, grav: 0.22, spr: () => SPR.babouche },
  orange: { w: 6, h: 6, grav: 0.04, spr: () => SPR.orange },
  potion: { w: 6, h: 8, grav: 0.16, spr: () => SPR.potion },
  flame: { w: 12, h: 10, grav: 0 },
  fireball: { w: 8, h: 8, grav: 0, spr: (t) => SPR.fireball[Math.floor(t / 4) % 2] },
  rock: { w: 8, h: 8, grav: 0.25, spr: () => SPR.rock },
  jar: { w: 10, h: 12, grav: 0.2, spr: () => SPR.jar },
  bluefire: { w: 8, h: 10, grav: 0.1, spr: (t) => SPR.bluefire[Math.floor(t / 5) % 2] },
  shock: { w: 14, h: 10, grav: 0 },
  pillar: { w: 18, h: 96, grav: 0 },
};
class Proj {
  constructor(x, y, vx, vy, type, owner) {
    const d = PROJ_DEF[type];
    this.type = type; this.owner = owner; this.d = d;
    this.w = d.w; this.h = d.h; this.x = x - d.w / 2; this.y = y - d.h / 2;
    this.vx = vx; this.vy = vy; this.t = 0; this.life = 240; this.bounces = 0; this.dead = false;
    if (type === 'flame') this.life = 75;
    if (type === 'orange') this.life = 70;
    if (type === 'pillar') { this.life = 100; this.warn = 45; }
  }
  get harmful() { return this.type !== 'pillar' || this.t > this.warn; }
  update(L) {
    this.t++;
    if (--this.life <= 0) { this.dead = true; return; }
    if (this.type === 'pillar' || this.type === 'flame') return;
    this.vy += this.d.grav;
    this.x += this.vx; this.y += this.vy;
    const cx = Math.floor((this.x + this.w / 2) / TS), by = Math.floor((this.y + this.h) / TS), cy = Math.floor((this.y + this.h / 2) / TS);
    const hitGround = this.vy > 0 && isSolid(L, cx, by);
    const hitSide = isSolid(L, cx, cy);
    if (this.type === 'shock') {
      if (isSolid(L, Math.floor((this.vx > 0 ? this.x + this.w : this.x) / TS), cy)) this.dead = true;
      if (this.t % 3 === 0) L.dust(this.x + this.w / 2, this.y + this.h, '#d8c8a0');
      return;
    }
    if (this.type === 'babouche') {
      if (hitSide && !hitGround) { this.dead = true; L.dust(this.x, this.y); return; }
      if (hitGround) {
        this.y = by * TS - this.h;
        if (this.bounces++ >= 1) { this.dead = true; L.dust(this.x + 4, this.y + 6); return; }
        this.vy = -2.4;
      }
    } else if (hitSide || hitGround) {
      this.dead = true;
      if (this.type === 'potion') {
        Audio.sfxPlay('potion');
        L.addProj(new Proj(this.x + 3, by * TS - 5, 0, 0, 'flame', 'enemy'));
        for (let i = 0; i < 8; i++) L.spark(this.x + 3, this.y + 4, '#60ff80');
      } else if (this.type === 'jar') {
        Audio.sfxPlay('break');
        for (let i = 0; i < 8; i++) L.debris(this.x + 5, this.y + 6, '#c0683a');
      } else L.dust(this.x + this.w / 2, this.y + this.h / 2, this.type === 'orange' ? '#f08a1a' : '#d8c8a0');
    }
    if (this.y > L.h * TS + 30 || this.x < -40 || this.x > L.w * TS + 40) this.dead = true;
  }
  draw(cam) {
    const x = this.x + this.w / 2 - cam.x, y = this.y + this.h - cam.y;
    if (this.type === 'flame') {
      for (let i = 0; i < 4; i++) {
        const fx = x - 6 + i * 4, h = 6 + ((this.t * 3 + i * 7) % 7);
        ctx.fillStyle = i % 2 ? '#60ff80' : '#30c050';
        ctx.fillRect(Math.round(fx), Math.round(y - h), 3, h);
        ctx.fillStyle = '#d0ffd8'; ctx.fillRect(Math.round(fx + 1), Math.round(y - h + 2), 1, 2);
      }
      return;
    }
    if (this.type === 'shock') {
      ctx.fillStyle = '#e8d8b0';
      for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(x - 7 + i * 4), Math.round(y - 4 - ((this.t + i * 2) % 6)), 3, 4 + ((this.t + i * 2) % 6));
      return;
    }
    if (this.type === 'pillar') {
      const bx = Math.round(x - this.w / 2), by = Math.round(y);
      if (this.t <= this.warn) {
        if (Math.floor(this.t / 4) % 2) { ctx.fillStyle = 'rgba(255,120,40,0.55)'; ctx.fillRect(bx, by - 6, this.w, 6); }
        return;
      }
      const k = Math.min(1, (this.t - this.warn) / 8);
      const hh = Math.round(this.h * k);
      for (let i = 0; i < this.w; i += 3) {
        const wob = Math.sin((this.t + i) * 0.5) * 4;
        ctx.fillStyle = i % 6 ? '#ff8a20' : '#ffd040';
        ctx.fillRect(bx + i, by - hh + wob, 3, hh - wob);
      }
      ctx.fillStyle = '#fff6a0'; ctx.fillRect(bx + 6, by - hh + 6, 6, hh - 6);
      return;
    }
    const c = this.d.spr(this.t);
    if (this.type === 'babouche') {
      ctx.save(); ctx.translate(Math.round(x), Math.round(y - 3)); ctx.rotate(Math.floor(this.t / 3) * (Math.PI / 2) * sign(this.vx || 1));
      ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore();
      return;
    }
    drawSpr(c, x, y + 1, this.vx < 0);
  }
}

// ---------------- particles ----------------
class Part {
  constructor(o) { Object.assign(this, { vx: 0, vy: 0, grav: 0, life: 30, size: 1, kind: 'px' }, o); this.max = this.life; }
  update() { this.life--; this.vy += this.grav; this.x += this.vx; this.y += this.vy; }
  draw(cam) {
    const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
    if (this.kind === 'text') { drawText(this.text, x, y, this.color, 1, '#1a0f14', 'center'); return; }
    if (this.kind === 'spr') { drawSpr(this.spr[Math.floor((this.max - this.life) / 4) % this.spr.length], x, y); return; }
    if (this.kind === 'smoke') {
      ctx.globalAlpha = Math.max(0, this.life / this.max) * 0.7;
      ctx.fillStyle = this.color; const s = Math.round(this.size + (this.max - this.life) * 0.15);
      ctx.fillRect(x - s / 2, y - s / 2, s, s); ctx.globalAlpha = 1; return;
    }
    ctx.fillStyle = this.color; ctx.fillRect(x, y, this.size, this.size);
  }
}

// ---------------- exit gate + checkpoint ----------------
function drawGate(g, x, y, theme, open) {
  // horseshoe-arch "bab" with zellige frame; (x,y) = bottom-left in screen coords; 32x48
  const th = THEMES[theme];
  const wall = th.night ? '#5a4a5a' : th.stone === 'blueblock' ? '#f4f8ff' : '#d8a878';
  const dark = shade(wall, -0.35);
  g.fillStyle = dark; g.fillRect(x - 4, y - 52, 40, 52);
  g.fillStyle = wall; g.fillRect(x - 3, y - 51, 38, 51);
  // zellige band
  for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#1f8a5a' : '#2a5ab8'; g.fillRect(x - 2 + i * 4, y - 50, 4, 4); }
  g.fillStyle = '#f2c230'; g.fillRect(x - 3, y - 46, 38, 1);
  // horseshoe arch opening
  g.fillStyle = open ? '#000000' : '#5a3418';
  g.beginPath(); g.arc(x + 16, y - 26, 13, Math.PI * 0.82, Math.PI * 2.18); g.lineTo(x + 26, y); g.lineTo(x + 6, y); g.closePath(); g.fill();
  if (!open) {
    g.fillStyle = '#7a4a22'; g.fillRect(x + 15, y - 34, 2, 34);
    g.fillStyle = '#c8a040'; for (let i = 0; i < 4; i++) { g.fillRect(x + 9, y - 30 + i * 8, 2, 2); g.fillRect(x + 21, y - 30 + i * 8, 2, 2); }
  } else {
    g.fillStyle = 'rgba(255,220,140,0.25)'; g.fillRect(x + 8, y - 26, 16, 26);
  }
  g.strokeStyle = '#f2c230'; g.lineWidth = 1;
  g.beginPath(); g.arc(x + 16, y - 26, 14.5, Math.PI * 0.82, Math.PI * 2.18); g.stroke();
}
