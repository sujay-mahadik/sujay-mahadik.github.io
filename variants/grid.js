/* sujay.grid — dark editorial bento. Loads shared content, renders bespoke. */
(async () => {
  const esc = Render.esc;
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

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
      const heroPath = '../content/' + (profile.heroImage || 'art/hero.jpg');
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

  // ─── Statement (field note) ────────────────────────────────
  const note = fieldNotes && fieldNotes.notes && fieldNotes.notes[0];
  if (note) {
    $('statement-quote').innerHTML = Render.md(note.text || '');
    const d = note.date ? new Date(note.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
    const sub = (note.subtitle || '').replace(/^[-–—]\s*/, '');
    const attrib = [sub, d].filter(Boolean).join(' · ');
    $('statement-attrib').textContent = attrib ? `— ${attrib}` : '— field note';
  } else {
    $('statement-quote').innerHTML = 'The pipeline is a kind of <em>prayer</em>.';
    $('statement-attrib').textContent = '— field note';
  }

  // ─── Now ledger ────────────────────────────────────────────
  if (now && now.items) {
    $('now-rows').innerHTML = now.items.slice(0,6).map(it => {
      const live = it.live ? '<span class="bd"></span>' : '';
      const v = it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.value)}</a>${live}` : esc(it.value) + live;
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
        coverEl.style.backgroundImage = `url('../${z.frontmatter.cover}')`;
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
