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
  const [profile, now, contact, timeline, reading, certs, art, fieldNotes] = await Promise.all([
    Content.loadJSON('profile'), Content.loadJSON('now'), Content.loadJSON('contact'),
    Content.loadJSON('timeline'), Content.loadJSON('reading'), Content.loadJSON('certs'),
    Content.loadJSON('art'), Content.loadJSON('field-notes'),
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

  // ─── Photos contact sheet ──────────────────────────────────
  const frame = (a, withCap=true) => {
    const cap = withCap ? `<span class="cap">${esc(a.caption || a.id || '')}</span>` : '';
    return `<div class="frame">${cap}</div>`;
  };
  if (art && art.items) {
    const items = art.items;
    const show = items.slice(0,4);
    let html = show.map((a,i) => {
      if (i === 3 && items.length > 4) {
        return `<div class="frame"><div class="plus">+${items.length - 3}</div></div>`;
      }
      return frame(a);
    }).join('');
    $('photo-sheet').innerHTML = html;
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

  // ─── Zines ─────────────────────────────────────────────────
  if (zines && zines.length) {
    const z = zines[0];
    $('zines-title').textContent = z.frontmatter.title;
    $('zines-sub').textContent = `${zines.length} published · ${fmtDate(z.frontmatter.date)}`;
    if (z.frontmatter.cover) {
      const coverEl = document.querySelector('#c-zines .zcover');
      if (coverEl) {
        coverEl.style.backgroundImage = `url('${_ROOT}${z.frontmatter.cover}')`;
        coverEl.style.backgroundSize = 'cover';
        coverEl.style.backgroundPosition = 'center';
      }
    }
  } else {
    $('zines-title').textContent = 'No zines yet';
    $('zines-sub').textContent = 'coming soon';
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
      const grid = (art.items||[]).map(a=>{
        const meta = [a.location||a.client, a.date].filter(Boolean).join(' · ');
        const capText = esc(a.caption||'') + (meta?' — '+esc(meta):'') + (a.url?' ↗':'');
        const inner = `<span class="cap">${capText}</span>`;
        if (a.url) return `<a href="${esc(a.url)}" target="_blank" rel="noopener" class="frame linked">${inner}</a>`;
        return `<div class="frame">${inner}</div>`;
      }).join('');
      return `<div class="m-kicker">03 · photography &amp; design</div><h2>The Drawer</h2><div class="m-art">${grid}</div>`;
    },
    zines(){
      open(`<div class="m-kicker">09 · zines</div><h2>Zines</h2><div id="zwrap"></div>`);
      if (zines && zines.length) Render.renderZines('zwrap', zines, { variant: 'grid' });
      else $('zwrap') && ($('zwrap').innerHTML = '<p style="color:var(--ink-2)">No zines yet.</p>');
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
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });

  // ─── helpers ───────────────────────────────────────────────
  function fmtDate(d){ if(!d) return ''; try { return new Date(d).toLocaleDateString('en-GB',{month:'short',year:'numeric'}); } catch(e){ return String(d); } }
})();
