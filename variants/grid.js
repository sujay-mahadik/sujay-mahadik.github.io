/* sujay.site — dark editorial bento. Loads shared content, renders bespoke. */
(async () => {
  // Capture before any await — document.currentScript is null after
  const _cs = document.currentScript;
  const _ROOT = _cs ? new URL('..', _cs.src).href : '';
  const esc = Render.esc;
  const $ = (id) => document.getElementById(id);
  const noteSize = (text) => {
    const len = (text || '').length;
    // if (len < 100) return 'clamp(14px, 1.6vw, 20px)';
    // if (len < 200) return 'clamp(11px, 1.2vw, 14px)';
    // if (len < 400) return 'clamp(9px, 1vw, 12px)';
    // return 'clamp(8px, 0.9vw, 10px)';
    if (len < 100) return 'clamp(12px, 1.3vw, 16px)';
if (len < 200) return 'clamp(9px, 1vw, 12px)';
if (len < 350) return 'clamp(7px, 0.8vw, 10px)';
return 'clamp(6px, 0.7vw, 8px)';
  };
  const root = document.documentElement;

  const loader = $('loader');

  // ─── Theme toggle ──────────────────────────────────────────
  root.dataset.theme  = localStorage.getItem('grid-theme')  || 'dark';
  root.dataset.accent = localStorage.getItem('grid-accent') || 'warm';
  const tg = $('theme-tg');
  if (tg) {
    tg.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('grid-theme', root.dataset.theme);
    });
  }

  // ─── Custom cursor ─────────────────────────────────────────
  (() => {
    const dot  = $('cursor-dot');
    const ring = $('cursor-ring');
    if (!dot || !ring) return;
    if (!window.matchMedia('(pointer: fine)').matches) {
      dot.remove(); ring.remove(); return;
    }

    let mx = -200, my = -200, rx = -200, ry = -200;

    const INTERACTIVE = 'a, button, [data-modal], .tg, .modal-close, .frame, label';

    (function tick() {
      rx += (mx - rx) * 0.13;
      ry += (my - ry) * 0.13;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    })();

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    });
    document.addEventListener('mouseleave', () => root.classList.add('cursor-hidden'));
    document.addEventListener('mouseenter', () => root.classList.remove('cursor-hidden'));
    document.addEventListener('mouseover',  e => { if (e.target.closest(INTERACTIVE)) ring.classList.add('expanded'); });
    document.addEventListener('mouseout',   e => { if (e.target.closest(INTERACTIVE)) ring.classList.remove('expanded'); });
  })();

  // ─── Load everything ───────────────────────────────────────
  const [profile, now, contact, timeline, reading, certs, art, fieldNotes, cameras] = await Promise.all([
    Content.loadJSON('profile'), Content.loadJSON('now'), Content.loadJSON('contact'),
    Content.loadJSON('timeline'), Content.loadJSON('reading'), Content.loadJSON('certs'),
    Content.loadJSON('art'), Content.loadJSON('field-notes'), Content.loadJSON('cameras'),
  ]);
  const [work, writing, poetry, zines] = await Promise.all([
    Content.loadCollection('work', Content.MANIFESTS.work),
    Content.loadCollection('writing', Content.MANIFESTS.writing),
    Content.loadCollection('poetry', Content.MANIFESTS.poetry),
    Content.loadCollection('zines', Content.MANIFESTS.zines),
  ]);

  // ─── Dismiss loader ────────────────────────────────────────
  if (loader) {
    loader.classList.add('done');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }

  // ─── Marquee: influences ───────────────────────────────────
  if (reading && reading.influences) {
    const seq = reading.influences.map(i => `<span>${esc(i)}</span>`).join('<span class="dot">✦</span>');
    $('band').innerHTML = (seq + '<span class="dot">✦</span>').repeat(2);
  }
  $('edition').textContent = 'LAST UPDATED · ' + new Date().toLocaleDateString('en-GB',{month:'short',year:'numeric'}).toUpperCase();

  // ─── Hero ──────────────────────────────────────────────────
  if (profile) {
    const [first, ...rest] = profile.name.split(' ');
    $('hero-name').innerHTML = `${esc(first)}<br><em>${esc(rest.join(' '))}</em>`;
    $('hero-tag').textContent = profile.tagline;
    // $('hero-blurb').textContent = profile.blurb;
    // masthead + footer single-sourced from profile
    const mk = $('mark');
    // if (mk) mk.innerHTML = `${esc(first.toUpperCase())} <b>${esc(rest.join(' ').toUpperCase())}</b>`;
    const fc = $('foot-copy');
    if (fc && profile.location) fc.textContent = `© ${profile.name.toUpperCase()} · ${String(profile.location.city||'').toUpperCase()} ⇄ ${String((profile.location.from||'').split(',')[0]).toUpperCase()}`;
    // hero photo: drop a file at art/hero.jpg (or set profile.heroImage). Until then, placeholder.
    const media = $('hero-media');
    if (media) {
      const heroPath = _ROOT + 'content/' + (profile.heroImage || 'art/hero.jpg');
      const probe = new Image();
      probe.onload = () => { media.style.backgroundImage = `url('${heroPath}')`; media.classList.add('has-photo'); media.classList.remove('placeholder'); };
      probe.onerror = () => { media.classList.add('placeholder'); };
      probe.src = heroPath;
    }
  }
  if (contact && contact.links) {
    $('hero-links').innerHTML = contact.links.slice(0,4)
      .map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('');
  }
  // live-now from the "Listening" now item
  // if (now && now.items) {
  //   const listening = now.items.find(i => i.live) || now.items.find(i => /listen/i.test(i.label));
  //   if (listening) $('live-now').innerHTML = `<span class="live-dot"></span> ${esc(listening.value)}`;
  // }

  // ─── Statement (field notes — auto-cycle) ─────────────────
  const notes = fieldNotes?.notes ?? [];
  if (notes.length) {
    let noteIdx = 0;
    const bodyEl = $('note-body');
    const qEl = $('statement-quote');
    const aEl = $('statement-attrib');

    function renderNote(note) {
      qEl.innerHTML = Render.md(note.quote || '');
      qEl.style.fontSize = noteSize(note.quote);
      const attrib = [note.attribution, note.source_title].filter(Boolean).join(', ');
      aEl.textContent = attrib ? `— ${attrib}` : '— field note';
    }

    renderNote(notes[0]);

    if (notes.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const noteDuration = (text) => {
        const words = (text || '').trim().split(/\s+/).length;
        return Math.max(5000, Math.min(9000, words * 900));
      };
      let queue = [];
      const nextIdx = () => {
        if (!queue.length) {
          queue = notes.map((_, i) => i).filter(i => i !== noteIdx).sort(() => Math.random() - 0.5);
        }
        return queue.shift();
      };
      const cycle = () => {
        setTimeout(() => {
          bodyEl.classList.add('exit');
          setTimeout(() => {
            noteIdx = nextIdx();
            bodyEl.classList.remove('exit');
            bodyEl.classList.add('enter');
            renderNote(notes[noteIdx]);
            requestAnimationFrame(() => requestAnimationFrame(() => bodyEl.classList.remove('enter')));
            cycle();
          }, 500);
        }, noteDuration(notes[noteIdx].quote));
      };
      cycle();
    }
  } else {
    $('statement-quote').innerHTML = 'The pipeline is a kind of <em>prayer</em>.';
    $('statement-attrib').textContent = '— field note';
  }

  // ─── Now ledger ────────────────────────────────────────────
  if (now && now.items) {
    $('now-rows').innerHTML = now.items.slice(0,6).map(it => {
      const live = it.live ? '<span class="bd"></span>' : '';
      let v;
      if (it.label === 'Reading' && reading && reading.currently_reading && reading.currently_reading[0]) {
        const b = reading.currently_reading[0];
        v = `${esc(b.author)} / ${esc(b.title)}`;
      } else if (it.url) {
        v = `<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.value)}</a>${live}`;
      } else {
        v = esc(it.value) + live;
      }
      return `<div class="row"><div class="l">${esc(it.label)}</div><div class="v">${v}</div></div>`;
    }).join('');
  }

  // ─── Shelf tile — camera lineup ────────────────────────────
  if (cameras && cameras.cameras) {
    const cams = cameras.cameras;
    const glyphs = cams.slice(0, 4).map(c => c.src ? `<img class="sh-lineup-img" src="${esc(_ROOT + c.src)}" alt="${esc(c.name)}" loading="lazy">` : shCamGlyph(c.kind, 40)).join('');
    const more = cams.length > 4 ? `<span class="sh-more">+${cams.length - 4}</span>` : '';
    $('photo-sheet').innerHTML = `<div class="sh-lineup">${glyphs}${more}</div>`;
  }

  // ─── Work (compact, small tile) ──────────────────────────
  const workSorted = (work||[]).slice().sort((a,b)=>(a.frontmatter.order||99)-(b.frontmatter.order||99));
  if (workSorted.length) {
    $('work-count').textContent = String(workSorted.length).padStart(2,'0');
    const f = workSorted.find(w=>w.frontmatter.featured) || workSorted[0];
    const meta = [f.frontmatter.kind, f.frontmatter.year].filter(Boolean).join(' · ');
    $('work-feat').innerHTML = `<div class="big">${esc(f.frontmatter.title)}</div><div class="sub">${esc(meta)}</div>`;
  }

  // ─── Resume preview ────────────────────────────────────────
  if (timeline && timeline.entries && timeline.entries.length) {
    const e = timeline.entries[0];
    $('resume-now').textContent = e.role;
    $('resume-sub').innerHTML = `${esc(e.org)} · ${esc(e.where)}<br><span class="yr">${esc(e.year)}</span>`;
    const rl = $('resume-list');
    if (rl) rl.innerHTML = timeline.entries.slice(1,4)
      .map(x=>`<div class="ri"><span class="yr">${esc(x.year)}</span><span class="rl">${esc(x.role)} · <em>${esc(x.org)}</em></span></div>`).join('');
  }

  // ─── Reading ───────────────────────────────────────────────
  if (reading && reading.currently_reading) {
    $('reading-list').innerHTML = reading.currently_reading.slice(0,4)
      .map(b=>`<li>${esc(b.author)} — <em>${esc(b.title)}</em></li>`).join('');
  }

  // ─── Writing ───────────────────────────────────────────────
  const writingSorted = (writing||[]).slice().sort((a,b)=>new Date(b.frontmatter.date||0)-new Date(a.frontmatter.date||0));
  if (writingSorted.length) {
    const w = writingSorted[0];
    $('writing-latest').textContent = w.frontmatter.title;
    $('writing-date').textContent = fmtDate(w.frontmatter.date);
  }

  // ─── Certs ─────────────────────────────────────────────────
  if (certs && certs.groups) {
    const flat = certs.groups.flatMap(g=>g.items);
    $('certs-num').textContent = flat.length;
    $('certs-sub').textContent = `${certs.groups.length} fields · grouped`;
  }

  // ─── Contact ───────────────────────────────────────────────
  if (contact && contact.links) {
    $('contact-links').innerHTML = contact.links
      .map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}${l.note?' · '+esc(l.note):''} ↗</a>`).join('');
  }

  // ─── Zines tile — The Rack ─────────────────────────────────
  if (window.ZinesUI) {
    const zCard = $('c-zines');
    if (zCard) {
      // views keyed by slug — web-optimized files that actually exist
      const zineViews = {
        'hka-issue-three': [
          { name: 'cover',      slot: 'right' },
          { name: 'spread-01',  slot: 'full'  },
          { name: 'spread-02',  slot: 'full'  },
          { name: 'spread-05',  slot: 'full'  },
          { name: 'spread-08',  slot: 'full'  },
          { name: 'back-cover', slot: 'left'  }
        ]
      };
      const liveIssues = (zines || []).map(z => {
        const fm = z.frontmatter;
        const webBase = `assets/zines/${fm.slug}/web/`;
        return {
          ...fm,
          state: fm.availability || 'archive',
          name: fm.title,
          date: fmtDate(fm.date),
          cover: webBase + 'cover.jpg',
          views: zineViews[fm.slug] || []
        };
      });
      const catalogue = [
        { num: '01', name: 'First Frame',   state: 'archive' },
        { num: '02', name: 'Monsoon',       state: 'archive' },
        ...liveIssues,
        { num: '04', name: 'Dilli Darshan', state: 'soon'    }
      ];
      ZinesUI.mountTile(zCard, 'rack', { catalogue });
    }
  }

  // ─── Shelf helpers ─────────────────────────────────────────
  function shCamGlyph(kind, sz) {
    const h = Math.round(sz * 40 / 56);
    const slr = kind === 'slr', ps = kind === 'pointshoot';
    const lr = ps ? 6.5 : 8.5, li = ps ? 3.4 : 4.8, dcx = slr ? 11 : 46;
    const top = slr
      ? `<path class="top" d="M21 13 L24.5 5 H33.5 L37 13 Z"/>`
      : `<rect class="top" x="8" y="6.5" width="13" height="7" rx="2"/>`;
    const vf = ps ? `<rect class="vf" x="40" y="15" width="7" height="4" rx="1"/>` : '';
    return `<svg class="cam-glyph" width="${sz}" height="${h}" viewBox="0 0 56 40" aria-hidden="true">${top}<rect class="body" x="3" y="12" width="50" height="25" rx="5"/><circle class="lens-o" cx="28" cy="25" r="${lr}"/><circle class="lens-i" cx="28" cy="25" r="${li}"/><circle class="dot" cx="${dcx}" cy="17" r="1.8"/>${vf}</svg>`;
  }

  function shOpenLightbox(D, list, startIdx) {
    let idx = Math.max(0, Math.min(startIdx, list.length - 1));
    const lb = document.createElement('div');
    lb.className = 'sh-lightbox';
    function shStamp(d) { const p = String(d).split('-'); return `${p[1]||'··'} ${(p[0]||'').slice(2)}`; }
    function render() {
      const photo = list[idx];
      const film = D.films.find(f => f.id === photo.filmId) || {};
      const cam  = D.cameras.find(c => c.id === photo.cameraId) || {};
      lb.innerHTML = `
        <button class="lb-close" aria-label="Close">✕</button>
        <div class="lb-inner">
          <div class="lb-stage">
            ${list.length > 1 ? `<button class="lb-nav prev" aria-label="Previous">‹</button>` : ''}
            <div class="lb-print${film.mono ? ' mono' : ''}${photo.src ? ' has-img' : ''}">
              <div class="win">
                ${photo.src
                  ? `<img class="lb-img" src="${esc(photo.src)}" alt="${esc(photo.caption)}">`
                  : `<div class="lb-hint">drop scan · ${esc(photo.id)}.jpg</div>`}
                <div class="px" style="position:absolute;right:12px;bottom:10px">${shStamp(photo.date)}</div>
              </div>
              <div class="strip">
                <span class="c">${esc(photo.caption)}</span>
                <span class="n">${esc(photo.settings||'')}</span>
              </div>
            </div>
            ${list.length > 1 ? `<button class="lb-nav next" aria-label="Next">›</button>` : ''}
          </div>
          <div class="lb-side">
            <div class="k">frame · ${esc((photo.id||'').toUpperCase())}</div>
            <h3>${esc(photo.caption)}</h3>
            <div class="loc">${esc(photo.location||'')} · ${esc(photo.date||'')}</div>
            <dl class="lb-meta">
              <dt>Film</dt><dd><span class="lb-tag"><span class="sw" style="background:${film.swatch||''}"></span>${esc(film.name||'')}</span></dd>
              <dt>Camera</dt><dd><span class="lb-tag">${esc(cam.name||'')}</span></dd>
              <dt>ISO</dt><dd>${film.iso||''}</dd>
              <dt>Settings</dt><dd>${esc(photo.settings||'')}</dd>
            </dl>
            <div class="lb-count">${idx + 1} / ${list.length}</div>
          </div>
        </div>`;
      lb.querySelector('.lb-close').onclick = closeLb;
      const prev = lb.querySelector('.lb-nav.prev');
      const next = lb.querySelector('.lb-nav.next');
      if (prev) prev.onclick = () => { if (idx > 0) { idx--; render(); } };
      if (next) next.onclick = () => { if (idx < list.length - 1) { idx++; render(); } };
      const imgEl = lb.querySelector('.lb-img');
      if (imgEl) {
        const win = lb.querySelector('.lb-print .win');
        function applyRatio() {
          const w = imgEl.naturalWidth, h = imgEl.naturalHeight;
          if (!w || !h) return;
          win.style.aspectRatio = `${w} / ${h}`;
          win.style.setProperty('--lb-ratio', h / w);
        }
        if (imgEl.complete && imgEl.naturalWidth) applyRatio();
        else imgEl.addEventListener('load', applyRatio, { once: true });
      }
    }
    function closeLb() {
      lb.classList.remove('open');
      window.removeEventListener('keydown', onKey);
      setTimeout(() => lb.remove(), 220);
    }
    function onKey(e) {
      if (!lb.isConnected) { window.removeEventListener('keydown', onKey); return; }
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowRight' && idx < list.length - 1) { idx++; render(); }
      else if (e.key === 'ArrowLeft' && idx > 0) { idx--; render(); }
    }
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    window.addEventListener('keydown', onKey);
    render();
    document.body.appendChild(lb);
    requestAnimationFrame(() => lb.classList.add('open'));
  }

  // ─── Modal system ──────────────────────────────────────────
  const overlay = $('overlay'), body = $('modal-body');
  function open(html){ body.innerHTML = html; overlay.classList.add('open'); document.body.style.overflow='hidden'; }
  function close(){ overlay.classList.remove('open'); document.body.style.overflow=''; setTimeout(()=>{ if(!overlay.classList.contains('open')) body.innerHTML=''; }, 220); }

  const modals = {
    work(){
      const rows = workSorted.map(w=>{
        const fm = w.frontmatter;
        const meta = [fm.kind, fm.client||fm.location, fm.year].filter(Boolean).join(' · ');
        const tags = Array.isArray(fm.tags)?fm.tags.join(' / '):'';
        return `<div class="m-row">
          <div class="y">${esc(meta)}</div>
          <div class="t">${esc(fm.title)}${fm.metric?` <span style="font-family:var(--mono);font-size:13px;color:var(--spark)">${esc(fm.metric)}</span>`:''}</div>
          <p>${esc(fm.summary||'')}</p>
          ${tags?`<div class="tags">${esc(tags)}</div>`:''}
        </div>`;
      }).join('');
      return `<div class="m-kicker">04 · selected work</div><h2>Work</h2>${rows}`;
    },
    resume(){
      const notes = (arr) => arr&&arr.length ? `<ul class="m-notes">${arr.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>` : '';
      const exp = (timeline.entries||[]).map(e=>`<div class="m-row"><div class="y">${esc(e.year)}</div><div class="t">${esc(e.role)}</div><div class="o">${esc(e.org)}${e.where?' · '+esc(e.where):''}</div>${e.description?`<p>${esc(e.description)}</p>`:''}${notes(e.notes)}</div>`).join('');
      const edu = (profile.education||[]).map(e=>`<div class="m-row"><div class="y">${esc(e.year)}</div><div class="t">${esc(e.what)}</div><div class="o">${esc(e.where)}${e.grade?' · '+esc(e.grade):''}</div>${e.description?`<p>${esc(e.description)}</p>`:''}${notes(e.notes)}</div>`).join('');
      return `<div class="m-kicker">05 · the long arc</div><h2>Résumé</h2>${exp}<h3>Education</h3>${edu}`;
    },
    reading(){
      const bookRow = b =>
        `<div class="m-row"><div class="t" style="font-size:19px">${esc(b.title)}</div><div class="o">${esc(b.author)}</div></div>`;
      const section = (heading, arr) => {
        const html = (arr||[]).map(bookRow).join('');
        return html ? `<h3>${heading}</h3>${html}` : '';
      };
      const infl = `<div class="m-chips">${(reading.influences||[]).map(i=>`<span class="chip">${esc(i)}</span>`).join('')}</div>`;
      return [
        `<div class="m-kicker">08 · on the desk</div><h2>Reading</h2>`,
        section('Currently Reading', reading.currently_reading),
        section('Read', reading.read),
        section('To Read', reading.to_read),
        `<h3>Influences</h3>${infl}`,
      ].join('');
    },
    writing(){
      const essays = writingSorted.map(w=>`<div class="m-row"><div class="y">${esc(fmtDate(w.frontmatter.date))}${w.frontmatter.readMinutes?' · '+w.frontmatter.readMinutes+' min':''}</div><div class="t">${esc(w.frontmatter.title)}</div><p>${esc(w.frontmatter.summary||'')}</p></div>`).join('');
      const poemHtml = (poetry||[]).map(p=>{
        const lines = (p.body||'').trim().split('\n').map(l=>Render.md(l)).join('<br>');
        return `<div class="m-poem">${lines}<div class="attrib">— ${esc(p.frontmatter.title)}</div></div>`;
      }).join('');
      return `<div class="m-kicker">07 · words</div><h2>Writing</h2><h3>Essays</h3>${essays}<h3>Poetry corner</h3>${poemHtml}`;
    },
    certs(){
      const groups = certs.groups.map(g=>`<h3>${esc(g.name)}</h3><div class="m-chips">${g.items.map(it=>`<span class="chip${it.highlight?' hi':''}">${esc(it.title)}${it.year?' · '+esc(it.year):''}</span>`).join('')}</div>`).join('');
      return `<div class="m-kicker">08 · the streak</div><h2>Certifications</h2>${groups}`;
    },
    photos(){
      if (!cameras || !cameras.cameras) {
        return `<div class="m-kicker">06 · the shelf</div><h2>The Shelf</h2><p style="color:var(--ink-2)">Coming soon.</p>`;
      }
      const D = cameras;
      const filmById = id => D.films.find(f => f.id === id) || {};
      const stamp = d => { const p = String(d).split('-'); return `${p[1]||'··'} ${(p[0]||'').slice(2)}`; };
      function canistersHTML() {
        const all = `<button class="canister all active" data-filmid="__all" title="All stocks"><span class="can-spool"></span><span class="can-body"><span class="can-wrap"><span class="cb-brand">every</span><span class="cb-line">ALL</span><span class="cb-iso">stock</span></span></span><span class="can-count">${D.photos.length}</span></button>`;
        return all + D.films.map(f => `<button class="canister${f.mono?' mono':''}" data-filmid="${esc(f.id)}" title="${esc(f.name)}" ><span class="can-spool"></span><span class="can-body" style="--label:${f.swatch};--label-ink:${f.ink}"><span class="can-wrap"><span class="cb-brand">${esc(f.brand)}</span><span class="cb-line">${esc(f.line)}</span><span class="cb-iso">${f.iso}</span></span></span><span class="can-count">${D.photos.filter(p=>p.filmId===f.id).length}</span></button>`).join('');
      }
      function gearRowHTML(cam) {
        const cnt = String(D.photos.filter(p=>p.cameraId===cam.id).length).padStart(2,'0');
        const icon = cam.src
          ? `<img class="gear-cam-img" src="${esc(cam.src)}" alt="${esc(cam.name)}" loading="lazy">`
          : shCamGlyph(cam.kind, 38);
        return `<div class="sh-gear-cell" data-cam="${esc(cam.id)}"><button class="gear-row" data-camid="${esc(cam.id)}">${icon}<span class="gtxt"><span class="gname">${esc(cam.name)}</span><span class="gmeta">${esc(cam.type)} · ${esc(cam.year)}</span></span><span class="gcount">${cnt}</span></button><div class="gspec"><div class="gspec-in"><dl><dt>Maker</dt><dd>${esc(cam.maker)}</dd><dt>Format</dt><dd>${esc(cam.format)}</dd><dt>Lens</dt><dd>${esc(cam.lens)}</dd><dt>Frames</dt><dd>${cnt} on the wall</dd></dl><p class="note">${esc(cam.note||'')}</p></div></div></div>`;
      }
      function printHTML(photo, idx) {
        const film = filmById(photo.filmId);
        const winInner = photo.src
          ? `<img class="print-img" src="${esc(photo.src)}" alt="${esc(photo.caption)}" loading="lazy"><div class="tint" style="background:${film.swatch||''}; opacity:0.15"></div><div class="px">${stamp(photo.date)}</div>`
          : `<div class="tint" style="background:${film.swatch||''}"></div><div class="px">${stamp(photo.date)}</div>`;
        return `<button class="print${film.mono?' mono':''}${photo.src?' has-img':''}" data-pidx="${idx}"><div class="win">${winInner}</div><div class="meta"><div class="pc">${esc(photo.caption)}</div><div class="pm"><span class="sw" style="background:${film.swatch||''}"></span>${esc(film.name||'')} · ${esc(photo.location||'')}</div></div></button>`;
      }
      open(`<div class="sh-wrap">
        <div class="sh-head">
          <div class="m-kicker">06 · the shelf</div>
          <h2>The Shelf</h2>
          <p class="sub">${D.cameras.length} bodies, a drawer of film, and the frames they made. Pick a body or stock to filter — tap any print to enlarge.</p>
        </div>
        <div class="sh-body">
          <aside class="gear" id="sh-gear"><h4>The bodies — ${D.cameras.length}</h4>${D.cameras.map(gearRowHTML).join('')}</aside>
          <div class="gallery-wrap">
            <div class="filmbar"><h4>On film — tap a canister</h4><div class="film-chips" id="sh-chips">${canistersHTML()}</div><div class="sh-active-cam" id="sh-active-cam"></div></div>
            <div class="gallery" id="sh-gallery"></div>
          </div>
        </div>
      </div>`);
      let camFilter = null, filmFilter = null, expanded = null;
      function getFiltered() { return D.photos.filter(p => (!filmFilter||p.filmId===filmFilter) && (!camFilter||p.cameraId===camFilter)); }
      function renderGallery() {
        const filtered = getFiltered();
        const gallery = $('sh-gallery');
        if (!gallery) return;
        if (!filtered.length) { gallery.className='gallery empty'; gallery.textContent='no frames match — try another stock.'; }
        else {
          gallery.className='gallery';
          gallery.innerHTML = filtered.map(printHTML).join('');
          gallery.querySelectorAll('.print').forEach((btn, i) => { btn.onclick = () => shOpenLightbox(D, filtered, i); });
        }
        document.querySelectorAll('#sh-chips [data-filmid]').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.filmid==='__all' ? !filmFilter : btn.dataset.filmid===filmFilter);
        });
        document.querySelectorAll('#sh-gear .gear-row').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.camid===camFilter);
        });
        document.querySelectorAll('#sh-gear .sh-gear-cell').forEach(cell => {
          cell.classList.toggle('open', cell.dataset.cam===expanded);
        });
        const acEl = $('sh-active-cam');
        if (acEl) {
          if (camFilter) { const cam = D.cameras.find(c=>c.id===camFilter); acEl.className='sh-active-cam visible'; acEl.innerHTML=`showing ${esc(cam.name)} <button id="sh-clear-cam" aria-label="clear camera filter">✕</button>`; const clr=$('sh-clear-cam'); if(clr)clr.onclick=()=>{camFilter=null;expanded=null;renderGallery();}; }
          else { acEl.className='sh-active-cam'; acEl.innerHTML=''; }
        }
      }
      const shGear = $('sh-gear');
      if (shGear) shGear.addEventListener('click', e => {
        const btn = e.target.closest('.gear-row');
        if (!btn) return;
        const id = btn.dataset.camid;
        if (camFilter===id) { camFilter=null; expanded=null; } else { camFilter=id; expanded=id; }
        renderGallery();
      });
      const shChips = $('sh-chips');
      if (shChips) shChips.addEventListener('click', e => {
        const btn = e.target.closest('[data-filmid]');
        if (!btn) return;
        const fid = btn.dataset.filmid;
        filmFilter = fid==='__all' ? null : (filmFilter===fid ? null : fid);
        renderGallery();
      });
      renderGallery();
      return null;
    },
    zines(){
      open(`<div class="m-kicker">08 · zines</div><h2>Zines</h2><div id="zwrap"></div>`);
      const w = $('zwrap');
      if (w && window.ZinesUI) { w.innerHTML = ZinesUI.rackHTML(); ZinesUI.wireRack(w); }
      else if (w) { w.innerHTML = '<p style="color:var(--ink-2)">No zines yet.</p>'; }
      return null;
    },
    notes(){
      const items = (fieldNotes?.notes ?? []).map(n => {
        const lines = (n.quote || '').split('\n').map(l => Render.md(l)).join('<br>');
        const src = [n.source_title, n.source_page ? `p. ${n.source_page}` : ''].filter(Boolean).join(' · ');
        const sub = [n.attribution, src].filter(Boolean).join(' — ');
        return `<div class="m-row"><div class="t" style="font-size:17px;line-height:1.45">${lines}</div>${sub ? `<div class="o">${esc(sub)}</div>` : ''}</div>`;
      }).join('');
      return `<div class="m-kicker">01 · field notes</div><h2>Notes</h2>${items}`;
    },
  };

  document.querySelectorAll('.card.click[data-modal]').forEach(c=>{
    c.addEventListener('click', ()=>{
      const html = modals[c.dataset.modal] && modals[c.dataset.modal]();
      if (html) open(html);
    });
  });
  overlay.addEventListener('click', e=>{ if(e.target===overlay) close(); });
  document.querySelector('.modal-close').addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !document.querySelector('.zns-reader') && !document.querySelector('.sh-lightbox.open')) close(); });

  // ─── helpers ───────────────────────────────────────────────
  function fmtDate(d){ if(!d) return ''; try { return new Date(d).toLocaleDateString('en-GB',{month:'short',year:'numeric'}); } catch(e){ return String(d); } }
})();
