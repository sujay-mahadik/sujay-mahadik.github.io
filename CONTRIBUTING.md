# Contributing to this portfolio

This site is content-first. Almost everything lives in `content/`.

## Folder layout

```
content/
├── profile.json     name, bio, location, education
├── now.json         the "currently" widget
├── contact.json     email + social links
├── timeline.json    experience entries
├── reading.json     books + influences
├── certs.json       certifications, grouped
├── art.json         photography & design (single index)
├── work/            one .md file per project
├── writing/         one .md file per essay
├── poetry/          one .md file per poem
└── zines/           one .md file per zine (cover + pages/PDF)

art/                 the actual image files
src/                 the shared loader + renderers (I write these)
variants/            the themes — each is self-contained HTML/CSS/JS
├── os.*             glassmorphism desktop  (active)
├── grid.*           editorial bento        (active)
├── atlas.*          spatial canvas         (archived)
├── desktop.*        retro OS               (archived)
└── almanac.html     almanac                (archived)
index.html           launcher → opens either active direction
```

## Rules of thumb

- **JSON** = flat data. Keep keys stable.
- **Markdown** = YAML frontmatter (between `---`) plus body. Frontmatter is **open** — add fields freely; the renderer ignores unknown keys.
- Use `order:` or `date:` in frontmatter to control ordering. Filenames don't matter.

## Add a project

`content/work/your-slug.md`

```yaml
---
title: Thing I made
slug: thing-i-made
year: 2025
summary: One line for tiles.
# optional:
kind: web toy           # or "observability", "branding", "BE Project"...
featured: true          # show as a big tile
order: 1
tags: [Python, Kafka]
metric: 3h → live
url: https://...
repo: https://github.com/...
thumbnail: art/foo.jpg
---

Body in markdown.
```

## Add photography or design to `art/`

1. Drop the file in `art/` (e.g. `art/09-newpic.jpg`)
2. Add an entry to `content/art.json`:

```json
{ "id": "09-newpic", "kind": "photo", "src": "art/09-newpic.jpg",
  "caption": "what it is", "location": "where", "date": "2026-04" }
```

`kind` is `"photo"` or `"design"`. For design, use `client` instead of `location`.

## Set the hero portrait (grid / bento)

The "who" card in `grid.html` is a full-bleed photo slot. Drop your portrait at
**`art/hero.jpg`** (portrait/3:4 crops best), or point `heroImage` in
`content/profile.json` somewhere else. Until a file exists, the card shows a
labelled placeholder. The photo is rendered as a duotone that recolors with the
active accent swatch, with a scrim so the name stays legible.

## Add an essay

`content/writing/your-slug.md`

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

## Add a zine

`content/zines/your-slug.md` — frontmatter only (no body needed):

```yaml
---
title: "My Zine"
slug: my-zine
date: 2024-03-01
availability: available     # available | sold-out | free
cover: zines/my-zine/cover.jpg
pages:                      # page images, in order
  - zines/my-zine/cover.jpg
  - zines/my-zine/spread-01.jpg
spreadIndices: [1]          # which page indices are full-bleed spreads
pdf: zines/my-zine/my-zine.pdf   # optional download / fallback
---
```

The reader (`src/render.js → openZineReader`) lays pages out as book spreads,
or falls back to rendering the PDF if no page images are present.

## ⚠ Register new Markdown files

Adding a `.md` to `work/`, `writing/`, `poetry/`, or `zines/` is **not** enough —
list its slug in the `MANIFESTS` object in `src/content.js`. Filenames don't
affect ordering (use `order:`/`date:`), but a slug missing from the manifest
won't load.

There are two **active** themes, both reading from `content/` via the shared
`src/content.js` (loader) + `src/render.js` (helpers):

- `variants/os.html` — **sujay.os**, a glassmorphism desktop. A real window
  manager: draggable windows with traffic lights, a floating dock, ⌘K spotlight,
  scattered polaroids, a boot sequence, and a Konami easter egg. Dark by default
  with a light toggle (persisted to `localStorage`). Topographic wallpaper is
  drawn to a `<canvas>` in `os-app.js`.
- `variants/grid.html` — **sujay.grid**, a dark editorial bento. Asymmetric card
  grid set in Instrument Serif + Hanken Grotesk, an influences marquee, and
  click-to-expand modals. Bone-on-black, one warm spark.

`atlas.*`, `desktop.*`, and `almanac.html` are kept **archived** in `variants/`
for reference. `index.html` is a launcher that links to the two active ones.

Each variant owns its own markup and styling — adding a section means editing
that variant's `.js`/`.css`, not a shared template. Shared logic that's worth
reusing (escaping, the zine reader) lives in `src/render.js`.

## Preview locally

No build step yet. Use any static server:

```
npx serve .
```

Visit `http://localhost:3000/` (launcher), or jump straight to
`/variants/os.html` or `/variants/grid.html`.

When we port to Astro, `content/` stays the same; only the renderers change.
