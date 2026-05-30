# Contributing

This site is content-first. Almost everything you'd want to change lives in `content/`.

## Folder layout

```
content/
├── profile.json       name, bio, location, education
├── now.json           the "currently" widget
├── contact.json       email + social links
├── timeline.json      experience entries
├── reading.json       books + influences
├── certs.json         certifications, grouped
├── art.json           photography & design index
├── strava.json        cycling activity (fetched by script)
├── field-notes.json   short notes / poems
├── work/              one .md file per project
├── writing/           one .md file per essay
├── poetry/            one .md file per poem
└── zines/             one .md file per zine

content/art/           image files referenced by art.json
src/                   shared loader (content.js) + render helpers (render.js) — don't edit casually
variants/              CSS + JS for each layout theme
scripts/               data-fetch scripts
```

## Rules of thumb

- **JSON** = flat data. Keep keys stable — renderers depend on exact key names.
- **Markdown** = YAML frontmatter (between `---`) plus body. Frontmatter is open: add fields freely; unknown keys are ignored.
- Use `order:` or `date:` in frontmatter to control ordering. Filenames don't matter.

## Add a project

Create `content/work/your-slug.md`:

```yaml
---
title: Thing I made
slug: thing-i-made
year: 2025
summary: One line for tiles.
kind: web toy           # or "observability", "branding", "BE Project"...
featured: true          # show as a big tile (optional)
order: 1
tags: [Python, Kafka]
metric: 3h → live
url: https://...
repo: https://github.com/...
thumbnail: content/art/foo.jpg
---

Body in markdown.
```

## Add an essay

Create `content/writing/your-slug.md`:

```yaml
---
title: Essay title
slug: essay-title
date: 2026-05-01
readMinutes: 8
summary: One line.
tags: [observability]
---

Body in markdown.
```

## Add photography or design

1. Drop the file in `content/art/` (e.g. `content/art/newpic.jpg`)
2. Add an entry to `content/art.json`:

```json
{ "id": "newpic", "kind": "photo", "src": "content/art/newpic.jpg",
  "caption": "what it is", "location": "where", "date": "2026-04" }
```

`kind` is `"photo"` or `"design"`. For design, use `"client"` instead of `"location"`.

## Add a zine

Create `content/zines/your-slug.md` — frontmatter only (no body needed):

```yaml
---
title: "My Zine"
slug: my-zine
date: 2024-03-01
availability: available     # available | sold-out | free
cover: zines/my-zine/cover.jpg
pages:
  - zines/my-zine/cover.jpg
  - zines/my-zine/spread-01.jpg
spreadIndices: [1]          # which page indices are full-bleed spreads
pdf: zines/my-zine/my-zine.pdf   # optional download / fallback
---
```

## ⚠ Register new Markdown files

Adding a `.md` file is not enough — you must also add its slug to the `MANIFESTS` object in `src/content.js`. A slug missing from the manifest won't load.

## Set the hero portrait

The hero card expects a portrait at `content/art/hero.jpg` (portrait / 3:4 crops best), or point `heroImage` in `content/profile.json` to another path. Until a file exists, the card shows a labelled placeholder. The image is rendered as a duotone that recolors with the active theme.

## Themes

`index.html` loads two themes from `variants/`:

- **`grid.css` / `grid.js`** — editorial bento layout. Dark by default; light mode toggle persisted to `localStorage`.
- **`cycle-house.css` / `cycle-house.js`** — Slytherin accent overlay, toggled by the crest button in the header.

Each theme owns its own CSS and JS. Adding a section means editing those files, not a shared template. Shared logic (escaping, the zine reader) lives in `src/render.js`.

## Fetch scripts

```
node scripts/fetch-strava.mjs   # updates content/strava.json
node scripts/fetch-reading.mjs  # updates content/reading.json (or similar)
```

Run these and commit the resulting JSON when activity data needs refreshing.

## Preview locally

```
npx serve .
```

Visit `http://localhost:3000/`. No build step needed.
