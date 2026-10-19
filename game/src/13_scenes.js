// ============================================================
// Scenes: boot, title, intro, select, map, shop, play, pause, results, game over, ending
// ============================================================
const RUN = { coins: 0, score: 0, big: false };

// --------------------------------------------------------------- BOOT
const BootScene = {
  enter() { this.t = 0; },
  update() {
    this.t++;
    if (this.t > 20 && Input.anyPressed()) { Audio.unlock(); Game.set(TitleScene); }
  },
  draw() {
    ctx.fillStyle = '#120a14'; ctx.fillRect(0, 0, W, H);
    drawLogo(W / 2, 80, this.t);
    if (Math.floor(this.t / 30) % 2) drawText(Input.usedTouch ? 'TOUCHE L\'ECRAN' : 'APPUIE SUR ESPACE OU TOUCHE L\'ECRAN', W / 2, 170, '#ffffff', 1, '#1a0f14', 'center');
    if (!Input.usedTouch && !window.ReactNativeWebView) {
      drawText('FLECHES: BOUGER  ESPACE: SAUTER  X: ATTAQUER', W / 2, 204, '#c8b8a8', 1, '#1a0f14', 'center');
      drawText('ENTREE: PAUSE  F: PLEIN ECRAN', W / 2, 216, '#c8b8a8', 1, '#1a0f14', 'center');
    }
    drawText('UN JEU DU BLED', W / 2, 250, '#8a7a8a', 1, '#1a0f14', 'center');
  },
};

// --------------------------------------------------------------- TITLE
const TitleScene = {
  enter() {
    this.t = 0;
    if (!BG_CACHE.fes) BG_CACHE.fes = buildBackground('fes');
    Audio.play('title');
    this.menu = new Menu([
      { label: () => (SAVE.unlocked > 0 ? 'CONTINUER' : 'JOUER'), action: () => {
        if (!SAVE.seenIntro) Game.set(IntroScene); else Game.set(MapScene);
      } },
      { label: 'CHOISIR SON HEROS', action: () => { SelectScene.next = TitleScene; Game.set(SelectScene); } },
      { label: () => 'SON: ' + (SAVE.sound ? 'OUI' : 'NON'), action: () => Audio.setSound(!SAVE.sound) },
      { label: 'NOUVELLE PARTIE', action: () => { this.confirm = true; } },
    ], W / 2, 118, { w: 180 });
    this.confirm = false;
    this.confirmMenu = new Menu([
      { label: 'OUI, TOUT EFFACER', action: () => { const snd = SAVE.sound; SAVE = defaultSave(); SAVE.sound = snd; writeSave(); RUN.score = 0; RUN.coins = 0; RUN.big = false; this.confirm = false; } },
      { label: 'NON', action: () => { this.confirm = false; } },
    ], W / 2, 140, { w: 180 });
    this.confirmMenu.sel = 1;
  },
  update() {
    this.t++;
    if (this.confirm) { this.confirmMenu.update(); if (Input.pressed('pause')) this.confirm = false; return; }
    this.menu.update();
  },
  draw() {
    const bg = BG_CACHE.fes;
    ctx.drawImage(bg.sky, 0, 0);
    for (const l of bg.layers) { const off = Math.floor(this.t * 0.6 * l.f * 2) % BGW; for (let x = -off; x < W; x += BGW) ctx.drawImage(l.c, x, 0); }
    // ground strip
    for (let x = -(Math.floor(this.t * 1.2) % 16); x < W; x += 16) { ctx.drawImage(groundTile('fes', true, false, false, (x / 16) & 3), x, 238); ctx.drawImage(groundTile('fes', false, false, false, 1), x, 254); }
    // heroes running, chased by a ghoul
    CHARS.forEach((ch, i) => drawSpr(CHAR_SPR[ch.id].big['run' + (Math.floor(this.t / 6 + i) % 4)], 330 - i * 34, 239));
    drawSpr(SPR.ghoul[Math.floor(this.t / 10) % 2], 160 + Math.sin(this.t * 0.05) * 6, 239, true);
    drawSpr(SPR.witch[Math.floor(this.t / 10) % 2], 120 + Math.sin(this.t * 0.03) * 20, 120 + Math.sin(this.t * 0.07) * 6, true);
    ctx.fillStyle = 'rgba(16,8,20,0.35)'; ctx.fillRect(0, 0, W, H);
    drawLogo(W / 2, 34, this.t);
    drawText('LES CHASSEURS DE GHWAL', W / 2, 82, '#ffffff', 1, '#1a0f14', 'center');
    panel(W / 2 - 104, 106, 208, 74);
    if (this.confirm) {
      drawText('EFFACER LA SAUVEGARDE ?', W / 2, 118, '#ff9090', 1, '#1a0f14', 'center');
      this.confirmMenu.draw();
    } else this.menu.draw();
    drawText('V1.0', W - 4, H - 10, '#8a7a8a', 1, '#1a0f14', 'right');
  },
  onBack() {
    if (this.confirm) { this.confirm = false; return; }
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'exit' }));
  },
};

// --------------------------------------------------------------- INTRO STORY
const STORY = [
  'DANS LE BLED, TOUT LE MONDE CONNAIT LES HISTOIRES DE GRAND-MERE...',
  'LES GHWAL, LES SORCIERES, LES DJINNS... "C\'EST JUSTE DES CONTES", DISAIENT LES GENS.',
  'MAIS UNE NUIT, LA LUNE EST DEVENUE ROUGE. LES MONSTRES SONT SORTIS DES CONTES.',
  'LA SHUWAFA A ENSORCELE FES. LA GHOULA ROUGE LA FORET. BOU NAR BRULE LE DESERT.',
  'ET AU FOND DE L\'OUED, AICHA KANDICHA ATTEND...',
  'IL FAUT DES HEROS. DES VRAIS. DES ENFANTS DU BLED.',
  'YALLAH, BLED BROS!',
];
const IntroScene = {
  enter() { this.i = 0; this.chars = 0; this.t = 0; Audio.play('night'); },
  update() {
    this.t++;
    const full = STORY[this.i].length;
    if (this.chars < full) { this.chars += 0.8; if (Input.anyPressed()) this.chars = full; }
    else if (Input.anyPressed()) {
      this.i++; this.chars = 0; Audio.sfxPlay('select');
      if (this.i >= STORY.length) { SAVE.seenIntro = true; writeSave(); SelectScene.next = MapScene; Game.set(SelectScene); }
    }
    if (Input.pressed('pause')) { SAVE.seenIntro = true; writeSave(); SelectScene.next = MapScene; Game.set(SelectScene); }
  },
  draw() {
    const bg = BG_CACHE.oued || (BG_CACHE.oued = buildBackground('oued'));
    ctx.drawImage(bg.sky, 0, 0);
    for (const l of bg.layers) ctx.drawImage(l.c, -Math.floor(this.t * l.f * 0.3) % BGW, 0);
    // red moon tint once the monsters arrive
    if (this.i >= 2) { ctx.fillStyle = 'rgba(200,30,30,0.22)'; ctx.beginPath(); ctx.arc(380, 52, 22, 0, Math.PI * 2); ctx.fill(); }
    const lines = wrapText(STORY[this.i] || '', 400);
    let shown = Math.floor(this.chars);
    panel(30, 170, W - 60, 70);
    lines.forEach((ln, k) => { if (shown > 0) drawText(ln.slice(0, shown), W / 2, 186 + k * 14, '#ffffff', 1, '#1a0f14', 'center'); shown -= ln.length + 1; });
    if (this.i >= 3) {
      const show = [SPR.shuwafa.float0, SPR.ghoula.walk0, SPR.afrit.float0, SPR.kandicha.idle0];
      show.forEach((c, k) => { if (k <= this.i - 3) drawSpr(c, 100 + k * 92, 158, false, 0.9); });
    }
    drawText('II = PASSER', W - 6, 6, '#8a7a8a', 1, '#1a0f14', 'right');
  },
};

// --------------------------------------------------------------- CHARACTER SELECT
const SelectScene = {
  next: null,
  enter() { this.sel = SAVE.char; this.t = 0; Audio.play('title'); },
  cardRect(i) { return { x: 12 + i * 116, y: 40, w: 108, h: 176 }; },
  choose() {
    SAVE.char = this.sel; writeSave(); Audio.sfxPlay('confirm');
    Audio.sfxPlay('power');
    Game.set(this.next || MapScene);
  },
  update() {
    this.t++;
    if (Input.pressed('left')) { this.sel = (this.sel + 3) % 4; Audio.sfxPlay('select'); }
    if (Input.pressed('right')) { this.sel = (this.sel + 1) % 4; Audio.sfxPlay('select'); }
    if (Input.tap) {
      for (let i = 0; i < 4; i++) if (tapIn(this.cardRect(i))) { if (this.sel === i) { this.choose(); return; } this.sel = i; Audio.sfxPlay('select'); }
      if (tapIn({ x: 160, y: 228, w: 160, h: 22 })) { this.choose(); return; }
    }
    if (Input.pressed('jump') || Input.pressed('attack')) this.choose();
    if (Input.pressed('pause')) Game.set(this.next || TitleScene);
  },
  draw() {
    ctx.fillStyle = '#1a0f22'; ctx.fillRect(0, 0, W, H);
    // zellige pattern background
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) if ((x / 16 + y / 16) % 2 === 0) { ctx.fillStyle = '#22142c'; ctx.fillRect(x, y, 16, 16); }
    drawText('CHOISIS TON HEROS', W / 2, 14, '#ffe060', 2, '#1a0f14', 'center');
    CHARS.forEach((ch, i) => {
      const r = this.cardRect(i), on = i === this.sel;
      panel(r.x, r.y, r.w, r.h, on ? 'rgba(60,30,40,0.95)' : 'rgba(22,12,30,0.88)', on ? '#ffe080' : '#7a6040');
      const fr = on ? 'run' + (Math.floor(this.t / 6) % 4) : (Math.floor(this.t / 30) % 2 ? 'idle1' : 'idle0');
      const c = CHAR_SPR[ch.id].big[fr];
      ctx.drawImage(c, Math.round(r.x + r.w / 2 - c.width), r.y + 6, c.width * 2, c.height * 2);
      drawText(ch.name, r.x + r.w / 2, r.y + 88, on ? '#ffe060' : '#ffffff', 1, '#1a0f14', 'center');
      drawText(ch.title, r.x + r.w / 2, r.y + 100, '#c8b8a8', 1, '#1a0f14', 'center');
      ['VITESSE', 'SAUT', 'FORCE'].forEach((s, k) => {
        drawText(s, r.x + 8, r.y + 116 + k * 11, '#a89888');
        for (let b = 0; b < 5; b++) { ctx.fillStyle = b < ch.stats[k] ? '#f2c230' : '#3a2a3a'; ctx.fillRect(r.x + 64 + b * 7, r.y + 116 + k * 11, 5, 7); }
      });
      ch.desc.forEach((d, k) => drawText(d, r.x + r.w / 2, r.y + 150 + k * 9, '#90d0ff', 1, '#1a0f14', 'center'));
    });
    drawButton({ x: 160, y: 228, w: 160, h: 22 }, '" ' + CHARS[this.sel].quote + ' "', true);
  },
  onBack() { Game.set(this.next || TitleScene); },
};

// --------------------------------------------------------------- WORLD MAP
const NODE_POS = [
  [262, 92], [284, 100], [306, 92],       // Fes
  [278, 62], [258, 50], [238, 58],       // Chefchaouen
  [372, 160], [392, 174], [414, 186],    // Merzouga
  [304, 150], [232, 166], [206, 180],    // Atlas + Marrakech
];
const MapScene = {
  enter() {
    this.t = 0;
    this.sel = clamp(this.sel == null ? SAVE.unlocked : this.sel, 0, Math.min(SAVE.unlocked, LEVELS.length - 1));
    this.pos = NODE_POS[this.sel].slice(); this.moving = 0;
    Audio.play('map');
    if (!this.mapC) this.mapC = buildMapCanvas();
  },
  buttons() {
    return {
      play: { x: 376, y: 236, w: 96, h: 26 },
      shop: { x: 8, y: 236, w: 84, h: 26 },
      hero: { x: 98, y: 236, w: 84, h: 26 },
      menu: { x: 8, y: 6, w: 60, h: 18 },
    };
  },
  go(i) {
    if (i < 0 || i > SAVE.unlocked || i >= LEVELS.length || i === this.sel) return;
    this.sel = i; this.moving = 1; Audio.sfxPlay('select');
  },
  play() { Audio.sfxPlay('confirm'); Game.startLevel(this.sel, null, true); },
  update() {
    this.t++;
    const target = NODE_POS[this.sel];
    this.pos[0] += (target[0] - this.pos[0]) * 0.15; this.pos[1] += (target[1] - this.pos[1]) * 0.15;
    if (Math.hypot(target[0] - this.pos[0], target[1] - this.pos[1]) < 0.5) this.moving = 0;
    if (Input.pressed('right') || Input.pressed('down')) this.go(this.sel + 1);
    if (Input.pressed('left') || Input.pressed('up')) this.go(this.sel - 1);
    const B = this.buttons();
    if (Input.tap) {
      if (tapIn(B.play)) return this.play();
      if (tapIn(B.shop)) { Audio.sfxPlay('confirm'); return Game.set(ShopScene); }
      if (tapIn(B.hero)) { SelectScene.next = MapScene; return Game.set(SelectScene); }
      if (tapIn(B.menu)) return Game.set(TitleScene);
      for (let i = 0; i <= Math.min(SAVE.unlocked, LEVELS.length - 1); i++) {
        const [nx, ny] = NODE_POS[i];
        if (Math.abs(Input.tap.x - nx) < 12 && Math.abs(Input.tap.y - ny) < 12) { if (i === this.sel) return this.play(); this.go(i); }
      }
    }
    if (Input.pressed('jump')) this.play();
    else if (Input.pressed('attack')) { Audio.sfxPlay('confirm'); Game.set(ShopScene); }
    else if (Input.pressed('pause')) Game.set(TitleScene);
  },
  draw() {
    ctx.drawImage(this.mapC, 0, 0);
    // paths
    for (let i = 0; i < LEVELS.length - 1; i++) {
      const [ax, ay] = NODE_POS[i], [bx, by] = NODE_POS[i + 1];
      const open = i + 1 <= SAVE.unlocked;
      const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 5);
      for (let k = 1; k < n; k++) {
        const x = ax + ((bx - ax) * k) / n, y = ay + ((by - ay) * k) / n;
        ctx.fillStyle = open ? '#7a3a1a' : 'rgba(90,70,60,0.45)';
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
      }
    }
    // nodes
    LEVELS.forEach((lv, i) => {
      const [x, y] = NODE_POS[i];
      const locked = i > SAVE.unlocked, done = SAVE.cleared[i];
      const boss = !!lv.boss;
      const r = boss ? 6 : 4;
      ctx.fillStyle = '#2a1418'; ctx.fillRect(x - r - 1, y - r - 1, r * 2 + 2, r * 2 + 2);
      ctx.fillStyle = locked ? '#7a7070' : done ? '#f2c230' : boss ? '#9a3ac8' : '#d8302a';
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x - r, y - r, r * 2, 1);
      if (boss && !locked) drawText(done ? '*' : '!', x, y - 3, '#ffffff', 1, null, 'center');
    });
    // city labels
    drawText('FES', 284, 108, '#3a1a10', 1, null, 'center');
    drawText('CHAOUEN', 252, 36, '#1a2a6a', 1, null, 'center');
    drawText('MERZOUGA', 400, 198, '#6a3010', 1, null, 'center');
    drawText('ATLAS', 304, 132, '#5a2010', 1, null, 'center');
    drawText('MARRAKECH', 214, 190, '#6a1a10', 1, null, 'center');
    // player marker
    const ch = CHARS[SAVE.char];
    const fr = this.moving ? 'run' + (Math.floor(this.t / 5) % 4) : (Math.floor(this.t / 30) % 2 ? 'idle1' : 'idle0');
    const flip = NODE_POS[this.sel][0] < this.pos[0] - 1;
    drawSpr(CHAR_SPR[ch.id].small[fr], this.pos[0], this.pos[1] - 2 + (this.moving ? 0 : Math.sin(this.t * 0.1)), flip);
    // info panel
    const lv = LEVELS[this.sel], wd = WORLDS[lv.world];
    panel(300, 6, 172, 52);
    drawText('MONDE ' + lv.id, 308, 13, wd.color);
    drawText(lv.name, 308, 26, '#ffffff');
    drawText(SAVE.cleared[this.sel] ? 'TERMINE *' : lv.boss ? 'BOSS!' : wd.sub, 308, 39, SAVE.cleared[this.sel] ? '#f2c230' : lv.boss ? '#ff9090' : '#c8b8a8');
    if (SAVE.best[this.sel]) drawText('RECORD ' + SAVE.best[this.sel], 464, 39, '#c8b8a8', 1, '#1a0f14', 'right');
    // wallet + lives
    panel(76, 6, 128, 20);
    ctx.drawImage(SPR.coinIcon, 82, 9);
    drawText(String(SAVE.wallet) + ' DH', 98, 12, '#ffe060');
    drawSpr(SPR.heart, 152, 21);
    drawText('X' + SAVE.lives, 160, 12, '#ffffff');
    const B = this.buttons();
    drawButton(B.play, 'JOUER (A)', true);
    drawButton(B.shop, 'HANOUT (B)', false);
    drawButton(B.hero, 'HEROS', false);
    drawButton(B.menu, 'MENU', false);
  },
  onBack() { Game.set(TitleScene); },
};

function buildMapCanvas() {
  const c = makeCanvas(W, H), g = c.getContext('2d');
  ditherGradient(g, 0, 0, W, H, ['#1e4a8a', '#2a64a8', '#3a7ab8']);
  // waves
  for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(Math.floor(Math.random() * W), Math.floor(Math.random() * H), 4, 1); }
  // Morocco (stylized)
  const land = [[246, 22], [262, 20], [300, 30], [340, 30], [380, 36], [398, 50], [402, 90], [420, 120], [450, 140], [462, 200], [440, 214], [380, 222], [340, 236], [300, 270], [70, 270], [110, 226], [128, 200], [132, 170], [160, 140], [182, 110], [204, 82], [226, 52]];
  g.fillStyle = '#5a3a20';
  g.beginPath(); land.forEach(([x, y], i) => (i ? g.lineTo(x + 2, y + 2) : g.moveTo(x + 2, y + 2))); g.closePath(); g.fill();
  const lg = makeCanvas(W, H), l2 = lg.getContext('2d');
  ditherGradient(l2, 0, 0, W, H, ['#d8c890', '#e8c890', '#f0c880', '#f0b870']);
  l2.globalCompositeOperation = 'destination-in';
  l2.beginPath(); land.forEach(([x, y], i) => (i ? l2.lineTo(x, y) : l2.moveTo(x, y))); l2.closePath(); l2.fill();
  g.drawImage(lg, 0, 0);
  // Rif (green hills near Chaouen)
  for (let i = 0; i < 9; i++) { const x = 236 + i * 12, y = 44 + Math.sin(i) * 4; g.fillStyle = '#5a9a4a'; g.beginPath(); g.moveTo(x - 7, y + 6); g.lineTo(x, y - 4); g.lineTo(x + 7, y + 6); g.fill(); }
  // Atlas chain
  for (let i = 0; i < 16; i++) {
    const x = 160 + i * 14, y = 168 - i * 4.5 + Math.sin(i * 1.7) * 4;
    g.fillStyle = '#8a5a3a'; g.beginPath(); g.moveTo(x - 9, y + 8); g.lineTo(x, y - 7); g.lineTo(x + 9, y + 8); g.fill();
    g.fillStyle = '#f4f8ff'; g.beginPath(); g.moveTo(x - 3, y - 2); g.lineTo(x, y - 7); g.lineTo(x + 3, y - 2); g.fill();
  }
  // Sahara dunes
  for (let i = 0; i < 40; i++) { const x = 330 + Math.random() * 120, y = 170 + Math.random() * 50; g.fillStyle = '#e8a050'; g.fillRect(Math.round(x), Math.round(y), 6, 1); g.fillStyle = '#f8d8a0'; g.fillRect(Math.round(x) + 1, Math.round(y) - 1, 3, 1); }
  // compass + title
  g.fillStyle = 'rgba(255,240,200,0.8)';
  drawTextTo(g, 'AL MAGHRIB', 40, 120, '#f0e0b0');
  drawTextTo(g, 'OCEAN ATLANTIQUE', 30, 200, '#a0c8f0');
  drawTextTo(g, 'MEDITERRANEE', 96, 34, '#a0c8f0');
  return c;
}
function drawTextTo(g, str, x, y, color) {
  const c = renderTextCanvas(str, color, '#1a0f14');
  g.drawImage(c, x, y - 2);
}

// --------------------------------------------------------------- SHOP (HANOUT)
const SHOPKEEPER = { id: 'moha', skin: '#b07a50', robe: '#e8e4d8', shoe: '#c8302a', fez: '#2a7a4a', beard: '#4a3428' };
const SHOP_ITEMS = [
  { name: 'ATAY', desc: '+1 VIE', price: 30, spr: () => SPR.tea, can: () => SAVE.lives < 99, buy: () => { SAVE.lives++; } },
  { name: 'MSEMEN', desc: 'COMMENCE LE NIVEAU EN GRAND', price: 20, spr: () => SPR.msemen, can: () => SAVE.inv.msemen < 5, buy: () => { SAVE.inv.msemen++; }, stock: () => SAVE.inv.msemen },
  { name: 'KHAMSA', desc: 'INVINCIBLE AU DEBUT DU NIVEAU', price: 45, spr: () => SPR.khamsa, can: () => SAVE.inv.khamsa < 5, buy: () => { SAVE.inv.khamsa++; }, stock: () => SAVE.inv.khamsa },
  { name: 'BARAKA', desc: 'ATTAQUE PLUS FORTE (MAX 2)', price: 120, spr: () => SPR.star[0], can: () => SAVE.baraka < 2, buy: () => { SAVE.baraka++; }, stock: () => SAVE.baraka },
];
const ShopScene = {
  enter() {
    this.t = 0; this.sel = 0; this.say = 'MRHBA BIK A WLIDI! CHNO BGHITI?';
    if (!this.keeper) this.keeper = genChar(SHOPKEEPER, POSES.idle0, true);
    Audio.play('shop');
  },
  rowRect(i) { return { x: 150, y: 70 + i * 34, w: 316, h: 30 }; },
  buy() {
    if (this.sel === SHOP_ITEMS.length) { Game.set(MapScene); return; }
    const it = SHOP_ITEMS[this.sel];
    if (!it.can()) { this.say = 'SAFI, 3NDEK BZZAF DYAL HADI!'; Audio.sfxPlay('nope'); return; }
    if (SAVE.wallet < it.price) { this.say = 'MA 3NDEKCH FLOUS, A WLIDI! JM3 DRAHEM!'; Audio.sfxPlay('nope'); return; }
    SAVE.wallet -= it.price; it.buy(); writeSave();
    this.say = choice(['BSSAHA O RAHA!', 'LLAH Y3AWNEK!', 'MZYAN! HADI HYA!']);
    Audio.sfxPlay('buy');
  },
  update() {
    this.t++;
    const n = SHOP_ITEMS.length + 1;
    if (Input.pressed('down')) { this.sel = (this.sel + 1) % n; Audio.sfxPlay('select'); }
    if (Input.pressed('up')) { this.sel = (this.sel + n - 1) % n; Audio.sfxPlay('select'); }
    if (Input.tap) for (let i = 0; i < n; i++) if (tapIn(this.rowRect(i))) { if (this.sel === i) this.buy(); else { this.sel = i; Audio.sfxPlay('select'); } return; }
    if (Input.pressed('jump')) this.buy();
    if (Input.pressed('attack') || Input.pressed('pause')) Game.set(MapScene);
  },
  draw() {
    // interior of the hanout
    ctx.fillStyle = '#3a2418'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < 60; y += 8) for (let x = 0; x < W; x += 16) { ctx.fillStyle = (x / 16 + y / 8) % 2 ? '#4a3020' : '#42291c'; ctx.fillRect(x, y, 16, 8); }
    // shelves with jars and spices
    for (let s = 0; s < 3; s++) {
      ctx.fillStyle = '#6a4228'; ctx.fillRect(0, 80 + s * 50, 140, 4);
      for (let k = 0; k < 6; k++) {
        const cc = ['#d8302a', '#f0c030', '#3a9a4a', '#d87a20', '#8a4a2a', '#e8e0c8'][(k + s * 2) % 6];
        ctx.fillStyle = cc; ctx.fillRect(8 + k * 22, 68 + s * 50, 14, 12); ctx.fillStyle = shade(cc, 0.3); ctx.fillRect(9 + k * 22, 69 + s * 50, 3, 10);
      }
    }
    // counter + shopkeeper
    ctx.drawImage(this.keeper, 40, 156 + (Math.floor(this.t / 30) % 2) * 2, this.keeper.width * 2, this.keeper.height * 2);
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(0, 228, 140, 42); ctx.fillStyle = '#9a6a3a'; ctx.fillRect(0, 228, 140, 3);
    drawText('HANOUT DYAL BA BRAHIM', W / 2 + 70, 10, '#ffe060', 1, '#1a0f14', 'center');
    panel(150, 22, 316, 40);
    drawText(this.say, 158, 30, '#ffffff');
    ctx.drawImage(SPR.coinIcon, 158, 44);
    drawText('TU AS ' + SAVE.wallet + ' DH', 174, 47, '#ffe060');
    SHOP_ITEMS.concat([{ name: 'SORTIR', desc: 'RETOUR A LA CARTE' }]).forEach((it, i) => {
      const r = this.rowRect(i), on = i === this.sel;
      panel(r.x, r.y, r.w, r.h, on ? 'rgba(70,40,30,0.95)' : 'rgba(22,12,30,0.85)', on ? '#ffe080' : '#7a6040');
      if (it.spr) drawSpr(it.spr(), r.x + 16, r.y + 24);
      drawText(it.name, r.x + 32, r.y + 7, on ? '#ffe060' : '#ffffff');
      drawText(it.desc, r.x + 32, r.y + 18, '#c8b8a8');
      if (it.price) {
        drawText(it.price + ' DH', r.x + r.w - 8, r.y + 7, SAVE.wallet >= it.price ? '#ffe060' : '#a07070', 1, '#1a0f14', 'right');
        if (it.stock) drawText('X' + it.stock(), r.x + r.w - 8, r.y + 18, '#90d0ff', 1, '#1a0f14', 'right');
      }
    });
  },
  onBack() { Game.set(MapScene); },
};

// --------------------------------------------------------------- LIVES CARD (before a level)
const LivesScene = {
  enter() { this.t = 0; Audio.stop(); },
  update() {
    this.t++;
    if (this.t > 110 || (this.t > 25 && Input.anyPressed())) {
      Game.level = new Level(this.index, this.cp);
      Game.set(PlayScene);
    }
  },
  draw() {
    ctx.fillStyle = '#0c0610'; ctx.fillRect(0, 0, W, H);
    const lv = LEVELS[this.index], wd = WORLDS[lv.world];
    drawText('MONDE ' + lv.id, W / 2, 84, wd.color, 2, '#1a0f14', 'center');
    drawText(lv.name, W / 2, 110, '#ffffff', 1, '#1a0f14', 'center');
    const ch = CHARS[SAVE.char];
    drawSpr(CHAR_SPR[ch.id][RUN.big || ch.alwaysBig ? 'big' : 'small'].idle0, W / 2 - 24, 168);
    drawText('X ' + SAVE.lives, W / 2 - 4, 152, '#ffffff', 2, '#1a0f14', 'left');
    if (SAVE.inv.msemen || SAVE.inv.khamsa) drawText('SAC: MSEMEN X' + SAVE.inv.msemen + '  KHAMSA X' + SAVE.inv.khamsa, W / 2, 200, '#c8b8a8', 1, '#1a0f14', 'center');
  },
};

// --------------------------------------------------------------- PLAY + PAUSE
const PlayScene = {
  enter() { this.paused = false; },
  update() {
    if (this.paused) { this.pmenu.update(); if (Input.pressed('pause')) this.resume(); return; }
    if (Input.pressed('pause')) return this.pause();
    Game.level.update();
  },
  pause() {
    if (this.paused || !Game.level) return;
    this.paused = true; Audio.sfxPlay('pause');
    if (Audio.music) Audio.music.gain.value = 0.15;
    this.pmenu = new Menu([
      { label: 'REPRENDRE', action: () => this.resume() },
      { label: 'RECOMMENCER', action: () => { this.resume(); Game.startLevel(Game.level.index, null, false); } },
      { label: 'RETOUR A LA CARTE', action: () => { this.resume(); Game.set(MapScene); } },
      { label: () => 'SON: ' + (SAVE.sound ? 'OUI' : 'NON'), action: () => Audio.setSound(!SAVE.sound) },
    ], W / 2, 112, { w: 200 });
  },
  resume() { this.paused = false; if (Audio.music) Audio.music.gain.value = 0.55; },
  draw() {
    Game.level.draw();
    if (this.paused) {
      ctx.fillStyle = 'rgba(10,4,16,0.6)'; ctx.fillRect(0, 0, W, H);
      panel(W / 2 - 110, 80, 220, 100);
      drawText('PAUSE', W / 2, 90, '#ffe060', 1, '#1a0f14', 'center');
      this.pmenu.draw();
    }
  },
  onBack() { if (this.paused) this.resume(); else this.pause(); },
};

// --------------------------------------------------------------- RESULTS
const ResultsScene = {
  enter() { this.t = 0; Audio.play('map'); },
  update() {
    this.t++;
    if (this.t > 40 && Input.anyPressed()) Game.set(this.worldClear !== null && this.worldClear >= 0 ? WorldClearScene : MapScene);
  },
  draw() {
    ctx.fillStyle = '#140a1a'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) if ((x / 16 + y / 16) % 2 === 0) { ctx.fillStyle = '#1c1024'; ctx.fillRect(x, y, 16, 16); }
    const lv = LEVELS[this.index];
    drawText('NIVEAU TERMINE!', W / 2, 40, '#ffe060', 2, '#1a0f14', 'center');
    drawText(lv.id + ' ' + lv.name, W / 2, 70, '#ffffff', 1, '#1a0f14', 'center');
    panel(120, 92, 240, 96);
    drawText('SCORE DU NIVEAU', 140, 100, '#c8b8a8'); drawText(String(this.levelScore || 0), 340, 100, '#ffffff', 1, '#1a0f14', 'right');
    drawText('SCORE TOTAL', 140, 112, '#c8b8a8'); drawText(String(RUN.score), 340, 112, '#ffffff', 1, '#1a0f14', 'right');
    drawText('PORTE-MONNAIE', 140, 124, '#c8b8a8'); drawText(SAVE.wallet + ' DH', 340, 124, '#ffe060', 1, '#1a0f14', 'right');
    drawText('VIES', 140, 142, '#c8b8a8'); drawText(String(SAVE.lives), 340, 142, '#ffffff', 1, '#1a0f14', 'right');
    if (this.newRecord) drawText('NOUVEAU RECORD!', W / 2, 164, '#80ff80', 1, '#1a0f14', 'center');
    const ch = CHARS[SAVE.char];
    drawSpr(CHAR_SPR[ch.id].big[Math.floor(this.t / 20) % 2 ? 'win' : 'idle0'], W / 2, 236);
    if (this.t > 40 && Math.floor(this.t / 25) % 2) drawText('CONTINUER >', W / 2, 248, '#ffffff', 1, '#1a0f14', 'center');
  },
};

const WORLD_CLEAR_TEXT = [
  'FES EST LIBEREE! LES SOUKS ROUVRENT, ET LE THE EST DE NOUVEAU CHAUD.',
  'LA GHOULA S\'EST ENFUIE DANS LES MONTAGNES. CHAOUEN RETROUVE SON BLEU.',
  'BOU NAR S\'EST ETEINT. LE DESERT RESPIRE ENFIN SOUS LES ETOILES.',
];
const WorldClearScene = {
  enter() { this.t = 0; },
  update() { this.t++; if (this.t > 50 && Input.anyPressed()) Game.set(MapScene); },
  draw() {
    const th = ['fes', 'chaouen', 'desertnight'][this.world] || 'fes';
    const bg = BG_CACHE[th] || (BG_CACHE[th] = buildBackground(th));
    ctx.drawImage(bg.sky, 0, 0);
    for (const l of bg.layers) ctx.drawImage(l.c, -Math.floor(this.t * l.f) % BGW, 0);
    ctx.fillStyle = 'rgba(10,4,16,0.45)'; ctx.fillRect(0, 0, W, H);
    drawText('MONDE ' + (this.world + 1) + ' LIBERE!', W / 2, 50, '#ffe060', 2, '#1a0f14', 'center');
    panel(40, 90, W - 80, 50);
    wrapText(WORLD_CLEAR_TEXT[this.world] || '', W - 110).forEach((l, k) => drawText(l, W / 2, 102 + k * 12, '#ffffff', 1, '#1a0f14', 'center'));
    CHARS.forEach((ch, i) => drawSpr(CHAR_SPR[ch.id].big[Math.floor(this.t / 15 + i) % 2 ? 'win' : 'idle0'], 150 + i * 60, 230 - (Math.floor(this.t / 15 + i) % 2) * 4));
    if (this.world + 1 < WORLDS.length) drawText('PROCHAIN: ' + WORLDS[this.world + 1].name, W / 2, 156, WORLDS[this.world + 1].color, 1, '#1a0f14', 'center');
  },
};

// --------------------------------------------------------------- GAME OVER
const GameOverScene = {
  enter() { this.t = 0; Audio.stop(); Audio.jingle('over'); },
  update() {
    this.t++;
    if (this.t > 60 && Input.anyPressed()) { SAVE.lives = 5; writeSave(); RUN.score = 0; RUN.coins = 0; Game.set(MapScene); }
  },
  draw() {
    ctx.fillStyle = '#0c0610'; ctx.fillRect(0, 0, W, H);
    drawText('GAME OVER', W / 2, 80, '#ff5050', 3, '#1a0f14', 'center');
    drawText('MA T9NTCH... 3AWED A SAHBI!', W / 2, 130, '#ffffff', 1, '#1a0f14', 'center');
    drawText('TA PROGRESSION EST GARDEE. +5 VIES.', W / 2, 146, '#c8b8a8', 1, '#1a0f14', 'center');
    drawSpr(SPR.ghoul[Math.floor(this.t / 10) % 2], W / 2 - 30, 210);
    drawSpr(SPR.witch[Math.floor(this.t / 10) % 2], W / 2 + 30, 200 + Math.sin(this.t * 0.1) * 4, true);
    if (this.t > 60 && Math.floor(this.t / 25) % 2) drawText('CONTINUER >', W / 2, 240, '#ffe060', 1, '#1a0f14', 'center');
  },
};

// --------------------------------------------------------------- ENDING
const ENDING = [
  'AICHA KANDICHA EST RETOURNEE DANS LES CONTES... POUR DE BON.',
  'LA LUNE A RETROUVE SA COULEUR. LES GHWAL ONT DISPARU DU BLED.',
  'A FES, CHAOUEN, MERZOUGA ET MARRAKECH, ON PREPARE LE THE ET LES MSEMEN.',
  'ET LES GRANDS-MERES ONT UNE NOUVELLE HISTOIRE A RACONTER:',
  'CELLE DES BLED BROS!',
  'MERCI D\'AVOIR JOUE. 3LA SLAMTEK!',
];
const EndingScene = {
  enter() { this.t = 0; this.i = 0; this.chars = 0; Audio.play('title'); SAVE.ending = true; writeSave(); },
  update() {
    this.t++;
    if (this.i < ENDING.length) {
      const full = ENDING[this.i].length;
      if (this.chars < full) { this.chars += 0.7; if (Input.anyPressed()) this.chars = full; }
      else if (Input.anyPressed()) { this.i++; this.chars = 0; }
    } else if (Input.anyPressed()) Game.set(TitleScene);
  },
  draw() {
    const bg = BG_CACHE.jemaa || (BG_CACHE.jemaa = buildBackground('jemaa'));
    ctx.drawImage(bg.sky, 0, 0);
    for (const l of bg.layers) ctx.drawImage(l.c, -Math.floor(this.t * l.f * 0.5) % BGW, 0);
    for (let x = 0; x < W; x += 16) { ctx.drawImage(groundTile('jemaa', true, false, false, (x / 16) & 3), x, 238); ctx.drawImage(groundTile('jemaa', false, false, false, 1), x, 254); }
    // fireworks
    if (this.t % 40 === 0) this.fw = { x: rnd(60, 420), y: rnd(30, 100), t: 0, c: choice(['#ffe060', '#ff6080', '#60d0ff', '#80ff80']) };
    if (this.fw) {
      this.fw.t++;
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, r = this.fw.t * 1.4; ctx.fillStyle = this.fw.c; ctx.globalAlpha = Math.max(0, 1 - this.fw.t / 40); ctx.fillRect(Math.round(this.fw.x + Math.cos(a) * r), Math.round(this.fw.y + Math.sin(a) * r), 2, 2); }
      ctx.globalAlpha = 1;
    }
    CHARS.forEach((ch, i) => drawSpr(CHAR_SPR[ch.id].big[Math.floor(this.t / 15 + i) % 2 ? 'win' : 'idle0'], 150 + i * 60, 239 - (Math.floor(this.t / 15 + i) % 2) * 4));
    drawLogo(W / 2, 24, this.t);
    if (this.i < ENDING.length) {
      panel(30, 130, W - 60, 50);
      const lines = wrapText(ENDING[this.i], W - 90);
      let shown = Math.floor(this.chars);
      lines.forEach((ln, k) => { if (shown > 0) drawText(ln.slice(0, shown), W / 2, 142 + k * 12, '#ffffff', 1, '#1a0f14', 'center'); shown -= ln.length + 1; });
    } else {
      panel(90, 120, W - 180, 64);
      drawText('SCORE FINAL: ' + RUN.score, W / 2, 132, '#ffe060', 1, '#1a0f14', 'center');
      drawText('UN JEU POUR TOUS LES ENFANTS DU BLED', W / 2, 148, '#ffffff', 1, '#1a0f14', 'center');
      drawText('FIN', W / 2, 164, '#ff9090', 1, '#1a0f14', 'center');
    }
  },
};
