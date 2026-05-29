// content.js — shared loader for all JSON/MD content
// Adjust BASE based on where the HTML lives.

(function(){
  const BASE = '../content';

  async function loadJSON(name){
    try {
      const r = await fetch(`${BASE}/${name}.json`);
      if (!r.ok) throw new Error(r.statusText);
      return await r.json();
    } catch (e){
      console.warn(`[content] couldn't load ${name}.json`, e);
      return null;
    }
  }

  function parseMD(text){
    const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) return { frontmatter: {}, body: text };
    const fm = {};
    const lines = m[1].split('\n');
    let i = 0;
    while (i < lines.length){
      const line = lines[i];
      const colon = line.indexOf(':');
      if (colon < 0){ i++; continue; }
      const key = line.slice(0, colon).trim();
      let val = line.slice(colon + 1).trim();
      // Multi-line YAML list: key:\n  - item
      if (val === '' && i + 1 < lines.length && /^\s+-\s/.test(lines[i + 1])){
        const arr = [];
        i++;
        while (i < lines.length && /^\s+-\s/.test(lines[i])){
          arr.push(lines[i].replace(/^\s+-\s/, '').trim().replace(/^['"]|['"]$/g,''));
          i++;
        }
        fm[key] = arr;
        continue;
      }
      if (val.startsWith('[') && val.endsWith(']')){
        val = val.slice(1,-1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g,''));
      } else if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(Number(val)) && val !== '') val = Number(val);
      else val = val.replace(/^['"]|['"]$/g,'');
      fm[key] = val;
      i++;
    }
    return { frontmatter: fm, body: m[2] };
  }

  async function loadMD(path){
    try {
      const r = await fetch(`${BASE}/${path}`);
      if (!r.ok) throw new Error(r.statusText);
      return parseMD(await r.text());
    } catch (e){
      console.warn(`[content] couldn't load ${path}`, e);
      return null;
    }
  }

  async function loadCollection(folder, slugs){
    const items = await Promise.all(slugs.map(s => loadMD(`${folder}/${s}.md`)));
    return items.filter(Boolean);
  }

  const MANIFESTS = {
    work: [
      'now-playing', 'netcool-kafka', 'jellyfish',
      'spectrum-kafka', 'patch-dashboard', 'ab-initio-auto',
      'infin8y', 'ipfs-doc-transfer', 'autonomous-uav',
      'zeppelin-server', 'mit-creon'
    ],
    writing: ['ethics-dashboard', 'green-software', 'justice-after-sandel'],
    poetry: ['pipeline-prayer'],
    zines: ['hka-issue-one', 'hka-issue-two', 'hka-issue-three', 'hka-issue-four', 'dilli-darshan']
  };

  window.Content = { loadJSON, loadMD, parseMD, loadCollection, MANIFESTS };
})();
