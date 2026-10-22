// SEEK profile -> career JSON.
//
// SEEK only serves the full career history (dates, achievements) to a
// logged-in session; an anonymous fetch gets role + company for one entry.
// So this runs in the browser: open your SEEK profile while logged in,
// paste this into the devtools console, and the JSON is copied to the
// clipboard (and returned).
//
// It reads window.__APOLLO_STATE__ (the server-rendered GraphQL cache),
// not the DOM, so it survives SEEK reshuffling its markup.

(function seekCareer() {
  const state = window.__APOLLO_STATE__;
  if (!state) throw new Error('No __APOLLO_STATE__ — is this a SEEK profile page?');

  const view = Object.entries(state.ROOT_QUERY)
    .find(([k]) => k.startsWith('publicProfileView'))?.[1];
  if (!view) throw new Error('No publicProfileView in the Apollo cache.');
  if (view.__typename !== 'UnrestrictedPublicProfileView') {
    console.warn(`Got ${view.__typename} — log in to SEEK for the full history.`);
  }

  // Apollo keys localised fields as `label({"locale":"en-AU"})`.
  const label = (o) => o && Object.entries(o).find(([k]) => k.startsWith('label'))?.[1];

  const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
                   Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

  // "Jul 2024" -> "2024-07"; "Present" -> null
  function isoMonth(s) {
    const m = /^([A-Z][a-z]{2}) (\d{4})$/.exec(s.trim());
    return m ? `${m[2]}-${String(MONTHS[m[1]]).padStart(2, '0')}` : null;
  }

  // "Jul 2024 - Present (2 years 4 months)" / "Mar 2019 (1 month)"
  function parseDuration(text) {
    if (!text) return { start: null, end: null, current: false, length: null };
    const m = /^(.*?)(?:\s*\((.*)\))?$/.exec(text.trim());
    const [from, to = from] = m[1].split(/\s+-\s+/);
    const current = /present/i.test(to);
    return {
      start: isoMonth(from),
      end: current ? null : isoMonth(to),
      current,
      length: m[2] ?? null,
    };
  }

  const career = (view.workHistories ?? []).map((w) => {
    const durationText = label(w.duration) ?? null;
    return {
      role: w.roleTitle,
      company: w.companyName,
      ...parseDuration(durationText),
      durationText,
      achievements: w.achievements ?? null,
    };
  });

  const education = (view.educationV2 ?? []).map((e) => ({
    qualification: e.name,
    institution: e.institute,
    status: label(e.completion) ?? null,
    highlights: e.highlights ?? null,
  }));

  const result = {
    source: location.href,
    scrapedAt: new Date().toISOString(),
    restricted: view.__typename !== 'UnrestrictedPublicProfileView',
    name: [view.firstName, view.lastName].filter(Boolean).join(' '),
    location: label(view.homeLocation) ?? null,
    summary: view.personalSummary ?? null,
    career,
    education,
    skills: (view.skills ?? []).map((s) => (typeof s === 'string' ? s : label(s) ?? s.name ?? s)),
    licences: view.licences ?? [],
    languages: view.languages ?? [],
  };

  const json = JSON.stringify(result, null, 2);
  try { copy(json); console.log(`Copied ${career.length} roles to clipboard.`); } catch {}
  return json;
})();
