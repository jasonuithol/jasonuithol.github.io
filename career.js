// Career board: renders the SEEK career history and the GitHub repos side by
// side, both filtered by the chips.
//
// Layout: each chip sits over a socket; the fanout SVG routes one trace per
// socket into a bus of vertical lanes running down between the two columns
// (down the left on narrow screens). Every card has a stub from each matching
// lane to its edge; stubs are fixed-length CSS, so no layout measuring.
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
  const work = document.getElementById('work');
  const fanout = document.getElementById('fanout');

  const on = new Set();
  const pending = new Map();
  // One per column: its rows, and the noun for its status line.
  const cols = [
    { key: 'career', title: 'Career', noun: 'role', rows: [] },
    { key: 'repos',  title: 'GitHub', noun: 'repo', rows: [] },
  ];

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

  // A card in either column. Stubs and vias run from its edge to the lanes.
  function renderRow({ title, href, sub, when, length, stack, tags, body }) {
    const stubs = tags.map((id) => {
      const i = TAGS.findIndex((t) => t.id === id);
      return `<span class="stub trace t-${id}" style="${tagVar(id, i)}"></span>` +
             `<span class="via trace t-${id}" style="${tagVar(id, i)}"></span>`;
    }).join('');

    const badges = tags.map((id) => {
      const t = TAGS.find((x) => x.id === id);
      return `<span class="badge t-${id}" style="--c:var(--c-${id})">${t.label}</span>`;
    }).join('');

    const name = href
      ? `<a href="${escapeHtml(href)}">${escapeHtml(title)}</a>`
      : escapeHtml(title);

    const row = document.createElement('article');
    row.className = 'row';
    row.dataset.tags = tags.join(' ');
    row.innerHTML = `
      <div class="row-inner">
        <div class="cell">
          <div class="card">
            ${stubs}
            <header class="card-hdr">
              <div>
                <h3>${name}</h3>
                ${sub ? `<p class="company">${escapeHtml(sub)}</p>` : ''}
              </div>
              <p class="when">${when}${length ? `<span>${escapeHtml(length)}</span>` : ''}</p>
            </header>
            ${stack.length ? `<p class="stack">${stack.map(escapeHtml).join(' · ')}</p>` : ''}
            ${badges ? `<div class="badges">${badges}</div>` : ''}
            ${body ? `<div class="body">${body}</div>` : ''}
          </div>
        </div>
      </div>`;
    return row;
  }

  // Only tags the chips know about, in chip order.
  const known = (tags) => TAGS.map((t) => t.id).filter((id) => (tags || []).includes(id));

  function careerRows(data, tagMap) {
    return data.career.map((job) => {
      const key = `${job.start} ${job.company.trim()}`;
      if (!tagMap[key]) console.warn(`[career] no tags for "${key}" — add it to data/tags.json`);
      const { stack, blocks } = parseAchievements(job.achievements);
      const row = renderRow({
        title: job.role,
        sub: job.company.trim(),
        when: `${fmtMonth(job.start)} – ${job.current ? 'now' : fmtMonth(job.end)}`,
        length: job.length,
        stack,
        tags: known(tagMap[key]),
        body: renderBlocks(blocks),
      });
      row.span = [monthIndex(job.start), job.current ? monthIndex(null) : monthIndex(job.end)];
      return row;
    });
  }

  // Languages making up at least 5% of the code, biggest first.
  function mainLanguages(languages) {
    const total = Object.values(languages).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(languages).sort((a, b) => b[1] - a[1])
      .filter(([, bytes]) => bytes / total >= 0.05).map(([lang]) => lang);
  }

  function repoRows(data, notes) {
    return data.repos
      .filter((r) => !notes[r.name]?.hide && r.firstCommit)
      .sort((a, b) => b.lastCommit.localeCompare(a.lastCommit))
      .map((repo) => {
        const note = notes[repo.name];
        if (!note) console.warn(`[career] no notes for repo "${repo.name}" — add it to data/repo-notes.json`);
        const span = [monthIndex(repo.firstCommit.slice(0, 7)), monthIndex(repo.lastCommit.slice(0, 7))];
        const ongoing = span[1] === monthIndex(null);
        const row = renderRow({
          title: repo.name,
          href: repo.url,
          sub: mainLanguages(repo.languages).join(' · '),
          when: `${fmtMonth(repo.firstCommit.slice(0, 7))} – ${ongoing ? 'now' : fmtMonth(repo.lastCommit.slice(0, 7))}`,
          length: experience([span]),
          stack: [`${repo.commits} commit${repo.commits === 1 ? '' : 's'}`],
          tags: known(note?.tags),
          body: linkify(note?.blurb || repo.description || ''),
        });
        row.span = span;
        return row;
      });
  }

  function renderWork(career, tagMap, repos, notes) {
    cols[0].rows = careerRows(career, tagMap);
    cols[1].rows = repos ? repoRows(repos, notes) : [];

    const laneEls = TAGS.map((t, i) =>
      `<span class="lane trace t-${t.id}" style="${tagVar(t.id, i)}"></span>` +
      `<span class="via end trace t-${t.id}" style="${tagVar(t.id, i)}"></span>`).join('');
    work.innerHTML = `
      <div class="col col-career"></div>
      <div class="bus" id="bus">${laneEls}</div>
      <div class="col col-repos"></div>`;

    cols.forEach((col) => {
      const el = work.querySelector(`.col-${col.key}`);
      el.innerHTML = `<header class="col-hdr"><h2 class="silk">${col.title}</h2>
        <p class="status silk"></p></header>`;
      col.status = el.querySelector('.status');
      col.rows.forEach((row) => el.appendChild(row));
    });
  }

  function renderExtras(data) {
    const edu = data.education.map((e) => `
      <li><strong>${escapeHtml(e.qualification)}</strong> — ${escapeHtml(e.institution)}</li>`).join('');
    const skills = data.skills.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
    document.getElementById('extras').innerHTML = `
      <div class="panel"><h2 class="silk">Education</h2><ul class="edu">${edu}</ul></div>
      <div class="panel"><h2 class="silk">Skills</h2><ul class="skills">${skills}</ul></div>`;

  }

  function renderFoot(career, repos) {
    const date = (iso) => new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    document.getElementById('foot').textContent = [
      `Career data imported from SEEK · ${date(career.scrapedAt)}`,
      repos && `GitHub data imported · ${date(repos.scrapedAt)}`,
    ].filter(Boolean).join('   ·   ');
  }

  // ---------- fanout: sockets -> lane bus ----------

  // Socket i's trace drops to height h_i, runs sideways to lane i, and joins it.
  // Traces heading left (socket right of its lane) turn in index order, so
  // h rises with i; traces heading right turn in reverse order. Sockets and
  // lanes both run left to right, which keeps every trace from crossing.
  function drawFanout() {
    const sockets = [...document.querySelectorAll('.socket')];
    const laneEls = [...document.querySelectorAll('#bus .lane')];
    if (!sockets.length || !laneEls.length) return;

    const box = fanout.getBoundingClientRect();
    const step = 12;
    const top = 14;
    const centre = (el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2 - box.left; };

    const traces = TAGS.map((t, i) => ({ t, i, x: centre(sockets[i]), l: centre(laneEls[i]) }));
    const leftward = traces.filter((tr) => tr.x - tr.l >= 1);
    const rightward = traces.filter((tr) => tr.l - tr.x >= 1);
    leftward.forEach((tr, k) => { tr.h = top + k * step; });
    rightward.forEach((tr, k) => { tr.h = top + (rightward.length - 1 - k) * step; });
    const height = top + Math.max(leftward.length, rightward.length, 1) * step + 10;

    const paths = traces.map(({ t, i, x, l, h }) => {
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
    cols.forEach((col) => {
      const shown = [];
      col.rows.forEach((row) => {
        const tags = row.dataset.tags.split(' ').filter(Boolean);
        const show = on.size === 0 || tags.some((id) => on.has(id));
        row.classList.toggle('off', !show);
        row.inert = !show;
        if (show) shown.push(row);
      });
      if (!col.status) return;
      const total = col.rows.length;
      col.status.textContent = on.size
        ? `${shown.length} of ${total} ${col.noun}s · ${experience(shown.map((r) => r.span))}`
        : `${total} ${col.noun}s · no chips selected`;
      col.status.classList.toggle('idle', on.size === 0);
    });
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
      chip.classList.remove('lifting');
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

  // Left alone after the intro, the board demos itself. For the first
  // DEMO_FIRST_MS the "select a chip" prompt shouts; then it seats a chip,
  // and every DEMO_HOLD_MS seats the next one, pulling the previous chip
  // DEMO_OVERLAP_MS later so two are briefly live together. The visitor's
  // first chip click ends the demo for good.
  const DEMO_FIRST_MS = 7000;
  const DEMO_HOLD_MS = 5000;
  const DEMO_OVERLAP_MS = 1000;
  const demo = { timers: [], seated: new Set(), next: 0, over: false };

  const later = (fn, ms) => demo.timers.push(setTimeout(fn, ms));
  const prompt = () => document.querySelector('.bay-label');

  function armDemo(delay) {
    prompt().classList.add('shout');
    later(() => {
      prompt().classList.remove('shout');
      demoStep();
    }, delay);
  }

  function demoStep() {
    const chips = [...document.querySelectorAll('.chip')];
    const chip = chips[demo.next++ % chips.length];
    const previous = [...demo.seated];
    toggle(chip);
    demo.seated.add(chip);
    later(() => previous.forEach((c) => { toggle(c); demo.seated.delete(c); }), DEMO_OVERLAP_MS);
    later(demoStep, DEMO_HOLD_MS);
  }

  // Pulls the demo's chips; returns true if the visitor clicked one of them,
  // in which case it stays in and becomes theirs.
  function stopDemo(clicked) {
    demo.over = true;
    demo.timers.forEach(clearTimeout);
    prompt().classList.remove('shout');
    const adopted = demo.seated.has(clicked);
    demo.seated.forEach((c) => { if (c !== clicked) toggle(c); });
    demo.seated.clear();
    return adopted;
  }

  function userToggle(chip) {
    const adopted = !demo.over && stopDemo(chip);
    if (!adopted) toggle(chip);
  }

  // ---------- boot ----------

  // Renders everything below the header (still hidden) and returns the
  // header text for the intro to type.
  async function load() {
    try {
      const get = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(`${u}: ${r.status}`); return r.json(); });
      const [data, tagMap] = await Promise.all([get('data/seek-career.json'), get('data/tags.json')]);
      // The repo column is a bonus: if its data is missing, the career still renders.
      const [repos, notes] = await Promise.all([get('data/github-repos.json'), get('data/repo-notes.json')])
        .catch((err) => { console.warn('[career] no GitHub data:', err.message); return [null, {}]; });
      renderChips();
      renderWork(data, tagMap, repos, notes);
      renderExtras(data);
      renderFoot(data, repos);
      apply();
      drawFanout();
      document.fonts?.ready.then(drawFanout);
      // The chip row's size is all the fanout geometry depends on.
      new ResizeObserver(() => requestAnimationFrame(drawFanout)).observe(document.getElementById('chips'));
      return headerText(data);
    } catch (err) {
      work.innerHTML = `<p class="error">Couldn't load the career data (${escapeHtml(err.message)}).
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
    if (!header) {
      board.classList.add('typed', 'booted');
      return;
    }

    // Typed: the buttons appear; the intro gets slurped into its own button;
    // then the chips and everything else come in.
    board.classList.add('typed');
    await sleep(INTRO_LINGER_MS);
    await slurp();
    await sleep(INTRO_SETTLE_MS);
    board.classList.add('booted');
    armDemo(DEMO_FIRST_MS);
  }

  // ---------- intro button: slurp / unslurp ----------

  const INTRO_LINGER_MS = 5000;
  const INTRO_SETTLE_MS = 1000;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const summaryEl = document.getElementById('summary');
  const introBtn = document.getElementById('intro-btn');
  let introBusy = false;

  // Squash the intro flat, then suck it into the button's centre.
  function slurpFrames() {
    const s = summaryEl.getBoundingClientRect();
    const b = introBtn.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (s.left + s.width / 2);
    const dy = b.top + b.height / 2 - (s.top + s.height / 2);
    return [
      { transform: 'translate(0, 0) scale(1, 1)', opacity: 1, filter: 'blur(0)' },
      { offset: 0.4, transform: `translate(${dx * 0.15}px, ${dy * 0.45}px) scale(0.75, 0.22)`, opacity: 0.9 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.02, 0.04)`, opacity: 0, filter: 'blur(2px)' },
    ];
  }

  async function slurp() {
    introBusy = true;
    CircuitAudio.slurp();
    await summaryEl.animate(slurpFrames(), { duration: 650, easing: 'ease-in', fill: 'forwards' }).finished;
    introBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
      { duration: 280, easing: 'ease-out' });
    introBtn.setAttribute('aria-expanded', 'false');

    // close the gap it left
    summaryEl.style.overflow = 'hidden';
    await summaryEl.animate([{ height: `${summaryEl.offsetHeight}px` }, { height: '0px' }],
      { duration: 400, easing: 'ease-in-out' }).finished;
    summaryEl.hidden = true;
    summaryEl.style.overflow = '';
    summaryEl.getAnimations().forEach((a) => a.cancel());
    introBusy = false;
  }

  // The reverse: open the gap, then the intro spills back out of the button.
  async function unslurp() {
    introBusy = true;
    summaryEl.hidden = false;
    summaryEl.style.overflow = 'hidden';
    summaryEl.style.opacity = '0';
    await summaryEl.animate([{ height: '0px' }, { height: `${summaryEl.offsetHeight}px` }],
      { duration: 400, easing: 'ease-in-out' }).finished;
    summaryEl.style.overflow = '';
    summaryEl.style.opacity = '';
    introBtn.setAttribute('aria-expanded', 'true');
    CircuitAudio.slurp(true);
    await summaryEl.animate(slurpFrames(), { duration: 550, easing: 'ease-in', direction: 'reverse' }).finished;
    introBusy = false;
  }

  introBtn.addEventListener('click', () => {
    if (introBusy) return;
    if (introBtn.getAttribute('aria-expanded') === 'true') slurp();
    else unslurp();
  });

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
