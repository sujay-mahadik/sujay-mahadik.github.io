#!/usr/bin/env node
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const TOKEN       = process.env.NOTION_TOKEN;
const DATABASE_ID = '1874e80d061a80919efad8c9fa911b26';
const OUT_PATH    = fileURLToPath(new URL('../content/reading.json', import.meta.url));

if (!TOKEN) {
  console.error('NOTION_TOKEN is not set');
  process.exit(1);
}

async function queryAll() {
  const results = [];
  let cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`Notion API error ${res.status}: ${text}`);
      process.exit(1);
    }

    const data = await res.json();
    results.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return results;
}

const SHELF_MAP = {
  'currently-reading': 'currently_reading',
  'read':              'read',
  'to-read':           'to_read',
};

const pages = await queryAll();
const buckets = { currently_reading: [], read: [], to_read: [] };

for (const page of pages) {
  const props  = page.properties;
  const title  = props?.Title?.title?.[0]?.plain_text  ?? '';
  const author = props?.Author?.rich_text?.[0]?.plain_text ?? '';
  const shelf  = props?.Shelf?.select?.name ?? '';
  const key    = SHELF_MAP[shelf];
  if (!key || !title) continue;
  buckets[key].push({ title, author });
}

let influences = [];
try {
  const existing = JSON.parse(await fs.readFile(OUT_PATH, 'utf8'));
  influences = existing.influences ?? [];
} catch { /* file may not exist on first run */ }

const output = {
  currently_reading: buckets.currently_reading,
  read:              buckets.read,
  to_read:           buckets.to_read,
  influences,
  last_synced:       new Date().toISOString(),
};

await fs.writeFile(OUT_PATH, JSON.stringify(output, null, 2) + '\n');
console.log(
  `Wrote reading.json — currently reading: ${buckets.currently_reading.length}, ` +
  `read: ${buckets.read.length}, to-read: ${buckets.to_read.length}`
);
