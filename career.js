// Career board: renders data/seek-career.json, filtered by the chips.
//
// Layout: each chip sits over a socket; the fanout SVG routes one trace per
// socket down into a bus of five vertical lanes in the left gutter. Every role
// row carries its own segment of those lanes (so hiding a row keeps the bus
// continuous) plus a stub from each matching lane to the card.
//
// Lighting is pure CSS: the board gets `on-<tag>` classes and every trace
// element tagged `t-<tag>` lights in that tag's colour.

(function () {
  const TAGS = [
    { id: 'net', label: '.NET',     short: '.NET' },
    { id: 'sql', label: 'SQL',      short: 'SQL' },
    { id: 'sec', label: 'Security', short: 'SEC' },
    { id: 'api', label: 'API',      short: 'API' },
    { id: 'fe',  label: 'Frontend', short: 'UI' },
    { id: 'ai',  label: 'AI',       short: 'AI' },
    { id: 'py',  label: 'Python',   short: 'PY' },
    { id: 'cld', label: 'Cloud',    short: 'CLD' },
  ];

  // Matches the `seat` keyframes in career.css: the chip hits the socket at
  // LAND_MS, rattles, and the circuit goes live at LIVE_MS.
  const LAND_MS = 170;
  const LIVE_MS = 420;
  const LIFT_DELAY_MS = 110;

  const board = document.getElementById('board');
  const history = document.getElementById('history');
  const fanout = document.getElementById('fanout');

  const on = new Set();
  const pending = new Map();
  let rows = [];

  // ---------- helpers ----------

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function linkify(s) {
    return escapeHtml(s).replace(/https?:\/\/[^\s<]+[^\s<.,;:)]/g,
      (url) => `<a href="${url}">${url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>`);
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtMonth(iso) {
    if (!iso) return 'now';
    const [y, m] = iso.split('-');
    return `${MONTHS[Number(m) - 1]} ${y}`;
  }

  // "2022-06" -> months since year 0; null means the current month.
  function monthIndex(iso) {
    if (!iso) { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); }
    const [y, m] = iso.split('-').map(Number);
    return y * 12 + m - 1;
  }

  // Total time covered by [start, end] month spans (inclusive, as SEEK counts
  // them), with overlapping roles counted once.
  function experience(spans) {
    const sorted = spans.filter(([a, b]) => !Number.isNaN(a) && !Number.isNaN(b))
      .sort((x, y) => x[0] - y[0]);
    let months = 0;
    let reach = -Infinity;
    for (const [a, b] of sorted) {
      const from = Math.max(a, reach + 1);
      if (b >= from) months += b - from + 1;
      reach = Math.max(reach, b);
    }
    const y = Math.floor(months / 12);
    const m = months % 12;
    const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
    return [y && plural(y, 'year'), (m || !y) && plural(m, 'month')].filter(Boolean).join(', ');
  }

  const tagVar = (id, i) => `--i:${i};--c:var(--c-${id})`;

  // Five lane segments for one row of the bus.
  function lanes() {
    return TAGS.map((t, i) =>
      `<span class="lane trace t-${t.id}" style="${tagVar(t.id, i)}"></span>`).join('');
  }

  // SEEK achievements are free text. Usually: a comma-separated tech line,
  // then paragraphs and bullet lines (•, *, -).
  function parseAchievements(text) {
    const lines = (text || '').replace(/\r/g, '').split('\n').map((l) => l.trim());
    const stack = [];
    let i = 0;
    while (i < lines.length && !lines[i]) i++;
    while (i < lines.length && lines[i] && !/^[•*\-]/.test(lines[i]) && lines[i].includes(',')) {
      stack.push(...lines[i].replace(/^Technologies:\s*/i, '').split(/,\s*/));
      i++;
    }
    const blocks = [];
    for (const line of lines.slice(i)) {
      if (!line) continue;
      const bullet = /^[•*\-]\s*/.exec(line);
      if (bullet) {
        const item = line.slice(bullet[0].length);
        const last = blocks[blocks.length - 1];
        if (last && last.type === 'ul') last.items.push(item);
        else blocks.push({ type: 'ul', items: [item] });
      } else {
        blocks.push({ type: 'p', text: line });
      }
    }
    return { stack: stack.map((s) => s.trim()).filter(Boolean), blocks };
  }

  function renderBlocks(blocks) {
    return blocks.map((b) => b.type === 'p'
      ? `<p>${linkify(b.text)}</p>`
      : `<ul>${b.items.map((it) => `<li>${linkify(it)}</li>`).join('')}</ul>`).join('');
  }

  // ---------- rendering ----------

  // The header is typed out by the intro, so this just hands back its text.
  function headerText(data) {
    if (data.source) document.getElementById('seek-link').href = data.source;
    // Drop the line that's just a link back to this site.
    const paras = (data.summary || '').split(/\n\s*\n/).map((p) => p.trim())
      .filter((p) => p && !/^https?:\/\/jasonuithol\.github\.io\/?$/.test(p));
    return { name: data.name, location: data.location || '', paras };
  }

  function renderChips() {
    document.getElementById('chips').innerHTML = TAGS.map((t, i) => `
      <div class="slot" style="${tagVar(t.id, i)}">
        <div class="socket">
          <span class="shade"></span>
          <button class="chip" type="button" data-tag="${t.id}" aria-pressed="false"
                  aria-label="${t.label} filter">
            <span class="top">
              <span class="wall wall-s"></span>
              <span class="wall wall-w"></span>
              <span class="notch"></span>
              <span class="led"></span>
              <span class="chip-label">${t.label}</span>
              <span class="chip-short" aria-hidden="true">${t.short}</span>
            </span>
          </button>
        </div>
      </div>`).join('');

    document.querySelectorAll('.chip').forEach((chip) =>
      chip.addEventListener('click', () => userToggle(chip)));
  }

  function renderRow(job, tags) {
    const { stack, blocks } = parseAchievements(job.achievements);
    const body = blocks.length ? `<div class="body">${renderBlocks(blocks)}</div>` : '';

    const stubs = tags.map((id) => {
      const i = TAGS.findIndex((t) => t.id === id);
      return `<span class="stub trace t-${id}" style="${tagVar(id, i)}"></span>` +
             `<span class="via trace t-${id}" style="${tagVar(id, i)}"></span>`;
    }).join('');

    const badges = tags.map((id) => {
      const t = TAGS.find((x) => x.id === id);
      return `<span class="badge t-${id}" style="--c:var(--c-${id})">${t.label}</span>`;
    }).join('');

    const when = `${fmtMonth(job.start)} – ${job.current ? 'now' : fmtMonth(job.end)}`;

    const row = document.createElement('article');
    row.className = 'row';
    row.dataset.tags = tags.join(' ');
    row.innerHTML = `
      <div class="row-inner">
        <div class="gutter">${lanes()}${stubs}</div>
        <div class="cell">
          <div class="card">
            <header class="card-hdr">
              <div>
                <h3>${escapeHtml(job.role)}</h3>
                <p class="company">${escapeHtml(job.company.trim())}</p>
              </div>
              <p class="when">${when}${job.length ? `<span>${escapeHtml(job.length)}</span>` : ''}</p>
            </header>
            ${stack.length ? `<p class="stack">${stack.map(escapeHtml).join(' · ')}</p>` : ''}
            ${badges ? `<div class="badges">${badges}</div>` : ''}
            ${body}
          </div>
        </div>
      </div>`;
    return row;
  }

  function renderHistory(data, tagMap) {
    history.innerHTML = `
      <div class="bus bus-head"><div class="gutter">${lanes()}</div>
        <div class="cell"><p class="status silk" id="status"></p></div></div>`;

    rows = data.career.map((job) => {
      const key = `${job.start} ${job.company.trim()}`;
      const tags = tagMap[key] || [];
      if (!tagMap[key]) console.warn(`[career] no tags for "${key}" — add it to data/tags.json`);
      const row = renderRow(job, TAGS.map((t) => t.id).filter((id) => tags.includes(id)));
      row.span = [monthIndex(job.start), job.current ? monthIndex(null) : monthIndex(job.end)];
      history.appendChild(row);
      return row;
    });

    const end = document.createElement('div');
    end.className = 'bus bus-end';
    end.innerHTML = `<div class="gutter">${lanes()}${TAGS.map((t, i) =>
      `<span class="via end trace t-${t.id}" style="${tagVar(t.id, i)}"></span>`).join('')}</div><div class="cell"></div>`;
    history.appendChild(end);
  }

  function renderExtras(data) {
    const edu = data.education.map((e) => `
      <li><strong>${escapeHtml(e.qualification)}</strong> — ${escapeHtml(e.institution)}</li>`).join('');
    const skills = data.skills.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
    document.getElementById('extras').innerHTML = `
      <div class="panel"><h2 class="silk">Education</h2><ul class="edu">${edu}</ul></div>
      <div class="panel"><h2 class="silk">Skills</h2><ul class="skills">${skills}</ul></div>`;

    const when = new Date(data.scrapedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    document.getElementById('foot').textContent = `Career data imported from SEEK · ${when}`;
  }

  // ---------- fanout: sockets -> lane bus ----------

  // Socket i's trace drops, turns left at height h_i, and joins lane i.
  // Sockets and lanes both run left to right and h_i increases with i, so
  // no two traces cross.
  function drawFanout() {
    const sockets = [...document.querySelectorAll('.socket')];
    const laneEls = [...document.querySelectorAll('.bus-head .lane')];
    if (!sockets.length || !laneEls.length) return;

    const box = fanout.getBoundingClientRect();
    const step = 12;
    const top = 14;
    const height = top + TAGS.length * step + 10;
    const centre = (el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2 - box.left; };

    const paths = TAGS.map((t, i) => {
      const x = centre(sockets[i]);
      const l = centre(laneEls[i]);
      const h = top + i * step;
      const dx = x - l;
      let d;
      if (Math.abs(dx) < 1) {
        d = `M${x} 0V${height}`;
      } else {
        const s = Math.sign(dx);
        const r = Math.min(6, Math.abs(dx) / 2);
        d = `M${x} 0V${h - r}L${x - s * r} ${h}H${l + s * r}L${l} ${h + r}V${height}`;
      }
      const style = tagVar(t.id, i);
      return `<path class="tr-base" d="${d}"/>` +
             `<path class="tr-lit t-${t.id}" style="${style}" d="${d}"/>` +
             `<path class="tr-flow t-${t.id}" style="${style}" d="${d}"/>` +
             `<circle class="tr-pad t-${t.id}" style="${style}" cx="${x}" cy="1.5" r="3.5"/>`;
    }).join('');

    fanout.setAttribute('viewBox', `0 0 ${box.width} ${height}`);
    fanout.setAttribute('height', height);
    fanout.innerHTML = paths;
  }

  // ---------- filtering ----------

  function apply() {
    TAGS.forEach((t) => board.classList.toggle(`on-${t.id}`, on.has(t.id)));
    const shown = [];
    rows.forEach((row) => {
      const tags = row.dataset.tags.split(' ').filter(Boolean);
      const show = on.size === 0 || tags.some((id) => on.has(id));
      row.classList.toggle('off', !show);
      row.inert = !show;
      if (show) shown.push(row);
    });
    const status = document.getElementById('status');
    if (status) {
      status.textContent = on.size
        ? `${shown.length} of ${rows.length} roles · ${experience(shown.map((r) => r.span))}`
        : `${rows.length} roles · no chips selected`;
      status.classList.toggle('idle', on.size === 0);
    }
  }

  // Browsers refuse audio until the visitor has interacted with the page,
  // so the demo stays silent until then.
  const audible = () => navigator.userActivation?.hasBeenActive !== false;

  const isSeated = (chip) => chip.getAttribute('aria-pressed') === 'true';

  function toggle(chip) {
    const id = chip.dataset.tag;
    clearTimeout(pending.get(id));
    const seating = !isSeated(chip);
    chip.setAttribute('aria-pressed', String(seating));

    if (seating) {
      chip.classList.remove('lifting', 'wiggle');
      chip.classList.add('seated');
      if (audible()) CircuitAudio.on({ land: LAND_MS / 1000, live: LIVE_MS / 1000 });
      pending.set(id, setTimeout(() => {
        chip.classList.add('live');
        on.add(id);
        apply();
      }, LIVE_MS));
    } else {
      chip.classList.remove('live');
      if (audible()) CircuitAudio.off();
      on.delete(id);
      apply();
      pending.set(id, setTimeout(() => {
        chip.classList.remove('seated');
        chip.classList.add('lifting');
      }, LIFT_DELAY_MS));
    }
  }

  // ---------- demo ----------

  // Left alone with nothing selected, the board demos itself: DEMO_FIRST_MS
  // after the intro (DEMO_IDLE_MS once the visitor has had a go) it seats a chip, holds it for DEMO_HOLD_MS, pulls it and seats the
  // next, round and round. Any chip click hands control back to the visitor.
  const DEMO_FIRST_MS = 5000;
  const DEMO_IDLE_MS = 10000;
  const DEMO_HOLD_MS = 5000;
  const DEMO_SWAP_MS = 700;
  const demo = { timer: null, chip: null, next: 0 };

  function armDemo(delay = DEMO_IDLE_MS) {
    clearTimeout(demo.timer);
    demo.timer = setTimeout(() => { if (on.size === 0) demoStep(); }, delay);
  }

  function demoStep() {
    const chips = [...document.querySelectorAll('.chip')];
    demo.chip = chips[demo.next % chips.length];
    demo.next++;
    toggle(demo.chip);
    demo.timer = setTimeout(() => {
      toggle(demo.chip);
      demo.chip = null;
      demo.timer = setTimeout(demoStep, DEMO_SWAP_MS);
    }, DEMO_HOLD_MS);
  }

  function userToggle(chip) {
    clearTimeout(demo.timer);
    const demoChip = demo.chip;
    demo.chip = null;
    if (demoChip && demoChip !== chip) toggle(demoChip);
    // Clicking the chip the demo just seated keeps it in: the visitor adopts it.
    if (demoChip !== chip) toggle(chip);
    if (![...document.querySelectorAll('.chip')].some(isSeated)) armDemo();
  }

  // ---------- idle fidget ----------

  // Every few seconds a random unseated chip wiggles, asking to be plugged in.
  function scheduleWiggle() {
    setTimeout(() => {
      const idle = [...document.querySelectorAll('.chip:not(.seated)')];
      const chip = idle[Math.floor(Math.random() * idle.length)];
      if (chip && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        chip.classList.add('wiggle');
        chip.addEventListener('animationend', () => chip.classList.remove('wiggle'), { once: true });
      }
      scheduleWiggle();
    }, 2500 + Math.random() * 4500);
  }

  // ---------- boot ----------

  // Renders everything below the header (still hidden) and returns the
  // header text for the intro to type.
  async function load() {
    try {
      const [data, tagMap] = await Promise.all(
        ['data/seek-career.json', 'data/tags.json'].map((u) =>
          fetch(u).then((r) => { if (!r.ok) throw new Error(`${u}: ${r.status}`); return r.json(); })));
      renderChips();
      renderHistory(data, tagMap);
      renderExtras(data);
      apply();
      drawFanout();
      document.fonts?.ready.then(drawFanout);
      // The chip row's size is all the fanout geometry depends on.
      new ResizeObserver(() => requestAnimationFrame(drawFanout)).observe(document.getElementById('chips'));
      return headerText(data);
    } catch (err) {
      history.innerHTML = `<p class="error">Couldn't load the career data (${escapeHtml(err.message)}).
        Opening the file directly won't work — serve the folder, e.g. <code>python3 -m http.server</code>.</p>`;
      return null;
    }
  }

  // ---------- intro ----------

  // The power button exists to get a click: browsers keep audio muted until
  // the visitor interacts. Then the header types itself out with a key/printer
  // tick per letter, the rest of the board fades in, and the demo timer starts.
  // Any click or key during the typing finishes it instantly.
  const CHAR_MS = 11;
  let skip = false;

  function typeInto(el, text) {
    return new Promise((resolve) => {
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      el.textContent = '';
      el.append(document.createTextNode(''), cursor);
      const node = el.firstChild;
      let i = 0;
      (function tick() {
        if (skip) i = text.length;
        else if (i < text.length) CircuitAudio.key(text[i++]);
        node.data = text.slice(0, i);
        if (i < text.length) {
          // a beat longer after punctuation, like a typist would
          setTimeout(tick, /[.,:]/.test(text[i - 1]) ? CHAR_MS * 6 : CHAR_MS + Math.random() * 6);
        } else {
          cursor.remove();
          resolve();
        }
      })();
    });
  }

  async function intro(header) {
    // The power click that started us is still bubbling; don't let it skip.
    const finish = (e) => { if (!e.target.closest?.('#power')) skip = true; };
    document.addEventListener('click', finish);
    document.addEventListener('keydown', finish);

    if (header) {
      await typeInto(document.getElementById('name'), header.name);
      await typeInto(document.getElementById('location'), header.location);
      const summary = document.getElementById('summary');
      for (const text of header.paras) {
        const p = document.createElement('p');
        summary.append(p);
        await typeInto(p, text);
        p.innerHTML = linkify(text);
      }
    }

    document.removeEventListener('click', finish);
    document.removeEventListener('keydown', finish);
    board.classList.add('booted');
    if (header) {
      scheduleWiggle();
      armDemo(DEMO_FIRST_MS);
    }
  }

  const ready = load();
  const gate = document.getElementById('gate');
  document.getElementById('power').addEventListener('click', async () => {
    CircuitAudio.boot();
    document.getElementById('name').textContent = '';
    gate.classList.add('gone');
    gate.addEventListener('transitionend', () => gate.remove(), { once: true });
    intro(await ready);
  }, { once: true });
})();
