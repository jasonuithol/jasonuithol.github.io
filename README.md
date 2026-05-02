# easyCoder — portfolio showcase

['CLICK HERE FOR PORTFOLIO'](https://jasonuithol.github.io/)

A matrix-themed single-page portfolio for the [`jasonuithol`](https://github.com/jasonuithol) GitHub account. Pure HTML/CSS/JS, zero build step, drops straight onto GitHub Pages.

---

## Files

| file           | purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `index.html`   | page structure — intro, portfolio shell, dossier modal         |
| `styles.css`   | full theme — colors, fonts, animations, scanlines, glitch FX   |
| `matrix.js`    | code-rain canvas + glitch-text utility                         |
| `portfolio.js` | intro sequence, rendering, dossier modal, easter eggs          |
| `repos.js`     | the data — your repos, descriptions, image-generation prompts  |

---

## Deploy to GitHub Pages

Push these files to a repo named `jasonuithol.github.io` (the special user-site repo) on the `main` branch:

```bash
# in this folder
git init
git add .
git commit -m "initial portfolio"
git branch -M main
git remote add origin https://github.com/jasonuithol/jasonuithol.github.io.git
git push -u origin main
```

Then in repo Settings → Pages → set source to `main` / `/ (root)`. Site goes live at `https://jasonuithol.github.io` within a minute or two.

If you'd rather host it under a project subpath (e.g. `jasonuithol.github.io/portfolio/`), use any other repo name and it works the same way.

---

## Editing the data

All repo data lives in **`repos.js`**. Each repo entry looks like:

```js
{
  name: "repo-name",
  description: "Short one-liner shown on the card.",
  longDesc: "Longer description shown in the dossier modal when clicked.",
  language: "Python"
}
```

A few entries had no description on GitHub — I made best guesses based on context (UltimatePyve, DarkAgesAI, the spacewar repos, mcp-chess, mcp-c, mcp-steam, UnifiedControlPanel). **Edit those freely**.

To add or remove repos, edit the `clusters` array. Categories and order are entirely yours to control.

---

## Two themes

The intro screen offers a red pill / blue pill choice that picks the visual mode:

- **Red pill — full matrix.** Code rain, scanlines, terminal cards, glitch FX. The whole 1999 fantasy.
- **Blue pill — fake-hippy pastel.** Cream paper background, sage and terracotta, handwritten Caveat headers, Fraunces serif, soft watercolor blobs drifting. The Notion-template makeover of the same content.

The footer has a `[ swap pill ]` toggle to flip between modes at any time without refreshing.

---

## Theatrics included (because: maximum theatrics)

- **Intro sequence** — typed boot text, cursor blink, red/blue pill choice with skip option
- **Code rain background** — canvas-driven katakana glyph rain, brighter "head" glyphs at random
- **Scanline overlay + vignette** — global CRT atmosphere
- **Glitch-name reveal** — repo names shuffle through random characters on hover
- **Terminal-window cards** — title bar, status dot, hover glow
- **Idle accelerator** — code rain speeds up if you stop interacting for 30 seconds
- **Konami code** — `↑↑↓↓←→←→ba` triggers "I know kung fu"
- **Whoami easter egg** — type `whoami` anywhere on the page

---

## Local preview

Just open `index.html` in a browser. No server required.

Or, if you prefer (and to make sure relative paths behave the same as on Pages):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## License / use

Yours to do whatever you want with.
