// Chip sounds, synthesised with Web Audio — no sample files.
//   on():  chip lands, pins rattle in the socket, then the circuit powers up
//   off(): latch click, then the circuit powers down

const CircuitAudio = (() => {
  let ctx = null;
  let out = null;
  let noise = null;

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

  return {
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
