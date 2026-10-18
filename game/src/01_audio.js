// ============================================================
// Audio — chiptune synth, maqam scales, gnaoua percussion, sfx
// ============================================================
const SCALES = {
  hijaz: [0, 1, 4, 5, 7, 8, 10],
  kurd: [0, 1, 3, 5, 7, 8, 10],
  ajam: [0, 2, 4, 5, 7, 9, 11],
  penta: [0, 2, 4, 7, 9],
  nahawand: [0, 2, 3, 5, 7, 8, 11],
};

// Each song: tracks with their own resolution (div = steps per beat).
// Tokens: '.' rest, '-' hold, degree 1..7 with '^' (octave up) / '_' (octave down) prefixes.
// Drum tokens: k = dum (darbuka low), t = tek, q = qraqeb (gnaoua castanets), x = k+q, s = snare-ish noise
const SONGS = {
  title: {
    bpm: 118, scale: 'hijaz', root: 62,
    tracks: [
      { inst: 'oud', div: 2, oct: 0, vol: 0.5, pat: '1 2 3 - 4 3 2 1 3 4 5 - 6 5 4 3 5 6 5 4 3 4 3 2 1 - - - _7 - 1 -' },
      { inst: 'flute', div: 2, oct: 1, vol: 0.18, pat: '. . . . . . . . . . . . . . . . 3 - - - 2 - - - 1 - - - - - - -' },
      { inst: 'bass', div: 1, oct: -2, vol: 0.5, pat: '1 5 1 5 1 5 4 5 1 5 4 3 1 5 1 -' },
      { inst: 'drums', div: 4, vol: 0.5, pat: 'k . q q t . q q k . q q t . q q' },
    ],
  },
  map: {
    bpm: 100, scale: 'ajam', root: 60,
    tracks: [
      { inst: 'flute', div: 2, oct: 0, vol: 0.32, pat: '1 . 3 . 5 . 3 . 4 . 6 . 5 - - - 3 . 5 . ^1 . 7 6 5 - - - - - . .' },
      { inst: 'bass', div: 1, oct: -2, vol: 0.45, pat: '1 - - - 4 - - - 5 - - - 1 - - -' },
      { inst: 'drums', div: 4, vol: 0.32, pat: 'k . . . t . . . k . k . t . . .' },
    ],
  },
  shop: {
    bpm: 116, scale: 'ajam', root: 62,
    tracks: [
      { inst: 'oud', div: 2, oct: 0, vol: 0.45, pat: '5 3 5 3 4 2 4 2 3 1 3 1 2 _7 2 . 5 3 5 3 4 2 4 2 3 2 1 _7 1 - . .' },
      { inst: 'bass', div: 2, oct: -2, vol: 0.45, pat: '1 . 5 . 4 . 5 .' },
      { inst: 'drums', div: 4, vol: 0.4, pat: 'k . q . t . q . k q q . t . q .' },
    ],
  },
  fes: {
    bpm: 136, scale: 'hijaz', root: 62,
    tracks: [
      { inst: 'lead', div: 2, oct: 0, vol: 0.3, pat: '5 . 5 4 3 4 5 . 6 5 4 3 2 . 1 . 3 4 5 6 ^1 . 7 6 5 . 4 3 2 1 2 . 1 . 3 . 4 5 4 3 2 3 4 3 2 1 _7 . 1 2 3 4 5 6 5 4 3 2 1 . 1 . . .' },
      { inst: 'guembri', div: 2, oct: -2, vol: 0.55, pat: '1 . 1 5 1 . 4 . 1 . 1 5 6 . 5 .' },
      { inst: 'drums', div: 4, vol: 0.5, pat: 'k . q q t q q . k k q q t q q q' },
    ],
  },
  chaouen: {
    bpm: 124, scale: 'penta', root: 67,
    tracks: [
      { inst: 'flute', div: 2, oct: 0, vol: 0.34, pat: '3 . 2 1 2 . 3 5 ^1 . 5 . 3 - - . 2 . 3 5 3 2 1 2 3 - - - . . . . 5 . 5 ^1 5 3 2 3 5 . 3 2 1 - _5 . _4 . 1 2 3 2 1 2 1 - - - . . . .' },
      { inst: 'oud', div: 2, oct: -1, vol: 0.3, pat: '1 . 3 . 4 . 3 . 1 . 3 . 5 . 4 .' },
      { inst: 'bass', div: 2, oct: -2, vol: 0.45, pat: '1 . 4 . 1 . 4 . 5 . 4 . 1 . 4 .' },
      { inst: 'drums', div: 4, vol: 0.4, pat: 'k . t . . t k . k . t . . t . t' },
    ],
  },
  desert: {
    bpm: 108, scale: 'hijaz', root: 64,
    tracks: [
      { inst: 'oud', div: 2, oct: 0, vol: 0.45, pat: '1 - 2 - 3 - - 2 3 4 3 2 1 - - - 5 - 4 - 3 - 4 5 6 - 5 - 4 3 2 . 1 2 3 4 5 - - - 6 5 4 5 6 - ^1 - 7 6 5 4 3 2 3 . 2 - - - 1 - - -' },
      { inst: 'bass', div: 2, oct: -2, vol: 0.4, pat: '1 - - - - - - - 1 - - - 5 - - -' },
      { inst: 'drums', div: 4, vol: 0.45, pat: 'k . t . . . t . k . . . t . s .' },
    ],
  },
  night: {
    bpm: 100, scale: 'kurd', root: 62,
    tracks: [
      { inst: 'lead', div: 2, oct: 0, vol: 0.22, pat: '1 . 2 . 3 . 2 . 1 . _7 . 1 - - - 3 . 4 . 5 . 4 . 3 . 2 . 3 - - - 5 . 6 . 5 4 3 4 5 . 4 3 2 - - - 1 2 3 2 1 _7 _6 _7 1 - - - - - - -' },
      { inst: 'flute', div: 1, oct: 1, vol: 0.12, pat: '5 - - - 4 - - - 3 - - - 2 - - -' },
      { inst: 'bass', div: 2, oct: -2, vol: 0.45, pat: '1 . . . 1 . . . 6 . . . 5 . . .' },
      { inst: 'drums', div: 4, vol: 0.4, pat: 'k . . q . q k . . q k . q . q .' },
    ],
  },
  boss: {
    bpm: 156, scale: 'hijaz', root: 62,
    tracks: [
      { inst: 'lead', div: 2, oct: 0, vol: 0.28, pat: '1 1 2 1 3 . 2 1 1 1 2 1 4 . 3 2 5 5 6 5 4 3 2 3 2 1 _7 1 2 . . .' },
      { inst: 'guembri', div: 2, oct: -2, vol: 0.6, pat: '1 ^1 1 ^1 1 ^1 2 ^2 1 ^1 1 ^1 5 ^5 4 ^4' },
      { inst: 'drums', div: 4, vol: 0.55, pat: 'k q t q k q t q k k t q k q t t' },
    ],
  },
  final: {
    bpm: 148, scale: 'kurd', root: 62,
    tracks: [
      { inst: 'lead', div: 2, oct: 0, vol: 0.28, pat: '1 . 1 2 3 . 2 1 _7 . _7 1 2 . 1 _7 _6 . _6 _7 1 . _7 _6 _5 . . . _5 _6 _7 . 1 . 3 . 5 . 4 3 2 . 4 . 6 . 5 4 3 2 1 2 3 4 5 6 5 - - - - - . .' },
      { inst: 'flute', div: 1, oct: 1, vol: 0.1, pat: '1 - - - _7 - - - _6 - - - _5 - - -' },
      { inst: 'guembri', div: 2, oct: -2, vol: 0.6, pat: '1 . 1 ^1 1 . 1 ^1 6 . 6 ^6 5 . 5 ^5' },
      { inst: 'drums', div: 4, vol: 0.55, pat: 'x . q t k q t q x . q t k t t q' },
    ],
  },
};
const JINGLES = {
  clear: { bpm: 150, scale: 'hijaz', root: 62, inst: 'lead', pat: '1 3 5 ^1 - - 5 ^1 - - ^3 - - - - -' },
  over: { bpm: 110, scale: 'kurd', root: 62, inst: 'lead', pat: '5 4 3 2 1 - _7 _6 _5 - - - - -' },
  boss: { bpm: 160, scale: 'hijaz', root: 62, inst: 'lead', pat: '1 1 1 3 5 - 5 - 4 3 4 5 ^1 - - - - - -' },
  life: { bpm: 220, scale: 'ajam', root: 74, inst: 'lead', pat: '3 5 ^3 ^1 ^2 ^5 - -' },
};

const Audio = {
  ac: null, master: null, music: null, sfx: null, noise: null,
  song: null, songName: null, nextT: 0, trackState: [],
  unlock() {
    if (!this.ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ac = new AC();
      this.master = this.ac.createGain();
      this.master.gain.value = SAVE.sound ? 0.7 : 0;
      this.master.connect(this.ac.destination);
      this.music = this.ac.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
      this.sfx = this.ac.createGain(); this.sfx.gain.value = 0.7; this.sfx.connect(this.master);
      const len = this.ac.sampleRate;
      this.noise = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.pendingSong) { const s = this.pendingSong; this.pendingSong = null; this.play(s); }
    }
    if (this.ac.state === 'suspended') this.ac.resume();
  },
  setSound(on) {
    SAVE.sound = on; writeSave();
    if (this.master) this.master.gain.setTargetAtTime(on ? 0.7 : 0, this.ac.currentTime, 0.05);
  },
  freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); },
  parse(pat) { return pat.trim().split(/\s+/); },
  degreeToMidi(tok, scale, root, oct) {
    let o = oct;
    let i = 0;
    while (tok[i] === '^' || tok[i] === '_') { o += tok[i] === '^' ? 1 : -1; i++; }
    const deg = parseInt(tok.slice(i), 10) - 1;
    const sc = SCALES[scale];
    const n = sc.length;
    const oo = Math.floor(deg / n);
    return root + (o + oo) * 12 + sc[((deg % n) + n) % n];
  },
  play(name) {
    if (this.songName === name) return;
    this.songName = name;
    if (!this.ac) { this.pendingSong = name; return; }
    const s = SONGS[name];
    if (!s) { this.song = null; return; }
    this.song = s;
    this.nextT = this.ac.currentTime + 0.05;
    this.trackState = s.tracks.map((t) => ({ toks: this.parse(t.pat), i: 0, t: this.nextT }));
  },
  stop() { this.song = null; this.songName = null; },
  // called every frame: schedules notes a little ahead
  tick() {
    if (!this.ac || !this.song) return;
    const s = this.song;
    const beat = 60 / s.bpm;
    const horizon = this.ac.currentTime + 0.15;
    s.tracks.forEach((tr, k) => {
      const st = this.trackState[k];
      const stepDur = beat / tr.div;
      if (st.t < this.ac.currentTime - 0.5) st.t = this.ac.currentTime; // recover after tab sleep
      while (st.t < horizon) {
        const tok = st.toks[st.i];
        if (tok !== '.' && tok !== '-') {
          let hold = 1;
          while (st.toks[(st.i + hold) % st.toks.length] === '-' && hold < st.toks.length) hold++;
          if (tr.inst === 'drums') this.drum(tok, st.t, tr.vol);
          else this.note(tr.inst, this.degreeToMidi(tok, s.scale, s.root, tr.oct), st.t, stepDur * hold, tr.vol);
        }
        st.i = (st.i + 1) % st.toks.length;
        st.t += stepDur;
      }
    });
  },
  jingle(name) {
    if (!this.ac) return;
    const j = JINGLES[name];
    const toks = this.parse(j.pat);
    const step = 60 / j.bpm / 2;
    let t = this.ac.currentTime + 0.03;
    toks.forEach((tok, i) => {
      if (tok !== '.' && tok !== '-') {
        let hold = 1;
        while (toks[i + hold] === '-') hold++;
        this.note(j.inst, this.degreeToMidi(tok, j.scale, j.root, 0), t, step * hold, 0.35, this.sfx);
        this.note('bass', this.degreeToMidi(tok, j.scale, j.root, -2), t, step * hold, 0.25, this.sfx);
      }
      t += step;
    });
  },
  env(g, t, a, peak, dur, rel) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * 0.6, t + a, dur * 0.4);
    g.gain.setTargetAtTime(0.0001, t + dur, rel);
  },
  note(inst, midi, t, dur, vol, dest) {
    const ac = this.ac;
    dest = dest || this.music;
    const f = this.freq(midi);
    const g = ac.createGain();
    g.connect(dest);
    const o = ac.createOscillator();
    let stopAt = t + dur + 0.4;
    if (inst === 'lead') {
      o.type = 'square';
      this.env(g, t, 0.006, vol * 0.5, dur * 0.9, 0.05);
      const lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = 5.5; lg.gain.value = 0; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + 0.25);
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(stopAt);
      o.connect(g);
    } else if (inst === 'oud') {
      o.type = 'sawtooth';
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(f * 7, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + 0.25);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 0.55, t + 0.004);
      g.gain.setTargetAtTime(0.0001, t + 0.01, Math.min(0.35, dur * 0.7));
      o.connect(lp); lp.connect(g);
      // little slide up into the note: very "oud"
      o.frequency.setValueAtTime(f * 0.985, t); o.frequency.linearRampToValueAtTime(f, t + 0.03);
    } else if (inst === 'flute') {
      o.type = 'triangle';
      this.env(g, t, 0.04, vol, dur * 0.95, 0.08);
      const lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = 5; lg.gain.value = f * 0.008; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(stopAt);
      o.connect(g);
    } else if (inst === 'guembri') {
      o.type = 'square';
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 4;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 0.6, t + 0.004);
      g.gain.setTargetAtTime(0.0001, t + 0.02, 0.09);
      o.connect(lp); lp.connect(g);
    } else { // bass
      o.type = 'triangle';
      this.env(g, t, 0.005, vol, dur * 0.85, 0.04);
      o.connect(g);
    }
    if (!o.frequency.value || inst !== 'oud') o.frequency.setValueAtTime(f, t);
    o.start(t); o.stop(stopAt);
  },
  noiseHit(t, vol, type, freq, q, decay, dest) {
    const ac = this.ac;
    const src = ac.createBufferSource(); src.buffer = this.noise;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(f); f.connect(g); g.connect(dest || this.music);
    src.start(t, Math.random() * 0.5); src.stop(t + decay + 0.02);
  },
  drum(tok, t, vol) {
    const ac = this.ac;
    if (tok === 'k' || tok === 'x') {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
      g.gain.setValueAtTime(vol * 0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.3);
    }
    if (tok === 't') this.noiseHit(t, vol * 0.35, 'highpass', 2500, 1, 0.05);
    if (tok === 's') this.noiseHit(t, vol * 0.3, 'bandpass', 1800, 0.8, 0.12);
    if (tok === 'q' || tok === 'x') {
      // qraqeb: metallic double click
      this.noiseHit(t, vol * 0.28, 'bandpass', 5200, 6, 0.03);
      this.noiseHit(t + 0.028, vol * 0.2, 'bandpass', 4300, 6, 0.03);
    }
  },
  // ---------------- sfx ----------------
  sweep(type, f0, f1, dur, vol, delay = 0) {
    if (!this.ac) return;
    const t = this.ac.currentTime + delay;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + dur + 0.02);
  },
  sfxPlay(name) {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    switch (name) {
      case 'jump': this.sweep('square', 300, 720, 0.14, 0.12); break;
      case 'djump': this.sweep('square', 500, 1100, 0.12, 0.1); break;
      case 'coin': this.sweep('square', 988, 988, 0.06, 0.1); this.sweep('square', 1319, 1319, 0.18, 0.1, 0.06); break;
      case 'stomp': this.sweep('square', 420, 90, 0.12, 0.18); this.noiseHit(t, 0.2, 'lowpass', 800, 1, 0.08, this.sfx); break;
      case 'bump': this.sweep('triangle', 160, 90, 0.08, 0.3); break;
      case 'break': this.noiseHit(t, 0.4, 'lowpass', 1400, 1, 0.25, this.sfx); this.sweep('square', 200, 60, 0.15, 0.1); break;
      case 'hurt': this.sweep('sawtooth', 600, 120, 0.35, 0.14); break;
      case 'die': this.sweep('square', 880, 110, 0.9, 0.14); break;
      case 'throw': this.sweep('triangle', 900, 300, 0.1, 0.2); this.noiseHit(t, 0.08, 'highpass', 3000, 1, 0.06, this.sfx); break;
      case 'slash': this.noiseHit(t, 0.3, 'bandpass', 3000, 2, 0.12, this.sfx); this.sweep('sawtooth', 1200, 400, 0.08, 0.06); break;
      case 'swing': this.noiseHit(t, 0.25, 'bandpass', 1200, 2, 0.14, this.sfx); break;
      case 'dash': this.noiseHit(t, 0.3, 'bandpass', 900, 1.5, 0.2, this.sfx); this.sweep('square', 200, 500, 0.12, 0.06); break;
      case 'power':
        [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.sweep('square', 523 * Math.pow(2, s / 12), 523 * Math.pow(2, s / 12), 0.07, 0.09, i * 0.05));
        break;
      case 'appear': this.sweep('square', 300, 900, 0.3, 0.08); break;
      case 'khamsa':
        [0, 7, 12, 7, 12, 19].forEach((s, i) => this.sweep('triangle', 660 * Math.pow(2, s / 12), 660 * Math.pow(2, s / 12), 0.08, 0.2, i * 0.06));
        break;
      case 'kill': this.sweep('square', 700, 200, 0.12, 0.12); break;
      case 'bosshit': this.sweep('sawtooth', 300, 60, 0.25, 0.2); this.noiseHit(t, 0.3, 'lowpass', 600, 1, 0.2, this.sfx); break;
      case 'boom': this.noiseHit(t, 0.6, 'lowpass', 500, 0.7, 0.8, this.sfx); this.sweep('sine', 120, 30, 0.7, 0.4); break;
      case 'select': this.sweep('square', 660, 660, 0.05, 0.08); break;
      case 'confirm': this.sweep('square', 660, 660, 0.05, 0.08); this.sweep('square', 990, 990, 0.1, 0.08, 0.06); break;
      case 'pause': this.sweep('square', 500, 500, 0.06, 0.08); this.sweep('square', 375, 375, 0.06, 0.08, 0.08); break;
      case 'door': this.sweep('triangle', 120, 240, 0.4, 0.3); this.noiseHit(t, 0.15, 'lowpass', 500, 1, 0.4, this.sfx); break;
      case 'potion': this.noiseHit(t, 0.25, 'highpass', 2000, 1, 0.2, this.sfx); this.sweep('sine', 1500, 400, 0.2, 0.1); break;
      case 'fire': this.noiseHit(t, 0.3, 'bandpass', 700, 0.8, 0.35, this.sfx); break;
      case 'shock': this.sweep('sawtooth', 90, 40, 0.5, 0.3); this.noiseHit(t, 0.5, 'lowpass', 300, 0.7, 0.5, this.sfx); break;
      case 'laugh':
        [0, 1, 2, 3].forEach((i) => this.sweep('square', 700 - i * 60, 500 - i * 60, 0.09, 0.07, i * 0.12));
        break;
      case 'checkpoint': [0, 5, 9].forEach((s, i) => this.sweep('triangle', 784 * Math.pow(2, s / 12), 784 * Math.pow(2, s / 12), 0.1, 0.2, i * 0.07)); break;
      case 'buy': this.sfxPlay('coin'); this.sweep('square', 1568, 1568, 0.15, 0.08, 0.15); break;
      case 'nope': this.sweep('square', 200, 150, 0.2, 0.12); break;
      case 'text': this.sweep('square', 880 + Math.random() * 200, 880, 0.02, 0.03); break;
    }
  },
};
