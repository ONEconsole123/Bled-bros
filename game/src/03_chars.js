// ============================================================
// Playable characters — procedural 16-bit sprites + stats
// ============================================================
const SKIN_EYE = '#1a1020';

const CHARS = [
  {
    id: 'youssef', name: 'YOUSSEF', title: 'GAMIN DU SOUK',
    desc: ['LANCE BABOUCHES', 'TOUT-TERRAIN'],
    speed: 2.25, jump: 6.7, accel: 0.16, stats: [3, 3, 3],
    attack: 'babouche', quote: 'YALLAH, NCHOUFOU!',
    skin: '#c98a5a', shirt: '#c8202c', pants: '#3b5ca8', shoe: '#eeeef0', hair: '#1c1418',
  },
  {
    id: 'salma', name: 'SALMA', title: 'FILLE DE CHAOUEN',
    desc: ['DOUBLE SAUT', 'LANCE ORANGES'],
    speed: 2.6, jump: 6.5, accel: 0.2, stats: [5, 4, 2],
    attack: 'orange', doubleJump: true, quote: 'MA KANKHAFCH MNKOUM!',
    skin: '#d9a07a', shirt: '#f4f1e8', vest: '#2b6cd4', pants: '#233f80', shoe: '#f2c230', hair: '#4a2a1a',
  },
  {
    id: 'moha', name: 'HAJJ MOHA', title: 'LE GRAND-PERE',
    desc: ['CANNE PUISSANTE', 'PLANE (TIENS A)', 'TOUJOURS GRAND'],
    speed: 1.95, jump: 6.4, accel: 0.12, stats: [2, 2, 5],
    attack: 'cane', glide: true, alwaysBig: true, quote: 'BISMILLAH... A WLIDI!',
    skin: '#b97a50', robe: '#b08a5a', shoe: '#f2c230', fez: '#c41e2a', beard: '#f0eee8',
  },
  {
    id: 'amghar', name: 'AMGHAR', title: 'NOMADE DU DESERT',
    desc: ['SABRE TAKOUBA', 'DASH EN COURANT'],
    speed: 2.35, jump: 6.6, accel: 0.15, stats: [4, 3, 4],
    attack: 'sword', dash: true, quote: 'SA7RA MA KATKHL3NICH.',
    skin: '#8a5a3a', robe: '#2a3f9a', cloth: '#1d2a70', shoe: '#7a4a22', metal: '#dcdce8',
  },
];

// pose presets ------------------------------------------------
const POSES = {
  idle0: { bob: 0, bf: [-2, 0], ff: [2, 0], ba: [-1, 7], fa: [1, 7] },
  idle1: { bob: 1, bf: [-2, 0], ff: [2, 0], ba: [-1, 6], fa: [1, 6] },
  run0: { bob: 0, bf: [-4, 1], ff: [4, 0], ba: [3, 5], fa: [-3, 5] },
  run1: { bob: 1, bf: [-1, 0], ff: [1, 2], ba: [1, 6], fa: [0, 6] },
  run2: { bob: 0, bf: [4, 0], ff: [-4, 1], ba: [-3, 5], fa: [4, 4] },
  run3: { bob: 1, bf: [1, 2], ff: [-1, 0], ba: [0, 6], fa: [1, 6] },
  jump: { bob: 0, bf: [-3, 3], ff: [3, 4], ba: [-4, -2], fa: [4, -4], lift: 1 },
  fall: { bob: 0, bf: [-3, 1], ff: [3, 1], ba: [-5, 0], fa: [5, -1] },
  attack: { bob: 0, bf: [-3, 0], ff: [3, 0], ba: [-4, 4], fa: [8, 0], atk: 1 },
  attack2: { bob: 0, bf: [-3, 0], ff: [3, 0], ba: [-3, 5], fa: [-2, -6], atk: 2 },
  hurt: { bob: 0, bf: [-3, 1], ff: [2, 2], ba: [-4, -5], fa: [4, -5], hurt: 1 },
  win: { bob: 0, bf: [-2, 0], ff: [2, 0], ba: [-3, -8], fa: [3, -8], happy: 1 },
  glide: { bob: 0, bf: [-2, 2], ff: [2, 2], ba: [-7, -2], fa: [7, -2], flare: 3 },
  dash: { bob: 1, bf: [-6, 2], ff: [3, 1], ba: [-6, 2], fa: [9, 1], lean: 2, atk: 1 },
};
const FRAME_NAMES = Object.keys(POSES);

function genChar(ch, pose, big) {
  const s = new PSprite(30, 38);
  const G = 36;                    // ground row
  const legLen = big ? 8 : 5;
  const torsoH = big ? 10 : 7;
  const lean = pose.lean || 0;
  const cx = 14 + lean;
  const bob = pose.bob || 0;
  const lift = pose.lift || 0;
  const hipY = G - 2 - legLen - lift;
  const tTop = hipY - torsoH + bob;
  const headH = 10;
  const hy = tTop - headH + 1;     // head top
  const hx = cx - 4;               // head left
  const robe = ch.id === 'moha' || ch.id === 'amghar';
  const robeLen = ch.id === 'moha' ? legLen - 1 : Math.floor(legLen / 2);
  const skinD = shade(ch.skin, -0.25);

  // ---- legs ----
  const legC = ch.pants || shade(ch.robe, -0.35);
  const drawLeg = (foot, back) => {
    const fx = cx + foot[0], fy = G - 1 - foot[1] - lift;
    const c = back ? shade(legC, -0.3) : legC;
    s.line(cx + (back ? -1 : 1), hipY + 1, fx, fy - 1, c, 3);
    const sh = back ? shade(ch.shoe, -0.25) : ch.shoe;
    s.rect(fx - 1, fy - 1, 4, 2, sh);
    s.px(fx + 3, fy, sh);
    if (ch.id === 'youssef') s.rect(fx - 1, fy, 5, 1, back ? '#9a2028' : '#d02a30');
  };
  drawLeg(pose.bf, true);

  // ---- back arm ----
  const shX = cx, shY = tTop + 2;
  const armC = ch.id === 'youssef' ? ch.shirt : ch.id === 'salma' ? ch.vest : ch.robe;
  const drawArm = (a, back) => {
    const tx = shX + a[0], ty = shY + a[1];
    const c = back ? shade(armC, -0.3) : shade(armC, -0.1);
    s.line(shX + (back ? -2 : 1), shY, tx, ty, c, 2);
    if (!back) s.line(shX + 1, shY - 1, tx, ty - 1, shade(armC, 0.18), 1);
    s.rect(tx - 1, ty - 1 + (a[1] > 4 ? 1 : 0), 2, 2, back ? skinD : ch.skin);
  };
  drawArm(pose.ba, true);

  // ---- weapons behind ----
  if (ch.id === 'amghar' && !pose.atk) { // sword hilt behind the shoulder
    s.line(cx - 4, tTop + 1, cx - 7, tTop - 5, '#8a6a3a', 1);
    s.rect(cx - 8, tTop - 7, 2, 2, ch.metal);
  }

  // ---- torso ----
  if (robe) {
    const flare = pose.flare || 0;
    const bottom = ch.id === 'moha' ? G - 2 - lift : hipY + robeLen + 1;
    const pts = [[cx - 4, tTop], [cx + 5, tTop], [cx + 6 + flare, bottom], [cx - 6 - flare, bottom]];
    s.poly(pts, ch.robe);
    // shading + stripes
    for (let y = tTop; y <= bottom; y++) {
      const t = (y - tTop) / Math.max(1, bottom - tTop);
      const l = Math.round(cx - 4 - t * (2 + flare)), r = Math.round(cx + 5 + t * (1 + flare));
      s.px(l, y, shade(ch.robe, 0.25));
      s.px(r - 1, y, shade(ch.robe, -0.3));
      s.px(r - 2, y, shade(ch.robe, -0.15));
      if (ch.id === 'moha' && y > tTop + 1) { s.px(cx - 1, y, shade(ch.robe, -0.18)); s.px(cx + 2, y, shade(ch.robe, -0.18)); }
    }
    s.rect(cx - 5 - flare, bottom, 12 + flare * 2, 1, shade(ch.robe, -0.35));
    if (ch.id === 'moha') { // hood on the back
      s.ellipse(cx - 4, tTop + 2, 2, 2, shade(ch.robe, -0.12));
      s.px(cx - 5, tTop + 4, shade(ch.robe, -0.3));
    } else { // amghar: silver belt + agadez cross
      s.rect(cx - 4, hipY - 1, 10, 1, '#c8a040');
      s.px(cx + 2, tTop + 3, ch.metal); s.px(cx + 1, tTop + 4, ch.metal); s.px(cx + 3, tTop + 4, ch.metal); s.px(cx + 2, tTop + 5, ch.metal);
    }
  } else {
    s.rect(cx - 4, tTop, 9, torsoH + 2 - bob, ch.shirt);
    s.rect(cx - 4, tTop, 1, torsoH + 2 - bob, shade(ch.shirt, 0.2));
    s.rect(cx + 3, tTop, 2, torsoH + 2 - bob, shade(ch.shirt, -0.25));
    s.rect(cx - 4, hipY, 9, 2, ch.pants);
    if (ch.id === 'youssef') { // green star of the flag
      const sx = cx + 1, sy = tTop + 3;
      s.px(sx, sy - 1, '#1f8a3a'); s.px(sx - 1, sy, '#1f8a3a'); s.px(sx + 1, sy, '#1f8a3a'); s.px(sx, sy, '#1f8a3a');
      s.px(sx - 1, sy + 1, '#1f8a3a'); s.px(sx + 1, sy + 1, '#1f8a3a');
    }
    if (ch.id === 'salma') { // blue vest over white top
      s.rect(cx - 4, tTop, 3, torsoH, ch.vest);
      s.rect(cx + 3, tTop, 2, torsoH, shade(ch.vest, -0.2));
      s.px(cx + 1, tTop + 2, '#f2c230');
    }
  }

  // ---- front leg (after torso for non-robes) ----
  if (!robe) drawLeg(pose.ff, false);
  else {
    const fx = cx + pose.ff[0], fy = G - 1 - pose.ff[1] - lift;
    if (ch.id === 'amghar') s.line(cx + 1, hipY + robeLen, fx, fy - 1, shade(ch.robe, -0.35), 3);
    s.rect(fx - 1, fy - 1, 4, 2, ch.shoe); s.px(fx + 3, fy, ch.shoe);
  }

  // ---- head ----
  s.ellipse(hx + 4.5, hy + 5, 4.5, 4.8, ch.skin);
  s.rect(hx + 1, hy + 6, 8, 3, ch.skin);
  for (let y = hy + 2; y < hy + 10; y++) s.px(hx, y, skinD);
  s.px(hx + 9, hy + 6, skinD); // nose
  s.rect(hx + 2, hy + 5, 1, 2, skinD); s.px(hx + 3, hy + 5, skinD); // ear
  // eye
  const ey = hy + 4;
  if (pose.hurt) {
    s.px(hx + 6, ey, SKIN_EYE); s.px(hx + 8, ey, SKIN_EYE); s.px(hx + 7, ey + 1, SKIN_EYE); s.px(hx + 6, ey + 2, SKIN_EYE); s.px(hx + 8, ey + 2, SKIN_EYE);
  } else if (pose.happy) {
    s.px(hx + 6, ey + 1, SKIN_EYE); s.px(hx + 7, ey, SKIN_EYE); s.px(hx + 8, ey + 1, SKIN_EYE);
  } else {
    s.rect(hx + 6, ey, 2, 3, '#ffffff');
    s.rect(hx + 7, ey + 1, 1, 2, SKIN_EYE);
    s.px(hx + 6, ey - 1, shade(ch.hair || ch.beard || '#1c1418', -0.1));
    s.px(hx + 7, ey - 1, shade(ch.hair || ch.beard || '#1c1418', -0.1));
  }
  // mouth
  if (pose.hurt) s.rect(hx + 6, hy + 8, 2, 1, '#6a1a1a');
  else if (pose.happy || pose.atk) s.rect(hx + 6, hy + 8, 3, 1, '#7a2020');
  else s.px(hx + 7, hy + 8, shade(ch.skin, -0.45));

  // ---- character-specific head gear ----
  if (ch.id === 'youssef') {
    s.rect(hx + 1, hy, 8, 3, ch.hair);
    s.rect(hx, hy + 1, 2, 4, ch.hair);
    s.px(hx + 8, hy + 3, ch.hair);
    // red cap worn backwards
    s.rect(hx + 1, hy - 1, 8, 3, '#d62828');
    s.rect(hx + 2, hy - 2, 6, 1, '#d62828');
    s.rect(hx + 2, hy - 1, 3, 1, '#f04a40');
    s.rect(hx - 2, hy + 1, 4, 1, '#a01c22'); // brim at the back
    s.px(hx + 5, hy - 1, '#1f8a3a');
  } else if (ch.id === 'salma') {
    s.rect(hx + 1, hy, 8, 2, ch.hair);
    s.rect(hx, hy + 1, 3, 5, ch.hair);
    s.rect(hx + 6, hy + 1, 3, 2, ch.hair);
    s.rect(hx + 1, hy + 1, 7, 1, ch.vest); // headband
    // ponytail
    const sw = (pose.bob ? 1 : 0) + (pose === POSES.run0 || pose === POSES.run2 ? 1 : 0);
    s.rect(hx - 2, hy + 1, 2, 2, '#f2c230');
    s.line(hx - 3, hy + 2, hx - 5 - sw, hy + 8 - sw, ch.hair, 2);
    s.px(hx - 6 - sw, hy + 9 - sw, ch.hair);
  } else if (ch.id === 'moha') {
    // white beard + moustache
    s.rect(hx + 3, hy + 7, 7, 3, ch.beard);
    s.rect(hx + 4, hy + 10, 5, 1, ch.beard);
    s.rect(hx + 6, hy + 7, 3, 1, shade(ch.beard, -0.1));
    s.rect(hx + 1, hy + 6, 2, 3, ch.beard);
    if (pose.hurt || pose.happy || pose.atk) s.rect(hx + 6, hy + 8, 3, 1, '#7a2020');
    s.px(hx + 6, ey - 1, ch.beard); s.px(hx + 7, ey - 1, ch.beard);
    // tarbouche (fez)
    s.poly([[hx + 1.5, hy + 1.5], [hx + 8.5, hy + 1.5], [hx + 7.5, hy - 3.5], [hx + 2.5, hy - 3.5]], ch.fez);
    s.rect(hx + 2, hy - 3, 2, 4, shade(ch.fez, 0.2));
    s.rect(hx + 7, hy - 3, 1, 4, shade(ch.fez, -0.25));
    s.rect(hx + 1, hy + 1, 8, 1, shade(ch.fez, -0.3));
    s.line(hx + 5, hy - 4, hx + 1, hy - 1, '#111018', 1); // tassel
    s.px(hx + 1, hy, '#111018'); s.px(hx, hy + 1, '#111018');
  } else if (ch.id === 'amghar') {
    const cl = ch.cloth, cl2 = shade(cl, 0.25);
    s.ellipse(hx + 4.5, hy + 4, 5.5, 5, cl);
    s.rect(hx, hy + 6, 10, 4, cl);
    s.rect(hx + 1, hy - 1, 7, 2, cl2);
    s.rect(hx + 3, hy + 3, 7, 3, ch.skin); // eye slit
    s.rect(hx + 6, hy + 3, 2, 3, '#ffffff');
    s.rect(hx + 7, hy + 4, 1, 2, SKIN_EYE);
    if (pose.hurt) { s.rect(hx + 6, hy + 3, 3, 3, ch.skin); s.px(hx + 6, hy + 4, SKIN_EYE); s.px(hx + 8, hy + 4, SKIN_EYE); s.px(hx + 7, hy + 5, SKIN_EYE); }
    s.rect(hx, hy + 6, 10, 1, cl2);
    // cloth tail flying
    const t = pose.bob ? 1 : 0;
    s.line(hx - 1, hy + 4, hx - 5, hy + 7 + t, cl, 2);
    s.px(hx - 6, hy + 8 + t, cl);
  }

  // ---- front arm + weapons ----
  if (ch.id === 'moha') {
    // cane
    if (pose.atk === 1) { // swing forward
      const tx = shX + pose.fa[0], ty = shY + pose.fa[1];
      s.line(tx, ty, tx + 12, ty + 1, '#7a4a22', 2);
      s.rect(tx + 12, ty - 2, 2, 3, '#7a4a22');
    } else if (pose.atk === 2) {
      const tx = shX + pose.fa[0], ty = shY + pose.fa[1];
      s.line(tx, ty, tx - 3, ty - 10, '#7a4a22', 2);
    } else {
      const tx = shX + pose.fa[0] + 3, ty = shY + pose.fa[1];
      s.line(tx, ty - 1, tx + 1, G - 1 - lift, '#7a4a22', 1);
      s.rect(tx - 1, ty - 2, 3, 1, '#7a4a22');
    }
  }
  if (ch.id === 'amghar' && pose.atk) {
    const tx = shX + pose.fa[0], ty = shY + pose.fa[1];
    s.line(tx, ty, tx + 11, ty - 2, ch.metal, 1);
    s.line(tx + 1, ty + 1, tx + 11, ty - 1, '#a0a0b8', 1);
    s.rect(tx - 1, ty - 2, 1, 5, '#c8a040');
  }
  drawArm(pose.fa, false);
  s.outline(0.3);
  return s.canvas();
}

const CHAR_SPR = {}; // CHAR_SPR[id][big?'big':'small'][frame]
function buildCharSprites() {
  for (const ch of CHARS) {
    CHAR_SPR[ch.id] = { small: {}, big: {} };
    for (const fn of FRAME_NAMES) {
      CHAR_SPR[ch.id].small[fn] = genChar(ch, POSES[fn], false);
      CHAR_SPR[ch.id].big[fn] = genChar(ch, POSES[fn], true);
    }
  }
}
