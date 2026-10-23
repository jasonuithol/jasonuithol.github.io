# jasonuithol.github.io — career board

[jasonuithol.github.io](https://jasonuithol.github.io/)

My career history as a circuit board. Power it on, watch the intro type itself out, then select a skill chip (.NET, SQL, Security, API, Frontend, AI, Python, Cloud) to light its trace through every role and GitHub repo that used it; the rest drop out. Pure HTML/CSS/JS, no build step, served straight from GitHub Pages.

The previous Matrix-themed repo portfolio lives at the `original` tag.

## Files

| file                     | purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `index.html`             | page shell                                           |
| `career.css`             | the board, chips, traces, cards                      |
| `career.js`              | rendering, filtering, chip behaviour                 |
| `circuit-audio.js`       | chip sounds (Web Audio synth + `sounds/hover.wav`)  |
| `data/seek-career.json`  | career data scraped from SEEK                        |
| `data/tags.json`         | which filters each role belongs to                   |
| `data/github-repos.json` | repo data scraped from GitHub                        |
| `data/repo-notes.json`   | blurb and filters for each repo                      |
| `tools/seek-career.js`   | the SEEK scraper (browser console snippet)           |
| `tools/github-repos.py`  | the GitHub scraper (uses the `gh` CLI)               |

## Updating the career data

1. Open the SEEK profile while logged in (the full history isn't public).
2. Paste `tools/seek-career.js` into the devtools console. The JSON is copied to the clipboard.
3. Save it over `data/seek-career.json`.
4. Add any new roles to `data/tags.json`, keyed `"<start> <company>"`, e.g. `"2022-06 Department of Education QLD": ["net", "sql"]`.

## Updating the GitHub data

1. `python3 tools/github-repos.py` (needs `gh auth login`). It lists public, non-fork repos and reads each one's commit history for its first and last commit dates.
2. Add any new repos to `data/repo-notes.json` with a blurb and filter tags, or `"hide": true` to leave one off.

## Local preview

The page fetches its JSON, so serve it over HTTP:

```bash
python3 -m http.server 8123
# then visit http://localhost:8123
```
