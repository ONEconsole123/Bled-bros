// ============================================================
// Game controller + main loop
// ============================================================
const Game = {
  scene: null, level: null,
  set(s) { this.scene = s; s.enter && s.enter(); },
  onBack() { if (this.scene && this.scene.onBack) this.scene.onBack(); },
  onHide() { if (this.scene === PlayScene) PlayScene.pause(); },
  startLevel(index, cp, fresh) {
    if (fresh) { RUN.coins = RUN.coins || 0; }
    LivesScene.index = index; LivesScene.cp = cp;
    this.set(LivesScene);
  },
  onPlayerDied(L) {
    SAVE.lives--; RUN.big = false;
    writeSave();
    if (SAVE.lives <= 0) { this.set(GameOverScene); return; }
    this.startLevel(L.index, L.cpIndex >= 0 ? L.cpIndex : null);
  },
  onLevelClear(L) {
    const i = L.index;
    const firstClear = !SAVE.cleared[i];
    SAVE.cleared[i] = true;
    SAVE.unlocked = Math.max(SAVE.unlocked, Math.min(i + 1, LEVELS.length - 1));
    const levelScore = RUN.score - L.startScore;
    ResultsScene.levelScore = levelScore;
    ResultsScene.newRecord = !SAVE.best[i] || levelScore > SAVE.best[i];
    if (ResultsScene.newRecord) SAVE.best[i] = levelScore;
    writeSave();
    MapScene.sel = Math.min(i + 1, LEVELS.length - 1);
    if (L.def.boss === 'kandicha') { this.set(EndingScene); return; }
    ResultsScene.index = i;
    ResultsScene.worldClear = L.def.boss && firstClear ? L.def.world : null;
    WorldClearScene.world = L.def.world;
    this.set(ResultsScene);
  },
};

function boot() {
  loadSave();
  buildCharSprites();
  buildEnemySprites();
  buildItemSprites();
  buildBossSprites();
  resize();
  Game.set(BootScene);
  let last = performance.now(), acc = 0;
  const STEP = 1000 / 60;
  function frame(now) {
    acc += Math.min(100, now - last);
    last = now;
    let steps = 0;
    while (acc >= STEP && steps < 4) {
      Input.update();
      try { Game.scene.update(); } catch (e) { console.error(e); }
      Input.endFrame();
      acc -= STEP; steps++;
    }
    Audio.tick();
    try { Game.scene.draw(); } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
// expose a tiny debug/testing hook
window.BLED = { Game, LEVELS, Audio, get SAVE() { return SAVE; }, RUN, Input, startLevel: (i) => { Game.level = new Level(i, null); Game.set(PlayScene); } };
boot();
