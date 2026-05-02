/* ============================================================
   portfolio.js — intro sequence, rendering, dossier, easter eggs
   ============================================================ */

(function () {

  // ============================================================
  // INTRO SEQUENCE
  // ============================================================
  const introLines = [
    '> initialising session...',
    '> resolving identity: jasonuithol@github',
    '> 21 repositories detected across 3 clusters',
    '> the matrix has you...',
    ''
  ];

  const terminal = document.getElementById('intro-terminal');
  const pillChoice = document.getElementById('pill-choice');
  const skipBtn = document.getElementById('skip-intro');

  let introTyping = true;
  let typeIntervalId = null;

  function typeIntro() {
    let lineIdx = 0;
    let charIdx = 0;
    let buffer = '';

    function tick() {
      if (!introTyping) return;
      if (lineIdx >= introLines.length) {
        terminal.innerHTML = buffer + '<span class="cursor"></span>';
        revealPills();
        return;
      }
      const currentLine = introLines[lineIdx];
      if (charIdx < currentLine.length) {
        buffer += currentLine[charIdx];
        charIdx++;
        terminal.innerHTML = buffer + '<span class="cursor"></span>';
        typeIntervalId = setTimeout(tick, 30 + Math.random() * 40);
      } else {
        buffer += '\n';
        lineIdx++;
        charIdx = 0;
        typeIntervalId = setTimeout(tick, 350);
      }
    }
    tick();
  }

  function revealPills() {
    setTimeout(() => pillChoice.classList.add('visible'), 200);
  }

  function dismissIntro(mode) {
    introTyping = false;
    clearTimeout(typeIntervalId);
    if (mode === 'red' && window.matrixRain) {
      window.matrixRain.burst();
    }
    document.getElementById('intro').classList.add('fading');
    document.body.dataset.mode = mode;
    setTimeout(() => {
      document.getElementById('intro').style.display = 'none';
      document.getElementById('portfolio').classList.add('visible');
    }, 1200);
  }

  document.getElementById('pill-red').addEventListener('click', () => dismissIntro('red'));
  document.getElementById('pill-blue').addEventListener('click', () => dismissIntro('blue'));
  skipBtn.addEventListener('click', () => dismissIntro('blue'));

  typeIntro();

  // ============================================================
  // RENDER PORTFOLIO
  // ============================================================
  const data = window.PORTFOLIO_DATA || PORTFOLIO_DATA;

  // header
  document.querySelectorAll('.site-handle').forEach(el => el.textContent = data.identity.handle);
  document.getElementById('site-tagline').textContent = data.identity.tagline;
  document.getElementById('site-github-link').href = data.identity.githubUrl;

  // helper: emit a span pair that swaps based on body[data-mode]
  function modeText(red, blue) {
    return `<span class="t-red">${escapeHtml(red)}</span><span class="t-blue">${escapeHtml(blue)}</span>`;
  }

  // pastel trim palette for blue-mode cards — a wide spread across the
  // pastel spectrum so adjacent cards always feel distinct.
  const PASTEL_TRIMS = [
    '#c8d8b5', // soft sage
    '#e8b8b0', // dusty rose
    '#e8d4a0', // pale honey
    '#b8d4e0', // soft sky
    '#d4c0e0', // lavender
    '#f2c8a8', // peach
    '#b8e0d2', // mint
    '#f0e2a8', // butter
    '#e8a890', // terracotta
    '#c0d4e8', // powder blue
    '#d8c8e0', // pale lilac
    '#d2e0b8', // pistachio
  ];
  let _cardIdx = 0;

  // clusters + cards
  const clusterRoot = document.getElementById('clusters');
  data.clusters.forEach(cluster => {
    const section = document.createElement('section');
    section.className = 'cluster';
    section.id = 'cluster-' + cluster.id;

    section.innerHTML = `
      <div class="cluster-header">
        <span class="cluster-glyph">${cluster.glyph}</span>
        <h2 class="cluster-name">${cluster.name}</h2>
        <span class="cluster-count">${modeText(cluster.repos.length + ' repos', cluster.repos.length + ' little projects')}</span>
        <p class="cluster-description">${cluster.description}</p>
      </div>
      <div class="cluster-grid"></div>
    `;
    const grid = section.querySelector('.cluster-grid');

    cluster.repos.forEach(repo => {
      const card = document.createElement('article');
      card.className = 'repo-card';
      card.style.setProperty('--card-trim', PASTEL_TRIMS[_cardIdx++ % PASTEL_TRIMS.length]);
      card.innerHTML = `
        <div class="repo-card-content">
          <h3 class="repo-name">${escapeHtml(repo.name)}</h3>
          <p class="repo-desc">${escapeHtml(repo.description)}</p>
          <div class="repo-meta">
            <span class="repo-lang">${escapeHtml(repo.language || 'misc')}</span>
            <span class="repo-action">${modeText('[OPEN_DOSSIER]', 'peek inside →')}</span>
          </div>
        </div>
      `;

      // hover effect: matrix glitch in red, banjo pluck in blue
      const nameEl = card.querySelector('.repo-name');
      let glitchTimer;
      card.addEventListener('mouseenter', () => {
        clearTimeout(glitchTimer);
        if (document.body.dataset.mode === 'blue') {
          _bluePluckTrigger(card);
        } else if (window.glitchText) {
          window.glitchText(nameEl, repo.name, 350);
        }
      });
      card.addEventListener('mouseleave', () => {
        if (document.body.dataset.mode === 'blue') {
          _bluePluckCancel(card);
        }
      });

      card.addEventListener('click', () => openDossier(repo));
      grid.appendChild(card);
    });

    clusterRoot.appendChild(section);
  });

  // ============================================================
  // DOSSIER MODAL
  // ============================================================
  const dossier = document.getElementById('dossier');
  const dossierBody = document.getElementById('dossier-body');
  const dossierTitle = document.getElementById('dossier-title');

  function openDossier(repo) {
    const githubUrl = `https://github.com/${data.identity.handle}/${repo.name}`;
    dossierTitle.querySelector('.dossier-title-name').textContent = `${repo.name} — `;

    dossierBody.innerHTML = `
      <h2 class="dossier-name">${escapeHtml(repo.name)}</h2>
      <div class="dossier-tags">
        <span class="dossier-tag lang">${escapeHtml(repo.language || 'misc')}</span>
        <span class="dossier-tag">${modeText('PUBLIC', 'freely shared')}</span>
      </div>

      <div class="dossier-section">
        <h3>${modeText('SUMMARY', 'the gist')}</h3>
        <p class="dossier-desc">${escapeHtml(repo.longDesc || repo.description)}</p>
      </div>

      <div class="dossier-actions">
        <a class="dossier-link" href="${githubUrl}" target="_blank" rel="noopener">
          ${modeText('→ VIEW_ON_GITHUB', 'find it on github →')}
        </a>
      </div>
    `;

    dossier.classList.add('open');
  }

  function closeDossier() {
    dossier.classList.remove('open');
  }
  document.getElementById('dossier-close').addEventListener('click', closeDossier);
  dossier.addEventListener('click', e => { if (e.target === dossier) closeDossier(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && dossier.classList.contains('open')) closeDossier();
  });

  // ============================================================
  // BANJO STRUM (modal/additive synthesis) — blue-mode hover sound
  // ============================================================
  // Banjos sound nothing like a clean plucked string (= harpsichord). The
  // signature comes from: (1) inharmonic partials — stiff strings sharpen
  // upper harmonics; (2) very fast decay of high partials so brightness
  // collapses within ~80ms; (3) a separate inharmonic drumhead voice;
  // (4) percussive pick-noise transient.

  // Diatonic major chords in G major: only the I (G), IV (C), V (D) degrees
  // produce major triads inside the scale. Picking roots from these means every
  // strum stays in-key — no random accidentals from B major / E major / etc.
  const BANJO_ROOTS = [
    196.00,  // G3
    261.63,  // C4
    293.66,  // D4
    392.00,  // G4
    523.25,  // C5
  ];
  const MAJOR_THIRD   = Math.pow(2, 4 / 12);
  const PERFECT_FIFTH = Math.pow(2, 7 / 12);

  // String partials: [freq-multiplier, peak gain, decay-rate (1/s)].
  // Multipliers >1 are deliberately sharpened (1.00, 2.02, 3.05...) to model
  // string stiffness — this is the ear-cue that says "metal/plastic", not "wood".
  // Higher partials decay much faster -> the bright "shimmer drop" of a banjo.
  const STRING_PARTIALS = [
    [1.00, 0.45,  6],
    [2.02, 0.32, 12],
    [3.05, 0.24, 20],
    [4.10, 0.16, 32],
    [5.18, 0.10, 48],
    [6.30, 0.06, 70],
  ];

  // Drumhead modes: inharmonic, low, very fast decay. One set per chord (not per string).
  const HEAD_MODES = [[185, 0.55, 28], [285, 0.35, 42], [430, 0.22, 65]];

  let _audioCtx = null;
  let _shaperCurve = null;
  let _busyUntil = 0; // audioCtx.currentTime past which a new strum is allowed
  let _pendingCard = null;
  let _pendingTimer = null;

  function _initBanjo() {
    if (_audioCtx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    _audioCtx = new Ctx();
  }

  // Asymmetric soft-clip: cheap-construction nonlinearity. The DC offset before
  // tanh shifts the operating point off-center, producing both odd AND even
  // harmonics — the "nasal/honky" coloration of a thin bridge flexing.
  function _getShaperCurve() {
    if (_shaperCurve) return _shaperCurve;
    const n = 1024, k = 2.2, off = 0.10;
    const c = new Float32Array(n);
    const norm = Math.tanh(k);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      c[i] = (Math.tanh(k * (x + off)) - Math.tanh(k * off)) / norm;
    }
    _shaperCurve = c;
    return _shaperCurve;
  }

  // Schedule one sine partial with exponential decay envelope.
  function _scheduleSine(ctx, freq, gainAmp, decayRate, t0, output) {
    const dur = Math.min(0.6, Math.max(0.06, 5 / decayRate));
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gainAmp, t0 + 0.002); // 2ms attack
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(env).connect(output);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // Brief bright noise burst — the actual physical sound of finger/pick
  // crossing the string before the string takes over. Per-string.
  function _schedulePickNoise(ctx, t0, output) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 0.035);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-(i / sr) * 110);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = 0.55;
    src.connect(bp).connect(g).connect(output);
    src.start(t0);
  }

  function _scheduleString(ctx, freq, t0, output) {
    STRING_PARTIALS.forEach(([mult, g, decay]) => {
      _scheduleSine(ctx, freq * mult, g, decay, t0, output);
    });
    _schedulePickNoise(ctx, t0, output);
  }

  function _scheduleDrumhead(ctx, t0, output) {
    HEAD_MODES.forEach(([f, g, decay]) => {
      _scheduleSine(ctx, f, g, decay, t0, output);
    });
  }

  // 1-, 2-, 3-, or 4-string strum chosen at random.
  // All voicings stay diatonic in G major:
  //   1 = root only
  //   2 = root + 5th (open fifth, very banjo)
  //   3 = full major triad
  //   4 = triad + octave root
  const VOICINGS = [
    [1],
    [1, PERFECT_FIFTH],
    [1, MAJOR_THIRD, PERFECT_FIFTH],
    [1, MAJOR_THIRD, PERFECT_FIFTH, 2],
  ];

  // Schedule one strum (chord) at startTime through the given output bus.
  function _scheduleStrum(root, voicing, startTime, output) {
    const chord = voicing.map(m => root * m);
    _scheduleDrumhead(_audioCtx, startTime, output);

    // Stagger depends on what the voicing represents:
    //   2 notes  = two distinct plucks (wide gap, 110-170ms)
    //   4 notes  = one hard fast strum across all strings (6-12ms)
    //   3 notes  = standard bluegrass strum (10-45ms)
    // Plus tiny per-string jitter for human feel.
    const baseStagger =
      chord.length === 2 ? 0.110 + Math.random() * 0.060 :
      chord.length === 4 ? 0.003 + Math.random() * 0.004 :
                           0.010 + Math.random() * 0.035;
    let t = startTime;
    chord.forEach(f => {
      _scheduleString(_audioCtx, f, t, output);
      const jitter = (Math.random() - 0.5) * 0.006;
      t += baseStagger + jitter;
    });
  }

  // Returns true if a strum was actually scheduled, false if blocked.
  function playBanjoChord() {
    _initBanjo();
    if (!_audioCtx) return false;
    if (_audioCtx.state === 'suspended') _audioCtx.resume();

    // Block new strums while one is still ringing — no overlapping cacophony.
    if (_audioCtx.currentTime < _busyUntil) return false;

    // Pick one root + voicing for the whole phrase — same chord, three strums,
    // so it sounds like a deliberate bluegrass figure rather than three
    // unrelated plucks.
    const root = BANJO_ROOTS[Math.floor(Math.random() * BANJO_ROOTS.length)];
    const voicing = VOICINGS[Math.floor(Math.random() * VOICINGS.length)];

    // Output chain: bus everything through the cheap-wood color stack.
    const body = _audioCtx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 360;
    body.Q.value = 8;
    body.gain.value = 5;

    const shaper = _audioCtx.createWaveShaper();
    shaper.curve = _getShaperCurve();
    shaper.oversample = '2x';

    const gain = _audioCtx.createGain();
    // 4-note voicings get a harder stroke — louder output for the big strum.
    gain.gain.value = voicing.length === 4 ? 0.27 : 0.18;

    body.connect(shaper).connect(gain).connect(_audioCtx.destination);

    const now = _audioCtx.currentTime;

    // worst-case ring-out per string ~0.6s (capped in _scheduleSine), plus
    // the gap between notes (matches the choices in _scheduleStrum).
    const maxGap =
      voicing.length === 2 ? 0.17 :
      voicing.length === 4 ? 0.007 :
                             0.045;
    const ringTail = 0.6 + (voicing.length - 1) * maxGap;
    let lastStrumStart;

    if (voicing.length === 3) {
      // strum — (pause) — strum — strum (bluegrass repeat figure)
      // longGap: rest between 1st and 2nd strum (~180-250ms)
      // shortGap: brief tag between 2nd and 3rd (~80-125ms)
      const longGap  = 0.18 + Math.random() * 0.07;
      const shortGap = 0.08 + Math.random() * 0.045;

      _scheduleStrum(root, voicing, now,                       body);
      _scheduleStrum(root, voicing, now + longGap,             body);
      _scheduleStrum(root, voicing, now + longGap + shortGap,  body);
      lastStrumStart = now + longGap + shortGap;
    } else {
      // 1 note = single pluck. 2 notes = two distinct plucks. 4 notes = one
      // hard fast strum across all strings. None get the bluegrass repeat.
      _scheduleStrum(root, voicing, now, body);
      lastStrumStart = now;
    }

    _busyUntil = lastStrumStart + ringTail;
    return true;
  }

  // Hover trigger: try to strum now. If blocked because another strum is
  // ringing, queue a single retry — but only fire it if the cursor is still
  // inside this same card when the busy period ends.
  function _bluePluckTrigger(card) {
    if (playBanjoChord()) {
      _pendingCard = null;
      clearTimeout(_pendingTimer);
      return;
    }
    _pendingCard = card;
    clearTimeout(_pendingTimer);
    const waitMs = Math.max(0, (_busyUntil - _audioCtx.currentTime) * 1000) + 15;
    _pendingTimer = setTimeout(() => {
      if (_pendingCard === card) {
        playBanjoChord();
        _pendingCard = null;
      }
    }, waitMs);
  }

  function _bluePluckCancel(card) {
    if (_pendingCard === card) {
      clearTimeout(_pendingTimer);
      _pendingCard = null;
    }
  }

  // ============================================================
  // EASTER EGGS
  // ============================================================

  // Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiPos = 0;
  document.addEventListener('keydown', e => {
    const expected = KONAMI[konamiPos];
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === expected) {
      konamiPos++;
      if (konamiPos === KONAMI.length) {
        triggerKungFu();
        konamiPos = 0;
      }
    } else {
      konamiPos = (key === KONAMI[0]) ? 1 : 0;
    }
  });

  function _kungFuText() {
    return document.body.dataset.mode === 'blue' ? '10x delivery unlocked.' : 'I know kung fu.';
  }

  function triggerKungFu() {
    const overlay = document.getElementById('kungfu-overlay');
    overlay.textContent = _kungFuText();
    overlay.classList.add('show');
    if (window.matrixRain) window.matrixRain.burst();
    setTimeout(() => {
      overlay.classList.remove('show');
    }, 2500);
  }

  // Type "follow_the_white_rabbit" anywhere -> scroll to a hidden marker
  let typedBuffer = '';
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key.length !== 1) return;
    typedBuffer = (typedBuffer + e.key.toLowerCase()).slice(-30);
    if (typedBuffer.endsWith('whoami')) {
      const overlay = document.getElementById('kungfu-overlay');
      overlay.textContent = 'easyCoder';
      overlay.classList.add('show');
      setTimeout(() => {
        overlay.classList.remove('show');
        overlay.textContent = _kungFuText();
      }, 2500);
    }
  });

  // ============================================================
  // MODE SWAP — toggle between red (matrix) and blue (pastel) modes
  // ============================================================
  const swapBtn = document.getElementById('mode-swap');
  if (swapBtn) {
    const rainCtl = _initSwapButtonRain(swapBtn);
    swapBtn.addEventListener('click', () => {
      const current = document.body.dataset.mode || 'red';
      document.body.dataset.mode = current === 'red' ? 'blue' : 'red';
      if (window.matrixRain && document.body.dataset.mode === 'red') {
        window.matrixRain.burst();
      }
      // Mode just flipped while cursor is still on the button — restart
      // the hover effect in the new direction so we don't render a frozen
      // halfway state until the mouse leaves.
      if (rainCtl && swapBtn.matches(':hover')) {
        rainCtl.stop();
        rainCtl.start();
      }
    });
  }

  // Mini matrix-rain inside the swap button — blue-mode hover only.
  // Starts in cottagecore palette, transitions to green-on-black over ~1s.
  function _initSwapButtonRain(btn) {
    const canvas = btn.querySelector('.mode-swap-rain');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const GLYPHS = (
      'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ' +
      '0123456789'
    ).split('');
    const SHUFFLE_CHARS = '!<>-_\\/[]{}=+*^?#01'.split('');
    const FLOWER_SHUFFLE = ['✿', '❀', '❁'];
    const FONT = 16;
    const FADE_MS = 1000;
    const SAGE        = [158, 197, 154];
    const MATRIX_GRN  = [  0, 255,  65];
    const CREAM       = [255, 252, 245];
    const NEAR_BLACK  = [  0,   5,   8];
    // Pastel palette for cottagecore-mode flower particles.
    const FLOWER_COLORS = [
      [158, 197, 154], // sage
      [232, 154, 160], // dusty rose
      [232, 200, 120], // honey
      [142, 192, 216], // sky
      [192, 160, 216]  // lavender
    ];

    let drops = [];
    let flowers = [];
    let cols = 0, rows = 0;
    let raf = 0;
    let startTime = 0;
    let active = false;
    // Per-hover direction state (set in start()):
    let glyphFrom, glyphTo, bgFrom, bgTo, activeLabel, origLabel;
    let isToMatrix = true;

    function resize() {
      const r = btn.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width));
      canvas.height = Math.max(1, Math.floor(r.height));
      if (isToMatrix) {
        cols = Math.max(1, Math.floor(canvas.width / FONT));
        rows = Math.max(1, Math.floor(canvas.height / FONT));
        // Multiple drops per column → dense "wall" of streams.
        drops = [];
        const PER_COL = 4;
        for (let i = 0; i < cols; i++) {
          for (let k = 0; k < PER_COL; k++) {
            drops.push({
              col: i,
              y: Math.random() * -rows * 3,
              ch: GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            });
          }
        }
      } else {
        // Cottagecore: a handful of flowers tumbling around.
        flowers = [];
        const N = 7;
        for (let i = 0; i < N; i++) {
          flowers.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.55,
            vy: (Math.random() - 0.5) * 0.40,
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - 0.5) * 0.06,
            color: FLOWER_COLORS[i % FLOWER_COLORS.length],
            size: 12 + Math.random() * 8,
            glyph: FLOWER_SHUFFLE[Math.floor(Math.random() * FLOWER_SHUFFLE.length)]
          });
        }
      }
    }

    function lerp(a, b, t) { return a + (b - a) * t; }
    function lc(c1, c2, t) {
      return [
        Math.round(lerp(c1[0], c2[0], t)),
        Math.round(lerp(c1[1], c2[1], t)),
        Math.round(lerp(c1[2], c2[2], t))
      ];
    }

    function tick(now) {
      if (!active) return;
      const t = Math.min(1, (now - startTime) / FADE_MS);
      const bg = lc(bgFrom, bgTo, t);
      // Trail alpha grows with t — early frames mostly transparent so
      // the button's CSS background shows through cleanly.
      const trailAlpha = lerp(0.12, 0.20, t);
      ctx.fillStyle = `rgba(${bg[0]},${bg[1]},${bg[2]},${trailAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isToMatrix) {
        const g = lc(glyphFrom, glyphTo, t);
        ctx.font = `${FONT}px "Share Tech Mono", monospace`;
        ctx.fillStyle = `rgb(${g[0]},${g[1]},${g[2]})`;
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          if (Math.random() < 0.01) {
            d.ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
          ctx.fillText(d.ch, d.col * FONT, d.y * FONT);
          if (d.y * FONT > canvas.height && Math.random() > 0.95) {
            d.y = -Math.random() * rows;
            d.ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
          d.y += 0.04;
        }
      } else {
        // Cottagecore: tumbling flowers. Color alpha ramps with t so
        // they fade in over the transition.
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const f of flowers) {
          f.x += f.vx;
          f.y += f.vy;
          f.rot += f.vrot;
          if (f.x < -20) f.x = canvas.width + 20;
          if (f.x > canvas.width + 20) f.x = -20;
          if (f.y < -20) f.y = canvas.height + 20;
          if (f.y > canvas.height + 20) f.y = -20;
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.rot);
          ctx.font = `${f.size}px "Plus Jakarta Sans", serif`;
          const a = 0.35 + 0.55 * t;
          ctx.fillStyle = `rgba(${f.color[0]},${f.color[1]},${f.color[2]},${a})`;
          ctx.fillText(f.glyph, 0, 0);
          ctx.restore();
        }
        // Reset alignment defaults for any other draws.
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      }

      // Glitch the label text — matrix direction only. The garden is mindful.
      if (isToMatrix && activeLabel) {
        let out = '';
        for (let j = 0; j < origLabel.length; j++) {
          const c = origLabel[j];
          if (c === ' ') { out += ' '; continue; }
          if (Math.random() < t * 0.85) {
            out += SHUFFLE_CHARS[Math.floor(Math.random() * SHUFFLE_CHARS.length)];
          } else {
            out += c;
          }
        }
        activeLabel.textContent = out;
      }
      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (active) return;
      const mode = document.body.dataset.mode || 'red';
      isToMatrix = (mode === 'blue');
      glyphFrom = isToMatrix ? SAGE       : MATRIX_GRN;
      glyphTo   = isToMatrix ? MATRIX_GRN : SAGE;
      bgFrom    = isToMatrix ? CREAM      : NEAR_BLACK;
      bgTo      = isToMatrix ? NEAR_BLACK : CREAM;
      activeLabel = btn.querySelector(isToMatrix ? '.t-blue' : '.t-red');
      origLabel = activeLabel ? activeLabel.textContent : '';
      resize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      active = true;
      startTime = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function stop() {
      active = false;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (activeLabel) activeLabel.textContent = origLabel;
    }

    btn.addEventListener('mouseenter', start);
    btn.addEventListener('mouseleave', stop);
    return { start, stop };
  }

  // ============================================================
  // UTILS
  // ============================================================
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
