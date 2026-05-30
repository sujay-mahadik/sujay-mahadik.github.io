# sujay-mahadik.github.io

Personal portfolio for Sujay Mahadik — SRE, designer, economist. Lives at **sujay.site**.

No framework. No build step. HTML, CSS, and JS served directly.

## Run locally

```
npx serve .
```

Visit `http://localhost:3000/` — the main site. The `variants/` folder holds the CSS and JS that `index.html` pulls in.

## Structure

```
index.html          the site
variants/
  grid.css/js       editorial bento layout (active)
  cycle-house.css/js  Slytherin accent theme (active)
content/            all portfolio data (JSON + Markdown)
scripts/            data-fetch scripts (Strava, reading)
src/                shared content loader + render helpers
design-studies/     experimental layouts (not linked)
assets/             static assets
```

### Content layer

Everything that changes lives in `content/`. Renderers read it at runtime via `fetch`.

| File | What it holds |
|------|---------------|
| `profile.json` | Name, bio, location, education |
| `now.json` | "Currently" widget |
| `contact.json` | Email + social links |
| `timeline.json` | Work history |
| `reading.json` | Books + influences |
| `certs.json` | Certifications |
| `art.json` | Photography + design index |
| `strava.json` | Cycling activity (fetched by script) |
| `field-notes.json` | Short notes / poems |
| `work/*.md` | One file per project |
| `writing/*.md` | One file per essay |
| `poetry/*.md` | One file per poem |
| `zines/*.md` | One file per zine |

### Scripts

`scripts/fetch-strava.mjs` — pulls recent Strava activity into `content/strava.json`.  
`scripts/fetch-reading.mjs` — fetches reading data.

Run with `node scripts/fetch-strava.mjs` etc. before committing updated data.

## Planned migration

Moving to **Astro** for GitHub Pages. `content/` stays unchanged; only the renderers will be replaced.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
