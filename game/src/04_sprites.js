// ============================================================
// Enemies, items, projectiles, bosses — procedural pixel art
// ============================================================
const SPR = {};
function spr(w, h, fn, dark = 0.3) {
  const s = new PSprite(w, h);
  fn(s);
  if (dark !== null) s.outline(dark);
  return s.canvas();
}

function buildEnemySprites() {
  // ---------------- GHOUL (small walker) ----------------
  const ghoul = (f, squash) => spr(22, 22, (s) => {
    const skin = '#8aa07a', cloth = '#5a4434', dk = shade(skin, -0.3);
    if (squash) {
      s.ellipse(11, 18, 8, 3, cloth); s.ellipse(12, 16, 5, 2.5, skin);
      s.px(10, 16, '#ff3030'); s.px(14, 16, '#ff3030');
      return;
    }
    const lf = f ? 2 : -1, rf = f ? -1 : 2;
    s.line(8, 15, 8 + lf, 20, dk, 2); s.line(13, 15, 13 + rf, 20, skin, 2);
    s.rect(7 + lf, 20, 3, 1, dk); s.rect(12 + rf, 20, 3, 1, skin);
    s.ellipse(10, 13, 6, 4.5, cloth);
    for (let i = 0; i < 6; i++) s.px(5 + i * 2, 17 + (i % 2), cloth); // ragged hem
    s.rect(6, 10, 2, 6, shade(cloth, 0.2));
    s.ball(14, 7, 4.5, 4.2, skin);
    s.rect(15, 6, 2, 2, '#ffe060'); s.px(16, 6, '#ff2020');
    s.rect(12, 6, 1, 2, '#ffe060');
    s.rect(14, 10, 4, 1, '#2a1018'); s.px(15, 10, '#f0f0e0'); s.px(17, 10, '#f0f0e0');
    s.px(11, 3, dk); s.px(13, 2, dk); s.px(15, 3, dk); // hair tufts
    // long arm with claws
    s.line(12, 11, 18, 14 + (f ? 1 : 0), skin, 2);
    s.px(19, 15 + (f ? 1 : 0), '#e8e8d0'); s.px(20, 14 + (f ? 1 : 0), '#e8e8d0');
  });
  SPR.ghoul = [ghoul(0), ghoul(1)];
  SPR.ghoulSquash = ghoul(0, true);

  // ---------------- BLACK CAT ----------------
  const cat = (f) => spr(22, 16, (s) => {
    const c = '#262232', l = '#3e3854';
    s.line(3, 8, 1, 2 + f, c, 2); s.px(2, 1 + f, c);
    s.ellipse(9, 9, 6, 3.2, c);
    s.rect(5, 7, 7, 1, l);
    const a = f ? 2 : -2;
    s.line(6, 11, 6 - a, 14, c, 2); s.line(12, 11, 12 + a, 14, c, 2);
    s.ball(16, 7, 3.8, 3.4, c);
    s.px(14, 3, c); s.px(14, 2, c); s.px(15, 3, c); s.px(18, 3, c); s.px(19, 2, c); s.px(19, 3, c);
    s.rect(16, 6, 2, 2, '#f8e040'); s.px(17, 6, '#101010');
    s.px(19, 7, '#f8e040'); s.px(20, 9, '#e0a0b0');
  });
  SPR.cat = [cat(0), cat(1)];

  // ---------------- WITCH (flying sorciere on a broom) ----------------
  const witch = (f) => spr(28, 26, (s) => {
    const robe = '#4a2a62', face = '#9ab07a';
    s.line(2, 20, 25, 17, '#7a5230', 1); s.line(2, 21, 25, 18, '#5a3a20', 1);
    for (let i = 0; i < 5; i++) s.line(1, 18 + i, -2 + (i % 2), 19 + i * 1.2, '#c8a050', 1);
    s.poly([[8, 8], [17, 8], [20 + f, 20], [5 - f, 20]], robe);
    s.rect(8, 10, 2, 9, shade(robe, 0.2));
    for (let i = 0; i < 4; i++) s.px(5 - f + i * 4, 21, robe);
    s.ball(14, 7, 4, 4, face);
    s.poly([[9, 6], [19, 6], [16, 0], [11, 0]], '#2a1838'); // hood
    s.rect(9, 3, 4, 6, '#2a1838');
    s.px(18, 8, face); s.px(19, 9, face); s.px(19, 8, shade(face, -0.2)); // nose
    s.px(16, 6, '#ff4040'); s.px(14, 6, '#ff4040');
    s.rect(15, 10, 3, 1, '#2a1020'); s.px(16, 10, '#f0d040');
    s.line(15, 12, 20, 14, robe, 2);
    s.rect(20, 11, 3, 4, '#40d060'); s.px(21, 10, '#a08060'); s.px(20, 12, '#a0ffb0');
  });
  SPR.witch = [witch(0), witch(1)];

  // ---------------- DJINN (smoke spirit, boo-like) ----------------
  const djinn = (f, shy) => spr(24, 28, (s) => {
    const c = '#6a5ae0', l = '#9a8af8', d = '#4a38b0';
    // smoky tail
    for (let i = 0; i < 9; i++) {
      const w = 6 - i * 0.6, x = 12 + Math.sin(i * 0.8 + f * 1.6) * 3;
      s.ellipse(x, 17 + i, Math.max(0.6, w), 1.2, i % 2 ? c : d);
    }
    s.ball(12, 11, 7, 7, c);
    s.rect(8, 6, 3, 2, l);
    s.rect(11, 1, 2, 4, '#202040'); s.px(12, 0, '#202040'); // topknot
    s.rect(8, 15, 8, 2, '#f2c230'); // gold collar
    if (shy) {
      s.rect(6, 8, 5, 5, l); s.rect(13, 8, 5, 5, l); // hands over face
      s.px(10, 13, '#20103a');
    } else {
      s.rect(8, 9, 3, 2, '#fff8a0'); s.rect(14, 9, 3, 2, '#fff8a0');
      s.px(9, 9, '#202020'); s.px(15, 9, '#202020');
      s.line(7, 7, 10, 8, '#20103a'); s.line(18, 7, 15, 8, '#20103a');
      s.rect(9, 13, 6, 1, '#20103a'); s.px(10, 13, '#f0f0f0'); s.px(13, 13, '#f0f0f0');
      s.line(5, 13, 1, 9 + f, c, 2); s.line(19, 13, 23, 9 + f, c, 2);
    }
  });
  SPR.djinn = [djinn(0), djinn(1)];
  SPR.djinnShy = djinn(0, true);

  // ---------------- SCORPION ----------------
  const scorp = (f) => spr(24, 18, (s) => {
    const c = '#c87a30', d = shade(c, -0.3);
    for (let i = 0; i < 3; i++) { const a = (i + f) % 2 ? 1 : -1; s.line(8 + i * 3, 14, 7 + i * 3 + a, 17, d, 1); }
    s.ellipse(11, 13, 7, 2.5, c);
    s.rect(6, 11, 10, 1, shade(c, 0.25));
    // tail
    const pts = [[4, 12], [2, 9], [2, 5], [4, 2], [7, 1 + f]];
    for (let i = 0; i < pts.length - 1; i++) s.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c, 2);
    s.px(8, 2 + f, '#ffe0a0'); s.px(9, 3 + f, '#401010');
    // claws
    s.line(17, 12, 21, 10, c, 2); s.rect(20, 8, 3, 2, d); s.px(23, 9, d);
    s.px(16, 12, '#101010'); s.px(15, 11, '#101010');
  });
  SPR.scorpion = [scorp(0), scorp(1)];

  // ---------------- FIRE SKULL ----------------
  const fskull = (f) => spr(18, 20, (s) => {
    for (let i = 0; i < 6; i++) s.ellipse(9 + Math.sin(i * 1.7 + f) * 3, 12 - i * 1.8, 5 - i * 0.6, 3, i < 2 ? '#ff6a1a' : i < 4 ? '#ffaa20' : '#ffe060');
    s.ball(9, 13, 5, 4.5, '#f4eee0');
    s.rect(6, 12, 2, 2, '#301010'); s.rect(10, 12, 2, 2, '#301010');
    s.px(6, 12, '#ff4020'); s.px(10, 12, '#ff4020');
    s.rect(7, 16, 4, 2, '#e0d8c8'); s.px(8, 17, '#301010'); s.px(10, 17, '#301010');
  });
  SPR.fireskull = [fskull(0), fskull(2)];

  // ---------------- BAT (khfafich) ----------------
  const bat = (f) => spr(22, 14, (s) => {
    const c = '#3a2850', w = '#5a3e78';
    if (f === 2) { // hanging
      s.ellipse(11, 7, 3, 5, c); s.px(10, 1, c); s.px(12, 1, c);
      s.px(10, 9, '#ff3030'); s.px(12, 9, '#ff3030');
      return;
    }
    s.ellipse(11, 7, 3, 3, c);
    s.px(9, 3, c); s.px(13, 3, c);
    s.px(10, 6, '#ff3030'); s.px(12, 6, '#ff3030');
    if (f === 0) { s.poly([[9, 6], [1, 2], [3, 8], [6, 7]], w); s.poly([[13, 6], [21, 2], [19, 8], [16, 7]], w); }
    else { s.poly([[9, 7], [1, 12], [4, 9], [6, 10]], w); s.poly([[13, 7], [21, 12], [18, 9], [16, 10]], w); }
  });
  SPR.bat = [bat(0), bat(1), bat(2)];

  // ---------------- COBRA + BASKET ----------------
  const cobra = (f) => spr(20, 30, (s) => {
    const c = '#3c9a44', d = shade(c, -0.3), b = '#e8d070';
    for (let y = 26; y > 10; y--) s.rect(9 + Math.round(Math.sin(y * 0.4 + f) * 2), y, 3, 1, y % 3 ? c : d);
    s.ellipse(10 + f, 8, 5, 5, c); // hood
    s.ellipse(10 + f, 9, 2, 3, b);
    s.ball(11 + f, 4, 3, 2.5, c);
    s.px(12 + f, 3, '#ffe020'); s.px(10 + f, 3, '#ffe020');
    s.px(14 + f, 5, '#ff3040'); s.px(15 + f, 6, '#ff3040');
    // basket
    s.rect(3, 22, 14, 8, '#b08040');
    for (let x = 3; x < 17; x += 2) for (let y = 22; y < 30; y += 2) s.px(x + ((y / 2) % 2), y, '#8a5a28');
    s.rect(2, 21, 16, 2, '#c89a50');
  });
  SPR.cobra = [cobra(0), cobra(1)];
  SPR.basket = spr(20, 12, (s) => {
    s.rect(3, 4, 14, 8, '#b08040');
    for (let x = 3; x < 17; x += 2) for (let y = 4; y < 12; y += 2) s.px(x + ((y / 2) % 2), y, '#8a5a28');
    s.rect(2, 3, 16, 2, '#c89a50'); s.ellipse(10, 2, 6, 1.5, '#7a5228');
  });
}

function buildItemSprites() {
  // dirham coin: 4-frame spin
  const coin = (wid) => spr(12, 14, (s) => {
    const cx = 6, rx = [5, 3.5, 1, 3.5][wid];
    s.ellipse(cx, 7, rx, 5.5, '#c8901a');
    if (rx > 1.5) s.ellipse(cx, 7, rx - 1, 4.5, '#f2c230');
    if (rx > 3) { s.rect(cx, 4, 1, 6, '#c8901a'); s.px(cx - 1, 5, '#c8901a'); s.rect(cx - 1, 9, 3, 1, '#c8901a'); s.px(cx - 3, 4, '#fff6c0'); s.px(cx - 3, 5, '#fff6c0'); }
    else if (rx > 1.5) s.rect(cx - 1, 3, 1, 3, '#fff6c0');
    else s.rect(cx, 2, 1, 10, '#fff0a0');
  }, 0.35);
  SPR.coin = [coin(0), coin(1), coin(2), coin(1)];
  SPR.coinIcon = coin(0);

  SPR.tea = spr(12, 16, (s) => {
    // mint leaves
    s.ellipse(5, 3, 2, 1.5, '#3aa040'); s.ellipse(8, 2, 2, 1.5, '#4cc050'); s.px(6, 1, '#2a8030');
    s.poly([[2, 5], [10, 5], [9, 15], [3, 15]], '#d07a1a');
    s.rect(3, 5, 6, 2, '#f0b040');
    s.rect(3, 9, 6, 2, '#f2c230'); s.px(4, 10, '#c8302a'); s.px(6, 10, '#2a7ad0'); s.px(8, 10, '#c8302a');
    s.rect(3, 7, 1, 7, '#ffe0a0');
    s.rect(2, 5, 8, 1, '#f8f0e0');
  });
  SPR.msemen = spr(16, 14, (s) => {
    s.rect(1, 3, 14, 10, '#d8902a');
    s.rect(2, 2, 12, 10, '#f0b840');
    for (let i = 2; i < 14; i += 4) { s.rect(i, 2, 1, 10, '#c88020'); }
    for (let j = 4; j < 12; j += 3) s.rect(2, j, 12, 1, '#d89030');
    s.rect(3, 3, 3, 1, '#fff0b0'); s.px(9, 6, '#fff0b0'); s.px(5, 9, '#c06818');
  });
  SPR.khamsa = spr(14, 18, (s) => {
    const c = '#2a7ad0', g = '#f2c230';
    for (let i = 0; i < 5; i++) {
      const x = 2 + i * 2.5, top = i === 0 || i === 4 ? 6 : i === 2 ? 1 : 2;
      s.rect(Math.round(x), top, 2, 10 - top, c);
    }
    s.ellipse(7, 11, 5.5, 5, c);
    s.ellipse(7, 11, 3, 2, '#ffffff'); s.ellipse(7, 11, 1.2, 1.5, '#1a3a8a'); s.px(7, 10, '#ffffff');
    s.rect(3, 6, 8, 1, g); s.rect(4, 15, 6, 1, g);
    s.px(1, 9, g); s.px(12, 9, g);
  });
  SPR.babouche = spr(12, 8, (s) => {
    s.poly([[1, 3], [9, 2], [11, 4], [9, 6], [1, 6]], '#f2c230');
    s.rect(2, 3, 4, 1, '#ffe890'); s.rect(1, 6, 10, 1, '#b08020'); s.px(7, 4, '#c8302a');
  });
  SPR.orange = spr(8, 8, (s) => { s.ball(4, 4, 3, 3, '#f08a1a'); s.px(4, 0, '#3aa040'); s.px(5, 0, '#3aa040'); });
  SPR.potion = spr(8, 10, (s) => {
    s.ellipse(4, 6, 3, 3, '#40d060'); s.rect(3, 1, 2, 3, '#a0c0b0'); s.rect(3, 0, 2, 1, '#8a5a30'); s.px(3, 5, '#c0ffd0');
  });
  SPR.fireball = [0, 1].map((f) => spr(10, 10, (s) => {
    s.ellipse(5, 5, 4 - f * 0.5, 4, '#ff5a1a'); s.ellipse(5, 5, 2.5, 2.5, '#ffb030'); s.ellipse(5 + f, 5, 1, 1, '#fff6a0');
  }, 0.5));
  SPR.bluefire = [0, 1].map((f) => spr(10, 12, (s) => {
    s.ellipse(5, 7, 4, 4, '#2a6ae0'); s.ellipse(5, 6 - f, 2.5, 3, '#6ac0ff'); s.ellipse(5, 6, 1, 1.5, '#e0f8ff'); s.px(5, 1 + f, '#6ac0ff');
  }, 0.5));
  SPR.rock = spr(10, 10, (s) => { s.ball(5, 5, 4, 3.6, '#8a7a6a'); s.px(4, 3, '#b8a898'); });
  SPR.jar = spr(12, 14, (s) => {
    s.ball(6, 8, 5, 5, '#c0683a'); s.rect(4, 1, 4, 3, '#a85a30'); s.rect(3, 1, 6, 1, '#c87a48');
    s.rect(2, 8, 8, 1, '#f0e0c0'); s.px(3, 6, '#e8a070');
  });
  SPR.star = [0, 1].map((f) => spr(8, 8, (s) => {
    const c = f ? '#fff6a0' : '#ffd040';
    s.rect(3, 0, 2, 8, c); s.rect(0, 3, 8, 2, c); s.px(2, 2, c); s.px(5, 2, c); s.px(2, 5, c); s.px(5, 5, c);
  }, null));
  SPR.heart = spr(9, 8, (s) => { s.rect(1, 1, 3, 4, '#e82838'); s.rect(5, 1, 3, 4, '#e82838'); s.rect(2, 5, 5, 1, '#e82838'); s.rect(3, 6, 3, 1, '#e82838'); s.px(4, 2, '#e82838'); s.px(2, 2, '#ff9aa0'); });
  // checkpoint lantern (fanous): off / on
  SPR.lantern = [0, 1].map((on) => spr(12, 22, (s) => {
    s.rect(5, 0, 2, 3, '#8a6a3a');
    s.poly([[2, 4], [10, 4], [11, 9], [9, 16], [3, 16], [1, 9]], on ? '#ffd060' : '#5a4a3a');
    for (let y = 5; y < 16; y += 3) s.rect(2, y, 8, 1, '#a07a30');
    s.rect(5, 4, 2, 12, '#a07a30');
    s.rect(3, 16, 6, 2, '#a07a30'); s.rect(5, 18, 2, 3, '#8a6a3a');
    s.rect(4, 3, 4, 1, '#c89a40');
    if (on) { s.px(4, 7, '#fff8d0'); s.px(7, 10, '#fff8d0'); }
  }));
}

// ============================================================
// BOSSES
// ============================================================
function buildBossSprites() {
  // ---------- SHUWAFA (the souk witch) ----------
  const shuwafa = (pose) => spr(40, 46, (s) => {
    const robe = '#3a1e4e', face = '#a8b884', hair = '#d8d8e0';
    const f = pose === 'float1' ? 1 : 0;
    // cloak
    s.poly([[12, 14], [27, 14], [34 + f, 42], [5 - f, 42]], robe);
    for (let i = 0; i < 7; i++) s.px(6 + i * 4 - f, 43, robe);
    s.rect(13, 16, 3, 24, shade(robe, 0.18));
    // patterned sash (Berber motifs)
    s.rect(9, 27, 22, 3, '#c8302a');
    for (let x = 10; x < 30; x += 4) { s.px(x, 28, '#f2c230'); s.px(x + 1, 27, '#f2c230'); s.px(x + 1, 29, '#f2c230'); }
    // head + hood
    s.ball(21, 11, 6, 6, face);
    s.poly([[12, 12], [30, 12], [26, 1], [16, 1]], '#24122e');
    s.rect(12, 6, 5, 12, '#24122e');
    s.rect(26, 6, 3, 2, hair); s.px(28, 13, hair);
    // big nose + wart
    s.poly([[26, 10], [31, 15], [26, 14]], face); s.px(29, 12, '#6a7a48');
    if (pose === 'hurt') { s.line(21, 9, 23, 11, '#200'); s.line(23, 9, 21, 11, '#200'); }
    else { s.rect(21, 9, 3, 2, '#ffe040'); s.px(23, 9, '#e01010'); }
    s.rect(20, 15, 5, 1, '#301020'); s.px(22, 15, '#f2c230'); s.px(24, 15, '#f2c230');
    // arms / staff
    if (pose === 'cast') {
      s.line(14, 18, 8, 5, robe, 3); s.line(26, 18, 33, 5, robe, 3);
      s.ball(7, 4, 2, 2, face); s.ball(34, 4, 2, 2, face);
      s.ellipse(34, 1, 2, 1.5, '#60ff80'); s.ellipse(7, 1, 2, 1.5, '#60ff80');
    } else if (pose === 'stir') {
      s.line(26, 19, 34, 28, robe, 3); s.ball(34, 28, 2, 2, face);
      s.line(35, 22, 30, 42, '#7a5230', 2); // ladle
    } else {
      s.line(27, 19, 33, 22, robe, 3); s.ball(34, 22, 2, 2, face);
      s.line(36, 4, 35, 42, '#6a4228', 1); // staff
      s.ball(36, 4, 3, 3, '#e8e0d0'); s.px(35, 4, '#200'); s.px(37, 4, '#200'); // skull
    }
  });
  SPR.shuwafa = {};
  for (const p of ['float0', 'float1', 'cast', 'stir', 'hurt']) SPR.shuwafa[p] = shuwafa(p);
  SPR.cauldron = [0, 1].map((f) => spr(30, 22, (s) => {
    s.ellipse(15, 12, 13, 9, '#2a2a34');
    s.ellipse(15, 5, 12, 3, '#40e060');
    s.ellipse(9 + f * 6, 4, 2, 2, '#a0ffb0'); s.ellipse(20 - f * 4, 5, 1.5, 1.5, '#a0ffb0');
    s.rect(3, 4, 24, 2, '#4a4a58');
    s.rect(6, 19, 3, 3, '#2a2a34'); s.rect(21, 19, 3, 3, '#2a2a34');
    s.px(8, 10, '#6a6a7a'); s.px(9, 11, '#6a6a7a');
  }));

  // ---------- GHOULA (giant ogress) ----------
  const ghoula = (pose) => spr(64, 70, (s) => {
    const skin = '#7c9470', dk = shade(skin, -0.3), hair = '#20182a', dress = '#8a2a2a';
    const step = pose === 'walk1' ? 3 : pose === 'walk0' ? -3 : 0;
    const crouch = pose === 'slam' ? 6 : pose === 'charge' ? 3 : 0;
    const by = crouch;
    // legs
    s.line(24, 50 + by * 0.5, 22 + step, 66, dk, 6);
    s.line(36, 50 + by * 0.5, 38 - step, 66, skin, 6);
    s.rect(18 + step, 65, 9, 3, dk); s.rect(35 - step, 65, 9, 3, skin);
    // hair mass behind
    s.ellipse(28, 26 + by, 22, 22, hair);
    for (let i = 0; i < 9; i++) s.line(10 + i * 4, 28 + by, 6 + i * 4 + (i % 3) * 2, 52 + by + (i % 2) * 4, hair, 3);
    // body (ragged dress)
    s.poly([[16, 26 + by], [42, 26 + by], [48, 54 + by * 0.5], [12, 54 + by * 0.5]], dress);
    for (let i = 0; i < 9; i++) s.poly([[12 + i * 4, 54 + by * 0.5], [16 + i * 4, 54 + by * 0.5], [14 + i * 4, 58 + by * 0.5 + (i % 2) * 2]], dress);
    s.rect(18, 28 + by, 4, 24, shade(dress, 0.2));
    s.rect(14, 40 + by, 32, 3, '#4a1a1a');
    // head
    s.ball(32, 18 + by, 13, 12, skin);
    // brow + eyes
    s.rect(24, 12 + by, 18, 2, dk);
    if (pose === 'stun') {
      s.line(27, 14 + by, 31, 18 + by, '#200'); s.line(31, 14 + by, 27, 18 + by, '#200');
      s.line(36, 14 + by, 40, 18 + by, '#200'); s.line(40, 14 + by, 36, 18 + by, '#200');
    } else if (pose === 'hurt') {
      s.rect(27, 15 + by, 4, 1, '#200'); s.rect(36, 15 + by, 4, 1, '#200');
    } else {
      s.rect(27, 14 + by, 5, 4, '#ffe040'); s.rect(36, 14 + by, 5, 4, '#ffe040');
      s.rect(29, 15 + by, 2, 2, '#c00000'); s.rect(38, 15 + by, 2, 2, '#c00000');
    }
    // nose + big mouth with tusks
    s.rect(33, 19 + by, 3, 3, dk);
    const mo = pose === 'slam' || pose === 'charge' ? 3 : 0;
    s.rect(25, 24 + by, 18, 4 + mo, '#3a0a14');
    s.rect(26, 24 + by, 16, 1, '#f0ecd8');
    s.rect(27, 27 + by + mo, 14, 1, '#f0ecd8');
    s.rect(25, 21 + by, 2, 4, '#f0ecd8'); s.rect(41, 21 + by, 2, 4, '#f0ecd8'); // tusks
    // wild hair top
    for (let i = 0; i < 7; i++) s.line(20 + i * 4, 8 + by, 17 + i * 5, 0 + (i % 2) * 3 + by, hair, 3);
    // gold earrings
    s.ellipse(20, 24 + by, 2, 2, '#f2c230'); s.ellipse(20, 24 + by, 1, 1, hair);
    // arms
    if (pose === 'jump' || pose === 'slam') {
      s.line(16, 30 + by, 8, 10 + by * 2, skin, 5); s.line(44, 30 + by, 54, 10 + by * 2, skin, 5);
      s.ball(7, 8 + by * 2, 4, 4, skin); s.ball(55, 8 + by * 2, 4, 4, skin);
    } else if (pose === 'charge') {
      s.line(44, 30 + by, 58, 38 + by, skin, 5); s.ball(59, 39 + by, 4, 4, skin);
      for (let i = 0; i < 3; i++) s.px(62, 37 + i * 2 + by, '#f0ecd8');
    } else {
      s.line(16, 30 + by, 10, 46 + step, dk, 5); s.line(44, 30 + by, 50, 46 - step, skin, 5);
      s.ball(9, 48 + step, 4, 4, dk); s.ball(51, 48 - step, 4, 4, skin);
      for (let i = 0; i < 3; i++) { s.px(48 + i * 2, 53 - step, '#f0ecd8'); }
    }
  }, 0.28);
  SPR.ghoula = {};
  for (const p of ['walk0', 'walk1', 'jump', 'slam', 'charge', 'stun', 'hurt']) SPR.ghoula[p] = ghoula(p);

  // ---------- AFRIT BOU NAR (fire djinn) ----------
  const afrit = (pose) => spr(56, 62, (s) => {
    const stone = pose === 'stone';
    const skin = stone ? '#7a7478' : '#d8402a', dk = shade(skin, -0.3), lt = shade(skin, 0.3);
    const f = pose === 'float1' ? 1 : 0;
    // smoke/fire tail
    for (let i = 0; i < 12; i++) {
      const w = 10 - i * 0.75, x = 28 + Math.sin(i * 0.7 + f * 2) * 4;
      s.ellipse(x, 38 + i * 1.8, Math.max(1, w), 2, stone ? (i % 2 ? '#5a5458' : '#6a6468') : i % 3 === 0 ? '#ff9a20' : i % 3 === 1 ? '#e8502a' : '#ffd040');
    }
    // torso
    s.ball(28, 30, 12, 10, skin);
    s.rect(22, 26, 3, 8, lt); s.rect(27, 32, 2, 6, dk); // abs
    s.rect(18, 37, 20, 3, stone ? '#5a5458' : '#f2c230');
    // arms
    if (pose === 'cast') {
      s.line(17, 26, 5, 14, skin, 5); s.line(39, 26, 51, 14, skin, 5);
      s.ball(4, 12, 3, 3, skin); s.ball(52, 12, 3, 3, skin);
      if (!stone) { s.ellipse(4, 8, 3, 3, '#ffd040'); s.ellipse(52, 8, 3, 3, '#ffd040'); }
      s.rect(9, 18, 3, 3, '#f2c230'); s.rect(44, 18, 3, 3, '#f2c230');
    } else {
      s.line(17, 26, 10, 38, skin, 5); s.line(39, 26, 46, 38, skin, 5);
      s.ball(10, 40, 3.5, 3.5, skin); s.ball(46, 40, 3.5, 3.5, skin);
      s.rect(9, 33, 4, 3, stone ? '#6a6468' : '#f2c230'); s.rect(44, 33, 4, 3, stone ? '#6a6468' : '#f2c230');
    }
    // head
    s.ball(28, 13, 9, 9, skin);
    // horns
    s.poly([[20, 8], [14, 0], [17, 0], [23, 5]], stone ? '#4a4448' : '#2a1a1a');
    s.poly([[36, 8], [42, 0], [39, 0], [33, 5]], stone ? '#4a4448' : '#2a1a1a');
    // flaming hair
    if (!stone) for (let i = 0; i < 5; i++) s.ellipse(22 + i * 3, 4 - (i % 2) * 2 - f, 2, 3, i % 2 ? '#ffd040' : '#ff8a20');
    // face
    if (pose === 'hurt') { s.rect(22, 12, 4, 1, '#200'); s.rect(31, 12, 4, 1, '#200'); }
    else if (stone) { s.rect(22, 12, 4, 2, '#3a3438'); s.rect(31, 12, 4, 2, '#3a3438'); }
    else { s.rect(22, 11, 4, 3, '#fff6a0'); s.rect(31, 11, 4, 3, '#fff6a0'); s.px(24, 12, '#200'); s.px(33, 12, '#200'); }
    s.line(21, 9, 26, 10, dk); s.line(35, 9, 30, 10, dk);
    s.rect(24, 17, 9, 3, '#3a0a10'); s.rect(24, 17, 9, 1, '#f0ecd8');
    s.rect(26, 20, 5, 2, dk); // beard
  }, 0.28);
  SPR.afrit = {};
  for (const p of ['float0', 'float1', 'cast', 'stone', 'hurt']) SPR.afrit[p] = afrit(p);

  // ---------- AICHA KANDICHA ----------
  const kandicha = (pose) => spr(52, 66, (s) => {
    const skin = '#d8bca8', dress = '#e8eef0', teal = '#2a9a98', hair = '#141020', fur = '#6a4a30';
    const f = pose === 'idle1' ? 1 : 0;
    const charge = pose === 'charge';
    // goat legs
    const ls = charge ? 5 : 0;
    s.line(22, 48, 20 - ls, 56, fur, 4); s.line(20 - ls, 56, 22 - ls, 62, fur, 3);
    s.line(30, 48, 33 + ls, 56, shade(fur, 0.15), 4); s.line(33 + ls, 56, 31 + ls, 62, shade(fur, 0.15), 3);
    s.rect(19 - ls, 62, 4, 3, '#1a1010'); s.rect(30 + ls, 62, 4, 3, '#1a1010'); // hooves
    s.px(21 - ls, 63, '#4a3a3a'); s.px(32 + ls, 63, '#4a3a3a');
    // long hair behind
    s.ellipse(26, 22, 13, 16, hair);
    for (let i = 0; i < 7; i++) s.line(14 + i * 4, 30, 12 + i * 4 + (i % 2) * 2 + f, 50 + (i % 3) * 3, hair, 3);
    // dress (kaftan) — torn at the bottom revealing legs
    s.poly([[19, 20], [33, 20], [40 + f, 50], [12 - f, 50]], dress);
    for (let i = 0; i < 7; i++) s.poly([[12 + i * 4, 50], [16 + i * 4, 50], [14 + i * 4, 53 + (i % 2) * 2]], dress);
    for (let y = 22; y < 48; y += 3) s.px(26, y, '#f2c230'); // sfifa buttons
    s.rect(17, 31, 18, 3, '#d8a830'); // mdamma belt
    for (let x = 18; x < 34; x += 3) s.px(x, 32, teal);
    s.rect(20, 22, 2, 24, '#ffffff');
    s.rect(36, 30, 2, 18, shade(dress, -0.15));
    // face
    s.ball(26, 13, 7, 8, skin);
    s.rect(19, 4, 15, 4, hair); s.rect(18, 6, 3, 12, hair); s.rect(31, 6, 3, 12, hair);
    if (pose === 'hurt' || pose === 'stun') { s.rect(22, 12, 3, 1, '#200'); s.rect(28, 12, 3, 1, '#200'); }
    else { s.rect(22, 11, 3, 2, '#60fff0'); s.rect(28, 11, 3, 2, '#60fff0'); s.px(23, 11, '#ffffff'); s.px(29, 11, '#ffffff'); }
    s.rect(24, 17, 4, 1, pose === 'whip' || charge ? '#5a0a1a' : '#b04050');
    if (pose === 'whip' || charge) s.rect(24, 18, 4, 1, '#5a0a1a');
    s.px(26, 8, '#f2c230'); s.px(25, 9, '#f2c230'); s.px(27, 9, '#f2c230'); // forehead jewel
    // arms
    if (pose === 'whip') {
      s.line(33, 23, 46, 17, dress, 3); s.ball(47, 16, 2, 2, skin);
      for (let i = 0; i < 3; i++) s.line(46, 16, 51, 10 + i * 3, hair, 1);
    } else if (charge) {
      s.line(19, 23, 10, 30, dress, 3); s.line(33, 23, 42, 30, dress, 3);
      s.ball(9, 31, 2, 2, skin); s.ball(43, 31, 2, 2, skin);
    } else {
      s.line(19, 23, 13, 36 + f, dress, 3); s.line(33, 23, 39, 36 - f, dress, 3);
      s.ball(12, 37 + f, 2, 2, skin); s.ball(40, 37 - f, 2, 2, skin);
      s.px(11, 40 + f, '#f8f0ff'); s.px(41, 40 - f, '#f8f0ff'); // long nails
    }
  }, 0.28);
  SPR.kandicha = {};
  for (const p of ['idle0', 'idle1', 'whip', 'charge', 'stun', 'hurt']) SPR.kandicha[p] = kandicha(p);
}
