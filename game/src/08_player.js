// ============================================================
// Player
// ============================================================
const SMALL_H = 20, BIG_H = 27;

class Player {
  constructor(L, x, y, ch, big) {
    this.L = L; this.ch = ch;
    this.w = 10; this.big = big || !!ch.alwaysBig; this.h = this.big ? BIG_H : SMALL_H;
    this.x = x + 3; this.y = y + TS - this.h;
    this.vx = 0; this.vy = 0; this.facing = 1;
    this.onGround = false; this.coyote = 0; this.jumpBuf = 0; this.jumpsLeft = 0;
    this.invuln = 0; this.khamsa = 0; this.dead = false; this.deadT = 0;
    this.atkT = 0; this.atkCd = 0; this.dashT = 0; this.dashCd = 0; this.atkBox = null; this.atkHit = new Set();
    this.anim = 0; this.combo = 0; this.won = false; this.gliding = false; this.growT = 0;
  }
  get cx() { return this.x + this.w / 2; }
  get bottom() { return this.y + this.h; }

  setBig(b) {
    if (b === this.big) return;
    if (b) { this.y -= BIG_H - SMALL_H; this.h = BIG_H; } else { this.y += BIG_H - SMALL_H; this.h = SMALL_H; }
    this.big = b; this.growT = 30;
  }

  hurt(knock = 0) {
    if (this.dead || this.invuln > 0 || this.khamsa > 0 || this.dashT > 0 || this.won) return;
    if (this.big) {
      this.setBig(false);
      this.invuln = 110;
      this.vy = -3.5; this.vx = knock;
      Audio.sfxPlay('hurt');
      this.L.popText(this.cx, this.y - 6, choice(['AYYY!', 'WILI!', 'AÏE!']), '#ff8080');
      this.L.shake = 6;
    } else this.die();
  }
  die() {
    if (this.dead) return;
    this.dead = true; this.deadT = 0; this.vy = -6.5; this.vx = 0;
    Audio.stop(); Audio.sfxPlay('die');
    this.L.popText(this.cx, this.y - 8, 'WILI WILI!', '#ff8080');
  }

  update() {
    const L = this.L;
    this.anim++;
    if (this.growT > 0) this.growT--;
    if (this.dead) {
      this.deadT++;
      if (this.deadT > 30) { this.vy = Math.min(this.vy + 0.35, 7); this.y += this.vy; }
      return;
    }
    if (this.won) { // walking into the gate
      this.vx = 0.8; this.facing = 1;
      this.vy = Math.min(this.vy + GRAV, MAXFALL);
      moveBody(this, L);
      return;
    }
    const ch = this.ch;
    if (this.invuln > 0) this.invuln--;
    if (this.khamsa > 0) {
      this.khamsa--;
      if (this.anim % 4 === 0) L.spark(this.x + Math.random() * this.w, this.y + Math.random() * this.h, choice(['#ffe060', '#60c0ff', '#ffffff']));
    }
    if (this.atkCd > 0) this.atkCd--;
    if (this.dashCd > 0) this.dashCd--;

    const left = Input.held('left'), right = Input.held('right');
    const jumpPressed = Input.pressed('jump') || Input.pressed('up');
    const jumpHeld = Input.held('jump') || Input.held('up');

    // ---- horizontal ----
    const maxS = ch.speed + (this.khamsa > 0 ? 0.3 : 0);
    if (this.dashT > 0) {
      this.dashT--;
      this.vx = this.facing * 5.2;
      if (this.anim % 2 === 0) L.dust(this.cx - this.facing * 6, this.bottom - 4, '#c8d8ff');
    } else {
      const acc = ch.accel * (this.onGround ? 1 : 0.75);
      if (left && !right) { this.vx = Math.max(this.vx - acc * (this.vx > 0 ? 2.2 : 1), -maxS); this.facing = -1; }
      else if (right && !left) { this.vx = Math.min(this.vx + acc * (this.vx < 0 ? 2.2 : 1), maxS); this.facing = 1; }
      else { this.vx *= this.onGround ? 0.78 : 0.95; if (Math.abs(this.vx) < 0.05) this.vx = 0; }
      if (this.atkT > 0 && this.onGround && (ch.attack === 'cane' || ch.attack === 'sword')) this.vx *= 0.85;
    }

    // ---- jumping ----
    if (jumpPressed) this.jumpBuf = 7;
    if (this.jumpBuf > 0) this.jumpBuf--;
    if (this.onGround) { this.coyote = 6; this.jumpsLeft = ch.doubleJump ? 1 : 0; this.combo = 0; }
    else if (this.coyote > 0) this.coyote--;
    if (this.jumpBuf > 0 && this.coyote > 0) {
      this.vy = -ch.jump - Math.abs(this.vx) * 0.12;
      this.coyote = 0; this.jumpBuf = 0; this.onGround = false; this.ride = null;
      Audio.sfxPlay('jump');
      L.dust(this.cx, this.bottom - 2);
    } else if (jumpPressed && !this.onGround && this.coyote <= 0 && this.jumpsLeft > 0) {
      this.jumpsLeft--; this.vy = -ch.jump * 0.88; this.jumpBuf = 0;
      Audio.sfxPlay('djump');
      for (let i = 0; i < 6; i++) L.spark(this.cx + rnd(-6, 6), this.bottom, '#a0d0ff');
    }

    // ---- gravity / glide ----
    const g = jumpHeld && this.vy < 0 ? GRAV_HOLD : GRAV;
    this.vy = Math.min(this.vy + g, MAXFALL);
    this.gliding = false;
    if (ch.glide && jumpHeld && this.vy > 0.9 && !this.onGround) {
      this.vy = 0.9; this.gliding = true;
      if (this.anim % 6 === 0) L.dust(this.cx, this.bottom, '#e8dcc0');
    }

    // ---- attack ----
    if (Input.pressed('attack') && this.atkCd <= 0) this.attack();
    this.atkBox = null;
    if (this.atkT > 0) {
      this.atkT--;
      const reach = (ch.attack === 'sword' ? 22 : 20) + SAVE.baraka * 4;
      const active = ch.attack === 'cane' ? this.atkT < 9 && this.atkT > 2 : this.atkT > 3;
      if ((ch.attack === 'cane' || ch.attack === 'sword') && active) {
        this.atkBox = { x: this.facing > 0 ? this.x + this.w - 2 : this.x - reach + 2, y: this.y - 4, w: reach, h: this.h + 2 };
      }
    }

    // ---- ride movers ----
    if (this.ride) { this.x += this.ride.dx; this.y += this.ride.dy; }
    const dropThrough = Input.held('down') && this.onGround && !this.ride;
    moveBody(this, L, { dropThrough });
    if (this.justLanded) { if (this.vyPrev > 3) L.dust(this.cx, this.bottom - 2); }
    this.vyPrev = this.vy;

    // ---- ceiling bumps ----
    if (this.ceil) L.hitBlock(this.ceil.tx, this.ceil.ty, this);

    // ---- hazards ----
    const ctx_ = Math.floor(this.cx / TS);
    const fy = Math.floor((this.bottom - 3) / TS);
    if (tileAt(L, ctx_, fy) === T.LIQUID) { L.splash(this.cx, fy * TS); this.die(); return; }
    for (const tx of [Math.floor((this.x + 2) / TS), Math.floor((this.x + this.w - 2) / TS)]) {
      const ty = Math.floor((this.bottom - 2) / TS);
      if (tileAt(L, tx, ty) === T.SPIKE && this.bottom - ty * TS > 6) { this.hurt(-this.facing * 2); if (!this.dead) this.vy = -5; break; }
    }
    if (this.y > L.h * TS + 20) { this.die(); this.deadT = 40; }
  }

  attack() {
    const ch = this.ch, L = this.L;
    if (ch.attack === 'babouche' || ch.attack === 'orange') {
      const mine = L.projs.filter((p) => p.owner === 'player').length;
      if (mine >= 2 + SAVE.baraka) return;
      this.atkT = 10; this.atkCd = 12;
      if (ch.attack === 'babouche') L.addProj(new Proj(this.cx + this.facing * 6, this.y + 6, this.facing * 4 + this.vx * 0.4, -2.6, 'babouche', 'player'));
      else L.addProj(new Proj(this.cx + this.facing * 6, this.y + 7, this.facing * 5.6 + this.vx * 0.3, 0, 'orange', 'player'));
      Audio.sfxPlay('throw');
    } else if (ch.attack === 'cane') {
      this.atkT = 14; this.atkCd = 20; this.atkHit = new Set();
      Audio.sfxPlay('swing');
    } else if (ch.attack === 'sword') {
      this.atkT = 12; this.atkCd = 18; this.atkHit = new Set();
      if (ch.dash && this.dashCd <= 0 && Math.abs(this.vx) > 1.2) {
        this.dashT = 13; this.dashCd = 50; this.atkT = 13;
        Audio.sfxPlay('dash');
      } else Audio.sfxPlay('slash');
    }
  }

  frameName() {
    if (this.dead) return 'hurt';
    if (this.won && this.onGround && this.anim % 40 < 20 && this.vx === 0) return 'win';
    if (this.invuln > 90) return 'hurt';
    if (this.dashT > 0) return 'dash';
    if (this.atkT > 0) {
      if (this.ch.attack === 'cane') return this.atkT > 9 ? 'attack2' : 'attack';
      return 'attack';
    }
    if (!this.onGround) {
      if (this.gliding) return 'glide';
      return this.vy < 0 ? 'jump' : 'fall';
    }
    if (Math.abs(this.vx) > 0.25) {
      const sp = Math.max(4, 11 - Math.abs(this.vx) * 3);
      return 'run' + (Math.floor(this.anim / sp) % 4);
    }
    return Math.floor(this.anim / 30) % 2 ? 'idle1' : 'idle0';
  }

  draw(cam) {
    if (this.invuln > 0 && !this.dead && Math.floor(this.invuln / 3) % 2) return;
    const set = CHAR_SPR[this.ch.id];
    // grow animation alternates sizes
    let size = this.big ? 'big' : 'small';
    if (this.growT > 0 && Math.floor(this.growT / 4) % 2) size = this.big ? 'small' : 'big';
    const c = set[size][this.frameName()];
    const x = this.cx - cam.x, y = this.bottom + 1 - cam.y;
    const flip = this.facing < 0;
    if (this.khamsa > 0 && Math.floor(this.anim / 3) % 2) {
      drawSpr(c, x, y, flip);
      drawSpr(tintOf(c, ['#ffe060', '#60c0ff', '#ffffff'][Math.floor(this.anim / 6) % 3]), x, y, flip, 0.55);
    } else drawSpr(c, x, y, flip);
    // melee slash effect
    if (this.atkBox && (this.ch.attack === 'sword' || this.ch.attack === 'cane')) {
      const b = this.atkBox;
      ctx.strokeStyle = this.ch.attack === 'sword' ? 'rgba(220,235,255,0.85)' : 'rgba(255,230,180,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const cx = this.cx - cam.x, cy = this.y + this.h / 2 - cam.y;
      const r = b.w * 0.9, a0 = this.facing > 0 ? -1.1 : Math.PI - 1.1 + 2.2;
      const a1 = this.facing > 0 ? 1.1 : Math.PI + 1.1 - 2.2;
      ctx.arc(cx, cy, r, Math.min(a0, a1), Math.max(a0, a1));
      ctx.stroke();
    }
  }
}
