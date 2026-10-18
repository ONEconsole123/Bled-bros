// ============================================================
// Bosses
// ============================================================
const GROUND_Y = 14 * TS; // arena floor (top of row 14)

const BOSS_INFO = {
  shuwafa: {
    name: 'LA SHUWAFA', hp: 10,
    intro: [
      { who: 'boss', text: 'HHH... CHKOUN NTA? JITI L\'HANOUT DYALI BLA MA TSTA2DEN?' },
      { who: 'boss', text: 'GHADI NSA7REK O NRDDEK MCHICHA!' },
      { who: 'hero' },
    ],
  },
  ghoula: {
    name: 'LA GHOULA', hp: 12,
    intro: [
      { who: 'boss', text: 'GHRRRR... RI7T BNADEM! CHHAL HADI MA KLIT!' },
      { who: 'boss', text: 'TA3ALA L3ENDI A SGHIR... GHADI NAKLEK B LKHOBZ!' },
      { who: 'hero' },
    ],
  },
  afrit: {
    name: 'BOU NAR L\'AFRIT', hp: 14,
    intro: [
      { who: 'boss', text: 'ANA BOU NAR! SA7RA KAMLA DYALI!' },
      { who: 'boss', text: 'NAR DYALI KATHRE9 LHJAR... O NTA GHIR BNADEM!' },
      { who: 'hero' },
    ],
  },
  kandicha: {
    name: 'AICHA KANDICHA', hp: 18,
    intro: [
      { who: 'boss', text: 'WACH NTA LI JITI T9ELLEB 3LIYA F L\'OUED?' },
      { who: 'boss', text: 'BZZAF DYAL NAS DKHLO LHNA... WALOU MA KHREJ.' },
      { who: 'boss', text: 'GHADI TB9A M3AYA LTALI!' },
      { who: 'hero' },
    ],
  },
};
const HERO_LINES = {
  youssef: 'SAFI, YALLAH NCHOUFOU CHKOUN LI GHADI YRBE7!',
  salma: 'MA KANKHAFCH MNEK! LBLED MACHI DYALEK!',
  moha: 'BISMILLAH... A WLIDI, RANI CHFT KTER MNEK!',
  amghar: 'SA7RA MA KATKHL3NICH. NTA LI KHASSEK TKHAF.',
};

class Boss {
  constructor(L, kind) {
    this.L = L; this.kind = kind; this.info = BOSS_INFO[kind];
    this.hp = this.info.hp; this.maxhp = this.hp; this.inv = 0; this.dead = false; this.deathT = 0;
    this.state = 'idle'; this.st = 0; this.t = 0; this.dir = -1; this.vx = 0; this.vy = 0;
    this.canStomp = false; this.canHit = true; this.harmful = true; this.visible = true; this.alpha = 1;
  }
  get cx() { return this.x + this.w / 2; }
  get phase2() { return this.hp <= this.maxhp / 2; }
  set(state) { this.state = state; this.st = 0; }
  damage(n) {
    if (this.inv > 0 || this.dead || !this.visible) return false;
    this.hp -= n; this.inv = 45;
    Audio.sfxPlay('bosshit'); this.L.shake = 6;
    for (let i = 0; i < 8; i++) this.L.spark(this.cx + rnd(-10, 10), this.y + rnd(0, this.h), '#ffffff');
    if (this.hp <= 0) { this.hp = 0; this.dead = true; this.deathT = 0; Audio.stop(); Audio.sfxPlay('boom'); this.L.clearEnemyProjs(); }
    return true;
  }
  baseUpdate(P) {
    this.t++; this.st++;
    if (this.inv > 0) this.inv--;
    if (this.dead) {
      this.deathT++;
      if (this.deathT % 6 === 0) {
        const x = this.cx + rnd(-this.w / 2, this.w / 2), y = this.y + rnd(0, this.h);
        for (let i = 0; i < 6; i++) this.L.parts.push(new Part({ x, y, vx: rnd(-1.5, 1.5), vy: rnd(-1.5, 1.5), life: 24, color: choice(['#ffe060', '#ff8020', '#ffffff']), size: 2 }));
        Audio.sfxPlay('kill'); this.L.shake = 4;
      }
      if (this.deathT === 130) { Audio.sfxPlay('boom'); this.L.onBossDefeated(this); }
      return true;
    }
    return false;
  }
  drawSprite(c, cam, yOff = 0) {
    if (this.dead && this.deathT > 120) return;
    if (!this.visible) return;
    const x = this.cx - cam.x, y = this.y + this.h + yOff - cam.y;
    const flip = this.dir > 0;
    const fl = (this.inv > 0 && Math.floor(this.inv / 3) % 2) || (this.dead && Math.floor(this.deathT / 4) % 2);
    drawSpr(fl ? flashOf(c) : c, x, y, flip, this.alpha);
  }
}

// ---------------- SHUWAFA ----------------
class Shuwafa extends Boss {
  constructor(L) { super(L, 'shuwafa'); this.w = 22; this.h = 34; this.x = 380; this.y = 40; this.vx = -1.2; this.throws = 0; this.set('float'); }
  update(P) {
    if (this.baseUpdate(P)) return;
    const L = this.L, p2 = this.phase2;
    this.canStomp = false; this.harmful = true; this.visible = true;
    switch (this.state) {
      case 'float': {
        this.x += this.vx * (p2 ? 1.5 : 1);
        if (this.x < 40 || this.x > 418) this.vx = -this.vx;
        this.y = 50 + Math.sin(this.t * 0.05) * 12;
        this.dir = P.cx > this.cx ? 1 : -1;
        const rate = p2 ? 55 : 75;
        if (this.st % rate === rate - 1) {
          const tt = 48;
          const n = p2 ? 2 : 1;
          for (let i = 0; i < n; i++) L.addProj(new Proj(this.cx, this.y + 14, (P.cx - this.cx) / tt + (i ? 1.2 * this.dir : 0), -2.2, 'potion', 'enemy'));
          this.throws++;
          Audio.sfxPlay('throw');
        }
        if (this.throws >= (p2 ? 5 : 4)) { this.throws = 0; this.set('descend'); }
        break;
      }
      case 'descend': {
        const tx = (this.cx < 240 ? 196 : 262) - this.w / 2; // land next to the cauldron
        this.x += (tx - this.x) * 0.08;
        this.y += 2;
        if (this.y + this.h >= GROUND_Y) {
          this.y = GROUND_Y - this.h; this.set('stir');
          Audio.sfxPlay('laugh');
          L.popText(this.cx, this.y - 10, 'MCHICHAT, AJIW!', '#c0a0ff');
          const n = p2 ? 3 : 2;
          for (let i = 0; i < n; i++) L.spawnEnemy('cat', i % 2 ? 3 : 25, 13);
        }
        break;
      }
      case 'stir':
        this.canStomp = true;
        this.dir = this.cx < 240 ? 1 : -1;
        if (this.st % 20 === 0) L.smoke(240 + rnd(-10, 10), GROUND_Y - 22, '#60e080');
        if (this.st > (p2 ? 130 : 170)) this.set('rise');
        break;
      case 'rise':
        this.y -= 2.5;
        if (this.y <= 50) { this.set('poof'); }
        break;
      case 'poof':
        this.visible = false; this.harmful = false;
        if (this.st === 1) { for (let i = 0; i < 14; i++) L.smoke(this.cx + rnd(-12, 12), this.y + rnd(0, 30), '#7a5a9a'); Audio.sfxPlay('appear'); }
        if (this.st > 30) {
          this.x = P.cx < 240 ? 400 : 50; this.vx = this.x > 240 ? -1.2 : 1.2;
          for (let i = 0; i < 14; i++) L.smoke(this.cx + rnd(-12, 12), this.y + rnd(0, 30), '#7a5a9a');
          this.set('float');
        }
        break;
    }
  }
  draw(cam) {
    drawSpr(SPR.cauldron[Math.floor(this.t / 12) % 2], 240 - cam.x, GROUND_Y + 1 - cam.y);
    let c;
    if (this.inv > 20) c = SPR.shuwafa.hurt;
    else if (this.state === 'stir') c = SPR.shuwafa.stir;
    else if (this.state === 'float' && this.st % 75 > 60) c = SPR.shuwafa.cast;
    else c = SPR.shuwafa[Math.floor(this.t / 14) % 2 ? 'float1' : 'float0'];
    this.drawSprite(c, cam, 8);
  }
}

// ---------------- GHOULA ----------------
class Ghoula extends Boss {
  constructor(L) {
    super(L, 'ghoula'); this.w = 34; this.h = 56; this.x = 360; this.y = GROUND_Y - 56; this.cycle = 0; this.set('walk');
  }
  update(P) {
    if (this.baseUpdate(P)) return;
    const L = this.L, p2 = this.phase2;
    this.canStomp = this.state !== 'charge' && this.state !== 'jump';
    this.harmful = this.state !== 'stun';
    const onGround = () => this.y + this.h >= GROUND_Y;
    const clampX = () => { if (this.x < 16) { this.x = 16; return true; } if (this.x > 464 - this.w) { this.x = 464 - this.w; return true; } return false; };
    switch (this.state) {
      case 'walk':
        this.dir = P.cx > this.cx ? 1 : -1;
        this.x += this.dir * (p2 ? 1.1 : 0.75);
        clampX();
        if (p2 && this.st % 80 === 40) {
          L.addProj(new Proj(this.cx, this.y + 10, (P.cx - this.cx) / 45, -4, 'jar', 'enemy'));
          Audio.sfxPlay('throw');
        }
        if (this.st > (p2 ? 100 : 140)) { this.cycle++; this.set(this.cycle % 2 ? 'prejump' : 'precharge'); }
        break;
      case 'prejump':
        if (this.st > 22) { this.set('jump'); this.vy = -8.5; this.vx = clamp((P.cx - this.cx) / 50, -3, 3); Audio.sfxPlay('jump'); }
        break;
      case 'jump':
        this.vy += 0.32; this.y += this.vy; this.x += this.vx; clampX();
        if (this.vy > 0 && onGround()) {
          this.y = GROUND_Y - this.h; this.set('slam');
          Audio.sfxPlay('shock'); L.shake = 14;
          L.addProj(new Proj(this.x - 4, GROUND_Y - 5, -3, 0, 'shock', 'enemy'));
          L.addProj(new Proj(this.x + this.w + 4, GROUND_Y - 5, 3, 0, 'shock', 'enemy'));
          const n = p2 ? 5 : 3;
          for (let i = 0; i < n; i++) L.addProj(new Proj(rnd(40, 440), -10 - i * 40, 0, 0, 'rock', 'enemy'));
        }
        break;
      case 'slam':
        if (this.st > 40) this.set('walk');
        break;
      case 'precharge':
        this.dir = P.cx > this.cx ? 1 : -1;
        this.x += Math.sin(this.st) * 1.2;
        if (this.st === 2) { Audio.sfxPlay('laugh'); L.popText(this.cx, this.y - 8, 'GRAAAH!', '#ff8080'); }
        if (this.st > 30) this.set('charge');
        break;
      case 'charge':
        this.x += this.dir * (p2 ? 4.8 : 3.8);
        if (this.st % 4 === 0) L.dust(this.cx - this.dir * 14, GROUND_Y - 2);
        if (clampX()) {
          this.set('stun'); L.shake = 12; Audio.sfxPlay('shock');
          for (let i = 0; i < 2; i++) L.addProj(new Proj(rnd(60, 420), -10, 0, 0, 'rock', 'enemy'));
        }
        break;
      case 'stun':
        if (this.st > (p2 ? 100 : 130)) this.set('walk');
        break;
    }
  }
  draw(cam) {
    let c;
    if (this.inv > 22) c = SPR.ghoula.hurt;
    else if (this.state === 'stun') c = SPR.ghoula.stun;
    else if (this.state === 'jump' || this.state === 'prejump') c = SPR.ghoula.jump;
    else if (this.state === 'slam') c = SPR.ghoula.slam;
    else if (this.state === 'charge' || this.state === 'precharge') c = SPR.ghoula.charge;
    else c = SPR.ghoula[Math.floor(this.t / 16) % 2 ? 'walk1' : 'walk0'];
    this.drawSprite(c, cam, 3);
    if (this.state === 'stun' && !this.dead) { // dizzy stars
      for (let i = 0; i < 3; i++) {
        const a = this.t * 0.1 + i * 2.1;
        drawSpr(SPR.star[i % 2], this.cx + Math.cos(a) * 18 - cam.x, this.y - 4 + Math.sin(a) * 5 - cam.y);
      }
    }
  }
}

// ---------------- AFRIT BOU NAR ----------------
class Afrit extends Boss {
  constructor(L) { super(L, 'afrit'); this.w = 30; this.h = 40; this.x = 300; this.y = 50; this.set('float'); this.pillars = 0; }
  update(P) {
    if (this.baseUpdate(P)) return;
    const L = this.L, p2 = this.phase2;
    this.canStomp = this.state === 'stone';
    this.harmful = this.state !== 'stone' && this.state !== 'under';
    this.visible = this.state !== 'under';
    this.canHit = this.visible;
    switch (this.state) {
      case 'float': {
        const tx = 225 + Math.sin(this.t * 0.018) * 160, ty = 46 + Math.sin(this.t * 0.036) * 22;
        this.x += (tx - this.x) * 0.05; this.y += (ty - this.y) * 0.05;
        this.dir = P.cx > this.cx ? 1 : -1;
        const rate = p2 ? 48 : 64;
        if (this.st % rate === rate - 1) {
          const a = Math.atan2(P.y + 8 - (this.y + 20), P.cx - this.cx);
          const spread = p2 ? [-0.25, 0, 0.25] : [0];
          for (const s of spread) L.addProj(new Proj(this.cx, this.y + 20, Math.cos(a + s) * 2.6, Math.sin(a + s) * 2.6, 'fireball', 'enemy'));
          Audio.sfxPlay('fire');
        }
        if (this.st > 330) this.set('sink');
        break;
      }
      case 'sink':
        this.y += 2.2; this.alpha = Math.max(0, 1 - this.st / 40);
        if (this.y + this.h >= GROUND_Y + 30) { this.set('under'); this.pillars = 0; this.alpha = 1; }
        break;
      case 'under':
        if (this.st % (p2 ? 38 : 52) === 10) {
          L.addProj(new Proj(P.cx, GROUND_Y - 48, 0, 0, 'pillar', 'enemy'));
          this.pillars++;
          Audio.sfxPlay('fire');
        }
        if (this.pillars >= (p2 ? 5 : 3) && this.st > 160) { this.x = 225; this.y = GROUND_Y + 10; this.set('emerge'); }
        break;
      case 'emerge':
        this.y -= 2.5;
        if (this.y <= 70) this.set('ring');
        break;
      case 'ring':
        if (this.st === 20 || (p2 && this.st === 50)) {
          const n = p2 ? 12 : 8, off = this.st === 50 ? Math.PI / n : 0;
          for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + off; L.addProj(new Proj(this.cx, this.y + 20, Math.cos(a) * 2.2, Math.sin(a) * 2.2, 'fireball', 'enemy')); }
          Audio.sfxPlay('boom');
        }
        if (this.st > (p2 ? 80 : 50)) this.set('cool');
        break;
      case 'cool': // fall to the ground and turn to stone
        this.y += 3;
        if (this.y + this.h >= GROUND_Y) { this.y = GROUND_Y - this.h; this.set('stone'); L.shake = 8; Audio.sfxPlay('shock'); }
        break;
      case 'stone':
        if (this.st > (p2 ? 110 : 150)) { this.set('rise'); for (let i = 0; i < 10; i++) L.spark(this.cx + rnd(-14, 14), this.y + rnd(0, 40), '#ff8020'); }
        break;
      case 'rise':
        this.y -= 1.6;
        if (this.y <= 50) this.set('float');
        break;
    }
  }
  draw(cam) {
    let c;
    if (this.inv > 22) c = SPR.afrit.hurt;
    else if (this.state === 'stone' || this.state === 'cool') c = SPR.afrit.stone;
    else if (this.state === 'ring' || (this.state === 'float' && this.st % 64 > 50)) c = SPR.afrit.cast;
    else c = SPR.afrit[Math.floor(this.t / 10) % 2 ? 'float1' : 'float0'];
    if (this.state === 'under' || this.state === 'emerge') {
      // glowing sand where he moves underground
      if (this.state === 'emerge') this.drawSprite(c, cam, 10);
      return;
    }
    this.drawSprite(c, cam, 10);
  }
}

// ---------------- AICHA KANDICHA ----------------
const POOL_X = [72, 376]; // centers of the two pools
class Kandicha extends Boss {
  constructor(L) {
    super(L, 'kandicha'); this.w = 24; this.h = 50; this.pool = 1;
    this.x = POOL_X[1] - 12; this.y = GROUND_Y; this.whips = 0; this.set('emerge');
  }
  whipBand() { return this.whipHigh ? { y: GROUND_Y - 50, h: 18 } : { y: GROUND_Y - 16, h: 14 }; }
  update(P) {
    if (this.baseUpdate(P)) return;
    const L = this.L, p2 = this.phase2;
    L.darkness = p2 && !this.dead;
    this.canStomp = this.state === 'stun';
    this.harmful = this.state !== 'stun' && this.state !== 'under';
    this.visible = this.state !== 'under';
    this.canHit = this.visible && this.state !== 'emerge';
    this.whipBox = null;
    switch (this.state) {
      case 'emerge':
        if (this.st === 1) { L.splash(this.cx, GROUND_Y); Audio.sfxPlay('appear'); }
        this.y = GROUND_Y - this.h * Math.min(1, this.st / 40);
        this.dir = P.cx > this.cx ? 1 : -1;
        if (this.st >= 40) { this.set('whip'); this.whips = 0; }
        break;
      case 'whip': {
        this.dir = P.cx > this.cx ? 1 : -1;
        const tele = p2 ? 26 : 34, act = 16;
        if (this.st === 1) this.whipHigh = Math.random() < 0.45;
        if (this.st > tele && this.st <= tele + act) {
          const band = this.whipBand();
          const len = 200 * Math.min(1, (this.st - tele) / 6);
          this.whipBox = { x: this.dir > 0 ? this.cx : this.cx - len, y: band.y, w: len, h: band.h };
          if (this.st === tele + 1) Audio.sfxPlay('slash');
        }
        if (this.st > tele + act + 10) { this.whips++; this.set(this.whips >= (p2 ? 4 : 3) ? 'sink' : 'whip'); }
        break;
      }
      case 'sink':
        this.y += 1.6;
        if (this.y >= GROUND_Y) { this.set('under'); L.splash(this.cx, GROUND_Y); }
        break;
      case 'under':
        if (this.st > 40) {
          this.x = 240 - this.w / 2; this.y = 30;
          for (let i = 0; i < 12; i++) L.smoke(this.cx + rnd(-14, 14), this.y + rnd(0, 40), '#60a0b0');
          this.set('rain'); Audio.sfxPlay('laugh');
        }
        break;
      case 'rain':
        this.x = 240 - this.w / 2 + Math.sin(this.st * 0.03) * 170;
        this.y = 26 + Math.sin(this.st * 0.07) * 6;
        this.dir = Math.cos(this.st * 0.03) > 0 ? 1 : -1;
        if (this.st % (p2 ? 11 : 15) === 0) L.addProj(new Proj(this.cx + rnd(-8, 8), this.y + 30, rnd(-0.5, 0.5), 0.5, 'bluefire', 'enemy'));
        if (this.st > 220) this.set('land');
        break;
      case 'land':
        this.y += 3;
        if (this.y + this.h >= GROUND_Y) {
          this.y = GROUND_Y - this.h; this.set('summon');
          L.popText(this.cx, this.y - 10, 'GHWAL, AJIW!', '#80fff0');
          L.spawnEnemy('ghoul', 8, 13); L.spawnEnemy('ghoul', 21, 13);
          if (p2) L.spawnEnemy('djinn', 15, 6);
        }
        break;
      case 'summon':
        this.dir = P.cx > this.cx ? 1 : -1;
        if (this.st > 50) this.set('charge');
        break;
      case 'charge':
        this.x += this.dir * (p2 ? 4.4 : 3.5);
        if (this.st % 3 === 0) L.dust(this.cx - this.dir * 8, GROUND_Y - 2);
        if (this.st % 10 === 0) Audio.sfxPlay('bump');
        if (this.x < 18 || this.x > 462 - this.w) {
          this.x = clamp(this.x, 18, 462 - this.w);
          this.set('stun'); L.shake = 10; Audio.sfxPlay('shock');
        }
        break;
      case 'stun':
        if (this.st > (p2 ? 100 : 130)) {
          for (let i = 0; i < 12; i++) L.smoke(this.cx + rnd(-12, 12), this.y + rnd(0, 50), '#60a0b0');
          this.pool = P.cx < 240 ? 1 : 0; this.x = POOL_X[this.pool] - this.w / 2; this.y = GROUND_Y;
          this.set('emerge');
        }
        break;
    }
  }
  draw(cam) {
    if (!this.visible) return;
    let c;
    if (this.inv > 22) c = SPR.kandicha.hurt;
    else if (this.state === 'stun') c = SPR.kandicha.stun;
    else if (this.state === 'charge') c = SPR.kandicha.charge;
    else if (this.state === 'whip' && this.st > 20) c = SPR.kandicha.whip;
    else c = SPR.kandicha[Math.floor(this.t / 16) % 2 ? 'idle1' : 'idle0'];
    if (this.state === 'emerge' || this.state === 'sink') {
      // clipped: only the part above the water line
      const x = this.cx - cam.x, y = this.y + this.h + 8 - cam.y;
      const vis = Math.max(0, Math.round(GROUND_Y - cam.y - (y - c.height)));
      if (vis > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, GROUND_Y - cam.y); ctx.clip();
        drawSpr(c, x, y, this.dir > 0); ctx.restore();
      }
    } else this.drawSprite(c, cam, 8);
    if (this.state === 'whip' && !this.dead) {
      const band = this.whipBand();
      const tele = this.phase2 ? 26 : 34;
      if (this.st <= tele) { // telegraph: glowing strands near her
        if (Math.floor(this.st / 3) % 2) { ctx.fillStyle = 'rgba(120,255,240,0.5)'; ctx.fillRect(Math.round((this.dir > 0 ? this.cx : this.cx - 30) - cam.x), Math.round(band.y - cam.y), 30, band.h); }
      } else if (this.whipBox) {
        const b = this.whipBox;
        for (let i = 0; i < 5; i++) {
          ctx.strokeStyle = i % 2 ? '#141020' : '#2a2040'; ctx.lineWidth = 2;
          ctx.beginPath();
          const yy = b.y + 3 + i * (b.h - 6) / 4 - cam.y;
          ctx.moveTo(this.cx - cam.x, this.y + 14 - cam.y);
          for (let k = 0; k <= 10; k++) {
            const xx = this.cx + this.dir * (b.w * k / 10) - cam.x;
            ctx.lineTo(xx, yy + Math.sin(k * 1.3 + this.st * 0.8 + i) * 3);
          }
          ctx.stroke();
        }
      }
    }
  }
}

const BOSS_CLASSES = { shuwafa: Shuwafa, ghoula: Ghoula, afrit: Afrit, kandicha: Kandicha };
