// Chip sounds, synthesised with Web Audio, plus one sample: the hover tick.
//   on():  chip lands, pins rattle in the socket, then the circuit powers up
//   off(): latch click, then the circuit powers down

const CircuitAudio = (() => {
  let ctx = null;
  let out = null;
  let noise = null;
  let hover = null;

  // Hover sprite: single keystrokes SLOT seconds apart (tools/hover-sprite.py).
  const HOVER_URL = 'sounds/hover.wav';
  const HOVER_SLOT = 0.2;
  const HOVER_LEN = 0.15;

  // Created lazily from the first chip click (browsers need a gesture).
  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    out = ctx.createGain();
    out.gain.value = 0.55;
    out.connect(comp).connect(ctx.destination);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    fetch(HOVER_URL)
      .then((r) => r.arrayBuffer())
      .then((b) => ctx.decodeAudioData(b))
      .then((buf) => { hover = buf; })
      .catch(() => {});
  }

  // One keystroke from the sprite, picked at random and slightly retuned so
  // no two hovers sound quite the same. Falls back to the synth jiggle.
  function tick(t) {
    if (!hover) return jiggle(t);
    const slots = Math.floor(hover.duration / HOVER_SLOT);
    const src = ctx.createBufferSource();
    src.buffer = hover;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const g = ctx.createGain();
    g.gain.value = 0.4;
    src.connect(g).connect(out);
    src.start(t, Math.floor(Math.random() * slots) * HOVER_SLOT, HOVER_LEN);
  }

  function envelope(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  // Filtered noise transient: ticks, clicks, thunks.
  function burst(t, { freq, q = 1, type = 'bandpass', peak, decay }) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    envelope(g, t, peak, 0.001, decay);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 0.8);
    src.stop(t + decay + 0.05);
  }

  // Oscillator with optional pitch glide and a sweeping lowpass.
  function tone(t, { type = 'sine', from, to = from, peak, attack = 0.004, decay, glide = decay, filter }) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    if (to !== from) o.frequency.exponentialRampToValueAtTime(to, t + glide);
    const g = ctx.createGain();
    envelope(g, t, peak, attack, decay);
    let node = o;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.Q.value = filter.q ?? 1;
      f.frequency.setValueAtTime(filter.from, t);
      f.frequency.exponentialRampToValueAtTime(filter.to, t + attack + decay);
      node.connect(f);
      node = f;
    }
    node.connect(g).connect(out);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
  }

  // A dull thunk as the body lands, then the pins skitter and settle.
  function rattle(t) {
    burst(t, { freq: 700, type: 'lowpass', q: 0.8, peak: 0.5, decay: 0.05 });
    tone(t, { from: 170, to: 80, peak: 0.3, decay: 0.07 });
    let at = t + 0.03;
    let amp = 0.5;
    for (let i = 0; i < 7; i++) {
      burst(at, { freq: 2600 + Math.random() * 2600, q: 6, peak: amp, decay: 0.012 + Math.random() * 0.01 });
      tone(at, { type: 'triangle', from: 2200 + Math.random() * 1500, peak: amp * 0.25, decay: 0.018 });
      at += 0.014 + Math.random() * 0.026;
      amp *= 0.76;
    }
  }

  // A light plastic jiggle: the hovering chip's legs ticking against each
  // other. Low and chunky, quieter and shorter than the landing rattle.
  // Only heard if the hover sprite hasn't loaded.
  function jiggle(t) {
    let at = t;
    let amp = 0.16;
    const ticks = 4 + Math.floor(Math.random() * 2);
    for (let i = 0; i < ticks; i++) {
      burst(at, { freq: 650 + Math.random() * 550, q: 5, peak: amp * 1.2, decay: 0.012 + Math.random() * 0.006 });
      tone(at, { type: 'triangle', from: 260 + Math.random() * 220, peak: amp * 0.45, decay: 0.022 });
      at += 0.018 + Math.random() * 0.024;
      amp *= 0.72;
    }
  }

  // Not used yet. Modelled on a knife dropped on cement (Soundsnap "Foley
  // knife drop on cement 01", analysed for timing and pitch, no audio used),
  // but it came out sounding like a glass bottle rattling on tarmac, so it's
  // kept for when the site needs exactly that. A hard first impact, a bounce
  // at ~0.2s about a third as loud, then faint settling ticks. Each hit is a click of noise plus three short metallic ring modes
  // near 3.5, 5.7 and 9.3 kHz. Timing and pitch wobble a little per play.
  const BOTTLE_HITS = [
    // [seconds, relative level, ring decay in seconds]
    [0.000, 1.00, 0.070],
    [0.085, 0.10, 0.020],
    [0.200, 0.12, 0.025],
    [0.220, 0.35, 0.030],
    [0.300, 0.10, 0.025],
    [0.320, 0.16, 0.018],
    [0.360, 0.09, 0.025],
    [0.400, 0.07, 0.020],
  ];
  const BOTTLE_MODES = [[3500, 1.0], [5700, 0.7], [9300, 0.55]];

  function bottle(t) {
    const stretch = 0.9 + Math.random() * 0.2;
    const detune = 0.97 + Math.random() * 0.06;
    for (const [at, level, ring] of BOTTLE_HITS) {
      const when = t + at * stretch + (at ? (Math.random() - 0.5) * 0.01 : 0);
      const amp = 0.22 * level * (0.8 + Math.random() * 0.4);
      burst(when, { freq: 4500, q: 0.7, peak: amp * 0.8, decay: 0.006 });
      for (const [f, w] of BOTTLE_MODES) {
        tone(when, { from: f * detune * (0.99 + Math.random() * 0.02), peak: amp * w * 0.5,
                     attack: 0.001, decay: ring * (0.8 + Math.random() * 0.4) });
      }
    }
  }

  // Rising filtered sweep over a mains hum, capped with a two-note confirm blip.
  function activate(t) {
    tone(t, { type: 'square', from: 180, to: 880, peak: 0.09, attack: 0.01, decay: 0.22, glide: 0.18,
              filter: { from: 600, to: 4000, q: 4 } });
    tone(t, { type: 'sawtooth', from: 55, to: 110, peak: 0.05, attack: 0.05, decay: 0.45,
              filter: { from: 200, to: 500 } });
    tone(t + 0.17, { from: 1318.5, peak: 0.16, decay: 0.08 });
    tone(t + 0.25, { from: 1975.5, peak: 0.13, decay: 0.22 });
  }

  // Latch release: a sharp tick and a smaller echo as the chip lifts.
  function click(t) {
    burst(t, { freq: 3500, q: 1.5, peak: 0.7, decay: 0.008 });
    tone(t, { type: 'triangle', from: 1400, to: 500, peak: 0.25, decay: 0.03 });
    burst(t + 0.045, { freq: 2200, q: 2, peak: 0.3, decay: 0.01 });
  }

  // The activation in reverse: falling sweep, lowpass closing, last spark.
  function deactivate(t) {
    tone(t, { type: 'square', from: 880, to: 70, peak: 0.08, attack: 0.005, decay: 0.45, glide: 0.4,
              filter: { from: 3500, to: 150, q: 3 } });
    tone(t, { from: 660, to: 55, peak: 0.1, decay: 0.5, glide: 0.45 });
    burst(t + 0.42, { freq: 1200, q: 3, peak: 0.12, decay: 0.01 });
  }

  // One keystroke: a bright plastic tick on a short low thock. Spaces are the
  // bigger, duller bar. Fired per letter, fast enough to blur into a printer.
  function key(t, ch) {
    const space = ch === ' ';
    burst(t, { freq: space ? 900 : 2200 + Math.random() * 2000, q: 1.2,
               peak: space ? 0.22 : 0.25 + Math.random() * 0.15, decay: 0.012 });
    tone(t, { type: 'triangle', from: space ? 140 : 200 + Math.random() * 140, to: 90,
              peak: space ? 0.16 : 0.08, decay: 0.025 });
  }

  // Liquid being sucked through a straw: a resonant noise band sweeping down
  // under a falling whistle, then a pop as it lands in the button.
  // Reversed (the intro spilling back out), the sweeps rise and the pop leads.
  function slurp(t, reverse) {
    const dur = 0.6;
    const [hi, lo] = [2600, 260];
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 5;
    f.frequency.setValueAtTime(reverse ? lo : hi, t);
    f.frequency.exponentialRampToValueAtTime(reverse ? hi : lo, t + dur);
    const g = ctx.createGain();
    envelope(g, t, 0.45, 0.08, dur - 0.08);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 0.3);
    src.stop(t + dur + 0.05);
    tone(t, { from: reverse ? 140 : 700, to: reverse ? 700 : 140, peak: 0.06, attack: 0.05, decay: dur - 0.05 });
    tone(reverse ? t : t + dur, { from: 1100, to: 1700, peak: 0.12, decay: 0.06 });
  }

  return {
    // Mouse over an unseated chip. Silent until the power button has run.
    jiggle() {
      if (!ctx) return;
      tick(ctx.currentTime);
    },
    slurp(reverse = false) {
      if (!ctx) return;
      slurp(ctx.currentTime, reverse);
    },
    // The power button: unlocks audio and plays the activation sweep.
    boot() {
      init();
      activate(ctx.currentTime + 0.02);
    },
    key(ch) {
      if (!ctx) return;
      key(ctx.currentTime, ch);
    },
    // land/live are seconds from now, matched to the chip's drop animation.
    on({ land, live }) {
      init();
      const t = ctx.currentTime;
      rattle(t + land);
      activate(t + live);
    },
    off() {
      init();
      const t = ctx.currentTime;
      click(t);
      deactivate(t + 0.06);
    },
  };
})();
