/* ============================================================
   matrix.js — code rain canvas + glitch utilities
   ============================================================ */

(function () {
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas.getContext('2d');

  // Mix of katakana, latin, and numbers — the iconic matrix glyph set.
  const GLYPHS = (
    'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ' +
    '0123456789' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ<>{}[]/\\=+-*$#@!?'
  ).split('');

  const FONT_SIZE = 16;
  let columns = 0;
  let drops = [];
  let speedMultiplier = 1; // bumped by easter eggs / idle

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / FONT_SIZE);
    drops = new Array(columns).fill(0).map(() => Math.random() * -canvas.height / FONT_SIZE);
  }
  resize();
  window.addEventListener('resize', resize);

  // expose so other scripts can adjust intensity
  window.matrixRain = {
    setSpeed: (m) => { speedMultiplier = m; },
    burst: () => { speedMultiplier = 4; setTimeout(() => speedMultiplier = 1, 1500); }
  };

  function draw() {
    // translucent black overlay creates the trailing fade effect
    ctx.fillStyle = 'rgba(0, 5, 8, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = FONT_SIZE + 'px "Share Tech Mono", monospace';

    for (let i = 0; i < drops.length; i++) {
      const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      const x = i * FONT_SIZE;
      const y = drops[i] * FONT_SIZE;

      // Lead character is brighter (head of the drop)
      if (Math.random() < 0.04) {
        ctx.fillStyle = '#ccffd5';
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = '#00ff41';
        ctx.shadowBlur = 0;
      }
      ctx.fillText(ch, x, y);

      // reset drop when it falls past the bottom (with random delay)
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += speedMultiplier;
    }
    ctx.shadowBlur = 0;
    requestAnimationFrame(draw);
  }
  draw();

  // ============================================================
  // Glitch text utility — used by repo card hover and intros
  // ============================================================
  const SHUFFLE_CHARS = '!<>-_\\/[]{}—=+*^?#________';
  window.glitchText = function (element, finalText, durationMs = 400) {
    const start = performance.now();
    const orig = finalText;
    function frame(now) {
      const t = (now - start) / durationMs;
      if (t >= 1) {
        element.textContent = orig;
        return;
      }
      let out = '';
      for (let i = 0; i < orig.length; i++) {
        if (i / orig.length < t) {
          out += orig[i];
        } else if (orig[i] === ' ') {
          out += ' ';
        } else {
          out += SHUFFLE_CHARS[Math.floor(Math.random() * SHUFFLE_CHARS.length)];
        }
      }
      element.textContent = out;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  // ============================================================
  // Idle accelerator — rain speeds up after no interaction
  // ============================================================
  let idleTimer;
  function resetIdle() {
    speedMultiplier = 1;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { speedMultiplier = 2.2; }, 30000);
  }
  ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(e =>
    window.addEventListener(e, resetIdle, { passive: true })
  );
  resetIdle();
})();
