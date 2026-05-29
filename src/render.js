// render.js — shared content renderers.
// Each function takes data and writes HTML into a target element.
// Called from atlas.js and desktop.js after loading content.

(function(){
  const esc = (s) => String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const md = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code>$1</code>');

  // ─── HERO / PROFILE ────────────────────────────────
  function renderHero(targetId, profile, opts = {}){
    const el = document.getElementById(targetId);
    if (!el || !profile) return;
    const variant = opts.variant || 'atlas';
    if (variant === 'desktop'){
      el.innerHTML = `
        <h1>hi, i'm <span class="ac">${esc(profile.shortName.toLowerCase())}</span>.</h1>
        <span class="strap">${esc(profile.tagline)}</span>
        <p style="margin-top:14px">${md(profile.blurb)} This portfolio is a <em>desktop</em>, not a feed — drag the icons, open the windows, leave the sticky notes where you want them.</p>
        ${profile.longBio.map(p => `<p>${md(p)}</p>`).join('')}
        <div class="divider"></div>
        <p style="font-size:15px;color:var(--ink-3)">⌨ try: open <span class="kbd">work/</span> · drag a sticky · <span class="kbd">Esc</span> closes · type <span class="kbd">↑↑↓↓</span> for a surprise</p>
      `;
    } else {
      el.innerHTML = `
        <div class="k">An atlas, not a résumé</div>
        <h1 class="name">${esc(profile.name.split(' ')[0])} <em>${esc(profile.name.split(' ').slice(1).join(' '))}</em></h1>
        <div class="role">${esc(profile.tagline)}</div>
        <p class="blurb">${md(profile.blurb)}</p>
        <div class="tags">
          <span class="tag">SRE @ Barclays</span>
          <span class="tag">Kafka · OTel · ELK</span>
          <span class="tag">Co-founder · Jellyfish</span>
          <span class="tag">MA Economics</span>
          <span class="tag accent">${esc(profile.location.city)} ⇄ ${esc(profile.location.from.split(',')[0])}</span>
        </div>
      `;
    }
  }

  // ─── ABOUT (long bio paragraphs) ───────────────────
  function renderAbout(targetId, profile){
    const el = document.getElementById(targetId);
    if (!el || !profile) return;
    el.innerHTML = `
      <h2>about, the long version</h2>
      ${profile.longBio.map(p => `<p>${md(p)}</p>`).join('')}
    `;
  }

  // ─── NOW WIDGET ────────────────────────────────────
  function renderNow(targetId, data, opts = {}){
    const el = document.getElementById(targetId);
    if (!el || !data) return;
    const rows = data.items.map(item => {
      const live = item.live ? ' <span class="badge-live" style="margin-left:6px"></span>' : '';
      const val  = item.url
        ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">${md(item.value)}</a>${live}`
        : md(item.value) + live;
      return `<div class="row">
        <div class="l">${esc(item.label)}</div>
        <div class="v">${val}</div>
      </div>`;
    }).join('');
    const updated = data.updated
      ? `<div class="row"><div class="l">Updated</div><div class="v">${new Date(data.updated).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</div></div>`
      : '';
    el.innerHTML = rows + updated;
  }

  // ─── TIMELINE ──────────────────────────────────────
  function renderTimeline(targetId, data, opts = {}){
    const el = document.getElementById(targetId);
    if (!el || !data) return;
    const variant = opts.variant || 'atlas';
    const rows = data.entries.map(e => {
      if (variant === 'desktop'){
        return `<div class="row">
          <div class="l">${esc(e.year)}</div>
          <div>${esc(e.role)} · <em>${esc(e.org)}</em>${e.where ? ' · ' + esc(e.where) : ''}</div>
        </div>`;
      }
      return `<div class="yr">
        <div class="y">${esc(e.year)}</div>
        <div class="t">${esc(e.role)}</div>
        <div class="o">${esc(e.org)}${e.where ? ' · ' + esc(e.where) : ''}</div>
      </div>`;
    }).join('');
    el.innerHTML = rows;
  }

  // ─── READING LIST ──────────────────────────────────
  function renderReading(targetId, data){
    const el = document.getElementById(targetId);
    if (!el || !data) return;
    el.innerHTML = data.reading.map(b =>
      `<li><span class="dot"></span><span>${esc(b.author)} — <em>${esc(b.title)}</em></span></li>`
    ).join('');
  }

  // ─── CERTS ─────────────────────────────────────────
  function renderCerts(targetId, data, opts = {}){
    const el = document.getElementById(targetId);
    if (!el || !data) return;
    const variant = opts.variant || 'atlas';
    if (variant === 'desktop'){
      el.innerHTML = data.groups.map(g => `
        <h3>${esc(g.name.toLowerCase())}</h3>
        ${g.items.map(it =>
          `<span class="chip${it.highlight ? ' ac' : ''}">${esc(it.title)}</span>`
        ).join('')}
      `).join('');
    } else {
      const flat = data.groups.flatMap(g => g.items);
      el.innerHTML = flat.map(it =>
        `<div class="row"><span>${esc(it.title)}${it.issuer ? ' · ' + esc(it.issuer) : ''}</span><span class="yr">${esc(it.year)}</span></div>`
      ).join('') + `<div class="meta">${data.groups.length} groups · ${flat.length} certs total</div>`;
    }
  }

  // ─── CONTACT ───────────────────────────────────────
  function renderContact(targetId, data, opts = {}){
    const el = document.getElementById(targetId);
    if (!el || !data) return;
    const variant = opts.variant || 'atlas';
    if (variant === 'desktop'){
      el.innerHTML = `
        <h2>say hi.</h2>
        <p>Open to: ${esc(data.openTo)}.</p>
        <ul style="font-size:18px;line-height:1.7">
          ${data.links.map(l =>
            `<li><a href="${esc(l.url)}">${esc(l.label.toLowerCase())} →</a>${l.note ? ' <span style="color:var(--ink-3);font-size:14px">· ' + esc(l.note) + '</span>' : ''}</li>`
          ).join('')}
        </ul>
      `;
    } else {
      el.innerHTML = `
        <div class="k">Contact</div>
        <h3 style="margin-bottom:10px">Write in.</h3>
        ${data.links.map(l =>
          `<a href="${esc(l.url)}"><span>${esc(l.label)}</span><span class="arrow">${l.note ? '↗ ' + esc(l.note) : '↗'}</span></a>`
        ).join('')}
        <div class="meta">Open to: ${esc(data.openTo)}</div>
      `;
    }
  }

  // ─── WORK (from markdown files) ────────────────────
  function renderWorkTiles(items, opts = {}){
    return items
      .sort((a,b) => (a.frontmatter.order || 99) - (b.frontmatter.order || 99))
      .map((it, i) => {
        const fm = it.frontmatter;
        return { fm, body: it.body, i };
      });
  }

  // ─── ART (photo + design grid) ─────────────────────
  function renderArt(targetId, data, opts = {}){
    const el = document.getElementById(targetId);
    if (!el || !data) return;
    const variant = opts.variant || 'atlas';
    const max = opts.max || data.items.length;
    const items = data.items.slice(0, max);
    if (variant === 'desktop'){
      el.innerHTML = items.map(item => `
        <div class="polaroid">
          <div class="photo" style="${item.src ? `background:url('../content/${esc(item.src)}') center/cover` : ''}">${item.src ? '' : esc((item.id||'').toUpperCase().replace(/-/g,' '))}</div>
          ${esc(item.caption)}
        </div>
      `).join('');
    }
    // For atlas, individual cards are rendered separately (positioned in HTML)
  }

  // ─── ZINES ─────────────────────────────────────────
  function renderZines(targetId, items, opts = {}){
    const el = document.getElementById(targetId);
    if (!el || !items) return;
    const variant = opts.variant || 'atlas';
    const pathPrefix = '../';

    if (!items.length){
      el.innerHTML = '<p style="color:var(--ink-3)">No zines yet — drop files in <code>zines/</code>.</p>';
      return;
    }

    const sorted = [...items].sort((a,b) =>
      (b.frontmatter.date||'').localeCompare(a.frontmatter.date||''));

    function availBadge(a){
      if (!a) return '';
      const cfg = {
        'available': 'background:#d4f5d4;color:#1a6b1a',
        'sold-out':  'background:#fde8e8;color:#8b1a1a',
        'free':      'background:#e8e8e8;color:#555'
      };
      return `<span style="font-size:11px;padding:2px 7px;border-radius:3px;${cfg[a]||'background:#eee;color:#555'}">${esc(a)}</span>`;
    }

    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:16px">
      ${sorted.map(z => {
        const fm = z.frontmatter;
        const imgPath = fm.cover ? pathPrefix + fm.cover : '';
        const date = fm.date ? new Date(fm.date).toLocaleDateString(undefined,{year:'numeric',month:'short'}) : '';
        return `<div class="zine-card" data-slug="${esc(fm.slug)}" style="cursor:pointer">
          <div style="aspect-ratio:0.71;${imgPath ? `background:url('${esc(imgPath)}') center/cover` : 'background:var(--accent,#c8d5e8)'};border-radius:3px;margin-bottom:8px;border:1px solid rgba(0,0,0,0.08)"></div>
          <div style="font-size:13px;font-weight:500;line-height:1.3">${esc(fm.title)}</div>
          <div style="display:flex;gap:5px;align-items:center;margin-top:4px;flex-wrap:wrap">
            ${date ? `<span style="font-size:11px;color:var(--ink-3)">${date}</span>` : ''}
            ${availBadge(fm.availability)}
          </div>
        </div>`;
      }).join('')}
    </div>`;

    el.querySelectorAll('.zine-card').forEach(card => {
      card.addEventListener('click', () => {
        const zine = items.find(z => z.frontmatter.slug === card.dataset.slug);
        if (zine) openZineReader(zine.frontmatter, variant);
      });
    });
  }

  function openZineReader(fm, variant){
    const pathPrefix = '../';
    const rawPages = Array.isArray(fm.pages) ? fm.pages : (fm.pages ? [fm.pages] : []);
    const spreadSet = new Set(
      (Array.isArray(fm.spreadIndices) ? fm.spreadIndices :
       (fm.spreadIndices != null ? [fm.spreadIndices] : []))
      .map(Number)
    );

    function buildViews(srcs){
      const vs = [];
      let i = 0;
      if (srcs.length > 0 && !spreadSet.has(0)){
        vs.push({ type: 'right-only', srcs: [srcs[0]] });
        i = 1;
      }
      while (i < srcs.length){
        if (spreadSet.has(i)){
          vs.push({ type: 'spread', srcs: [srcs[i]] });
          i++;
        } else {
          const next = i + 1;
          if (next < srcs.length && !spreadSet.has(next)){
            vs.push({ type: 'pair', srcs: [srcs[i], srcs[next]] });
            i += 2;
          } else {
            vs.push({ type: 'pair', srcs: [srcs[i]] });
            i++;
          }
        }
      }
      return vs;
    }

    const pdfPath = fm.pdf ? pathPrefix + fm.pdf : '';

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.93);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:inherit';
    overlay.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
        <div style="color:rgba(255,255,255,0.6);font-size:13px">${esc(fm.title)}${fm.edition ? ' · ' + esc(fm.edition) : ''}</div>
        <div style="display:flex;gap:10px;align-items:center">
          ${pdfPath && fm.pdfDownload ? `<a href="${esc(pdfPath)}" download style="color:rgba(255,255,255,0.6);font-size:12px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);padding:3px 10px;border-radius:3px">↓ PDF</a>` : ''}
          <button id="zr-close" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:28px;cursor:pointer;line-height:1;padding:0 4px">×</button>
        </div>
      </div>
      <div id="zr-spread" style="display:flex;align-items:center;justify-content:center;gap:2px;max-height:78vh;max-width:90vw;flex:1;margin-top:52px;margin-bottom:16px"></div>
      <div style="display:flex;align-items:center;gap:16px;padding-bottom:24px">
        <button id="zr-prev" style="background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.8);padding:6px 18px;border-radius:4px;cursor:pointer;font-size:20px">‹</button>
        <span id="zr-counter" style="color:rgba(255,255,255,0.35);font-size:12px;min-width:60px;text-align:center"></span>
        <button id="zr-next" style="background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.8);padding:6px 18px;border-radius:4px;cursor:pointer;font-size:20px">›</button>
      </div>
    `;
    document.body.appendChild(overlay);

    let views = [];
    let current = 0;

    const PAGE_STYLE  = 'max-height:76vh;max-width:44vw;object-fit:contain;display:block;border-radius:2px';
    const FULL_STYLE  = 'max-height:76vh;max-width:88vw;object-fit:contain;display:block;border-radius:2px';
    const BLANK_STYLE = 'display:block;height:76vh;width:calc(min(44vw, 76vh * 0.71));background:rgba(255,255,255,0.03);border-radius:2px';

    function showView(){
      const spreadEl = document.getElementById('zr-spread');
      const counter  = document.getElementById('zr-counter');
      if (!spreadEl) return;
      const v = views[current];
      if (!v){ spreadEl.innerHTML = ''; return; }

      if (v.type === 'spread'){
        spreadEl.innerHTML = `<img src="${esc(v.srcs[0])}" style="${FULL_STYLE}" alt="spread">`;
      } else if (v.type === 'right-only'){
        spreadEl.innerHTML = `<span style="${BLANK_STYLE}"></span><img src="${esc(v.srcs[0])}" style="${PAGE_STYLE}" alt="cover">`;
      } else {
        const [l, r] = v.srcs;
        spreadEl.innerHTML =
          `<img src="${esc(l)}" style="${PAGE_STYLE}" alt="left">` +
          (r ? `<img src="${esc(r)}" style="${PAGE_STYLE}" alt="right">` : `<span style="${BLANK_STYLE}"></span>`);
      }

      if (counter) counter.textContent = `${current + 1} / ${views.length}`;
      const prev = document.getElementById('zr-prev');
      const next = document.getElementById('zr-next');
      if (prev) prev.style.opacity = current === 0 ? '0.2' : '1';
      if (next) next.style.opacity = current === views.length - 1 ? '0.2' : '1';
    }

    function close(){
      overlay.remove();
      window.removeEventListener('keydown', onKey);
    }
    function onKey(e){
      if (e.key === 'Escape') close();
      else if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && current > 0){ current--; showView(); }
      else if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && current < views.length - 1){ current++; showView(); }
    }
    window.addEventListener('keydown', onKey);

    document.getElementById('zr-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.getElementById('zr-prev').addEventListener('click', () => { if (current > 0){ current--; showView(); } });
    document.getElementById('zr-next').addEventListener('click', () => { if (current < views.length - 1){ current++; showView(); } });

    if (rawPages.length){
      views = buildViews(rawPages.map(p => pathPrefix + p));
      showView();
    } else if (fm.pdf){
      const spreadEl = document.getElementById('zr-spread');
      if (spreadEl) spreadEl.innerHTML = '<p style="color:rgba(255,255,255,0.5);font-size:13px;text-align:center">Loading PDF…</p>';
      import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.mjs').then(async pdfjsLib => {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.mjs';
        const pdf = await pdfjsLib.getDocument(pdfPath).promise;
        const pageSrcs = [];
        for (let p = 1; p <= pdf.numPages; p++){
          const page = await pdf.getPage(p);
          const vp = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width; canvas.height = vp.height;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
          pageSrcs.push(canvas.toDataURL());
        }
        views = buildViews(pageSrcs);
        showView();
      }).catch(() => {
        const spreadEl2 = document.getElementById('zr-spread');
        if (spreadEl2) spreadEl2.innerHTML = '<p style="color:rgba(255,255,255,0.5);font-size:13px;text-align:center">Could not load PDF.<br>Use the download button above.</p>';
      });
    }
  }

  window.Render = {
    esc, md,
    renderHero, renderAbout, renderNow, renderTimeline,
    renderReading, renderCerts, renderContact,
    renderWorkTiles, renderArt,
    renderZines, openZineReader
  };
})();
