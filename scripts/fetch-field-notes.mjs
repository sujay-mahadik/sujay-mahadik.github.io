#!/usr/bin/env node
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const TOKEN       = process.env.NOTION_TOKEN;
const DATABASE_ID = '2b04e80d061a83c9adda81c71aca3605';
const OUT_PATH    = fileURLToPath(new URL('../content/field-notes.json', import.meta.url));

if (!TOKEN) {
  console.error('NOTION_TOKEN is not set');
  process.exit(1);
}

function richTextToMd(richTexts) {
  return (richTexts || []).map(rt => {
    let t = rt.plain_text;
    if (rt.annotations?.italic) t = `*${t}*`;
    if (rt.annotations?.bold)   t = `**${t}**`;
    return t;
  }).join('');
}

async function queryAll() {
  const results = [];
  let cursor;
  do {
    const body = { page_size: 100, sorts: [{ property: 'Created', direction: 'ascending' }] };
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

const pages = await queryAll();
const notes = pages.map(page => {
  const props = page.properties;
  const quote        = richTextToMd(props?.Quote?.title);
  const attribution  = props?.Attribution?.select?.name  ?? '';
  const source_title = props?.['Source Title']?.select?.name ?? '';
  const source_page  = props?.['Source Page']?.rich_text?.[0]?.plain_text ?? '';
  const tags         = (props?.Tags?.multi_select ?? []).map(t => t.name);
  const created      = props?.Created?.created_time ?? page.created_time;
  return { id: page.id, quote, attribution, source_title, source_page, tags, created };
}).filter(n => n.quote);

const output = {
  updated:     new Date().toISOString().slice(0, 10),
  last_synced: new Date().toISOString(),
  notes,
};

await fs.writeFile(OUT_PATH, JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote field-notes.json — ${notes.length} notes`);
