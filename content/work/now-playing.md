---
title: Now Playing
slug: now-playing
year: 2025
status: live
featured: true
order: 1
kind: web toy
url: https://sujay-mahadik.github.io/now-playing
repo: https://github.com/sujay-mahadik/now-playing
tags: [Vite, Spotify, GitHub Pages]
thumbnail: art/work-now-playing.jpg
summary: A live Spotify scrobbler rendered as a slowly-rotating postcard.
---

A small site that pulls what I'm listening to from Spotify and renders it as a postcard.
Vite + a serverless OAuth shim. Hosted on GitHub Pages.

## Why

I wanted a low-friction "what is Sujay listening to" surface that didn't require me to
post or curate. Something that updates itself.

## Notes

- OAuth flow handled by a tiny Cloudflare Worker (no server to maintain)
- Postcard rotates slowly via CSS; pauses on hover
- Falls back to last-played when nothing is active
