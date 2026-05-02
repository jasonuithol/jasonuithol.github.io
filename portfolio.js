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
          playBanjoNote();
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
  // BANJO PLUCK (Karplus-Strong) — blue-mode hover sound
  // ============================================================
  // G major pentatonic across two octaves; pick at random per pluck.
  const BANJO_FREQS = [196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88, 587.33, 659.25];
  let _audioCtx = null;
  let _banjoBuffers = null;

  function _initBanjo() {
    if (_audioCtx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    _audioCtx = new Ctx();
    _banjoBuffers = BANJO_FREQS.map(f => _makeBanjoBuffer(_audioCtx, f, 1.0));
  }

  function _makeBanjoBuffer(ctx, freq, durSec) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * durSec);
    const delay = Math.max(2, Math.floor(sr / freq));
    const ks = new Float32Array(delay);
    for (let i = 0; i < delay; i++) ks[i] = Math.random() * 2 - 1;
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    let idx = 0;
    // damping < 0.5 -> energy loss per round; 0.496 = bright twangy banjo decay
    for (let i = 0; i < len; i++) {
      const s = ks[idx];
      data[i] = s;
      const next = (idx + 1) % delay;
      ks[idx] = (s + ks[next]) * 0.496;
      idx = next;
    }
    return buf;
  }

  function playBanjoNote() {
    _initBanjo();
    if (!_audioCtx || !_banjoBuffers) return;
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    const buf = _banjoBuffers[Math.floor(Math.random() * _banjoBuffers.length)];
    const src = _audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = _audioCtx.createGain();
    gain.gain.value = 0.28;
    src.connect(gain).connect(_audioCtx.destination);
    src.start();
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
