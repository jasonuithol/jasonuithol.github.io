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
          playBanjoChord();
        } else if (window.glitchText) {
          window.glitchText(nameEl, repo.name, 350);
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

  function playBanjoChord() {
    _initBanjo();
    if (!_audioCtx) return;
    if (_audioCtx.state === 'suspended') _audioCtx.resume();

    const root = BANJO_ROOTS[Math.floor(Math.random() * BANJO_ROOTS.length)];

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
    const voicing = VOICINGS[Math.floor(Math.random() * VOICINGS.length)];
    const chord = voicing.map(m => root * m);

    // Output chain: bus everything through the cheap-wood color stack.
    // body resonance — the woody "honk" peak around 360Hz (small wood shell)
    const body = _audioCtx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 360;
    body.Q.value = 8;
    body.gain.value = 5;

    // soft saturation = "twack" — generates harmonics not in the source
    const shaper = _audioCtx.createWaveShaper();
    shaper.curve = _getShaperCurve();
    shaper.oversample = '2x';

    const gain = _audioCtx.createGain();
    gain.gain.value = 0.18;

    body.connect(shaper).connect(gain).connect(_audioCtx.destination);

    const now = _audioCtx.currentTime;

    // Drumhead fires once at strum start (it's a single instrument).
    _scheduleDrumhead(_audioCtx, now, body);

    // Per-strum stagger varies 10-45ms — a fast frantic flick vs. a lazy
    // drag across the strings. Plus tiny per-string jitter for human feel.
    const baseStagger = 0.010 + Math.random() * 0.035;
    let t = now;
    chord.forEach((f, i) => {
      _scheduleString(_audioCtx, f, t, body);
      const jitter = (Math.random() - 0.5) * 0.006;
      t += baseStagger + jitter;
    });
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

  function triggerKungFu() {
    const overlay = document.getElementById('kungfu-overlay');
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
        overlay.textContent = 'I know kung fu.';
      }, 2500);
    }
  });

  // ============================================================
  // MODE SWAP — toggle between red (matrix) and blue (pastel) modes
  // ============================================================
  const swapBtn = document.getElementById('mode-swap');
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      const current = document.body.dataset.mode || 'red';
      document.body.dataset.mode = current === 'red' ? 'blue' : 'red';
      if (window.matrixRain && document.body.dataset.mode === 'red') {
        window.matrixRain.burst();
      }
    });
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
