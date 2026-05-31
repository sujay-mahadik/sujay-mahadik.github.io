/* cycle-house.js — cycling panel (Strava) + Slytherin sorting + easter eggs.
   Loaded AFTER variants/grid.js. Self-contained: loads its own strava.json,
   attaches its own card/modal handlers, and never fights grid.js. */
(async () => {
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const esc = (window.Render && Render.esc) || ((s) => String(s ?? ''));

  /* ── shared modal (reuse grid.js overlay) ─────────────────── */
  const overlay = $('overlay');
  const mbody = $('modal-body');
  const openModal = (html) => {
    if (!overlay || !mbody) return;
    mbody.innerHTML = html;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  /* ════════ CYCLING PANEL ════════════════════════════════════ */
  let strava = null, profile = null;
  try {
    const [rs, rp] = await Promise.all([fetch('content/strava.json'), fetch('content/profile.json')]);
    if (rs.ok) strava = await rs.json();
    if (rp.ok) profile = await rp.json();
  } catch (e) { /* leave placeholders */ }

  if (strava) {
    const t = strava.totals || {};
    const bike = strava.bike || {};
    const rr = strava.recent_ride || {};

    if ($('cycle-bike')) $('cycle-bike').textContent = bike.name || 'Trek Marlin 5';
    if ($('cycle-distance')) {
      const km = Math.round(t.all_time_distance_km ?? 0);
      $('cycle-distance').innerHTML = `${km}<span class="sm"> km</span>`;
    }
    if ($('cycle-rides')) {
      const bits = [];
      if (t.all_time_rides) bits.push(`${t.all_time_rides} rides`);
      if (t.biggest_ride_km) bits.push(`${t.biggest_ride_km} km best`);
      $('cycle-rides').textContent = bits.length ? '· ' + bits.join(' · ') : '';
    }
    if ($('cycle-recent')) {
      if (rr.name) {
        const meta = [rr.distance_km ? `${rr.distance_km} km` : '', rr.moving_time || '', fmtDay((rr.date || '').slice(0, 10))]
          .filter(Boolean).join(' · ');
        $('cycle-recent').innerHTML =
          `<div class="rk">Last ride</div>
           <div class="rt">${esc(rr.name)}</div>
           <div class="rm">${esc(meta)}</div>`;
      } else {
        $('cycle-recent').innerHTML = `<div class="rk">Last ride</div><div class="rt">—</div>`;
      }
    }
    if ($('cycle-spec')) {
      const chips = [bike.type, bike.frame, bike.groupset, bike.year].filter(Boolean);
      $('cycle-spec').innerHTML = chips.map(c => `<span class="sp">${esc(c)}</span>`).join('');
    }

    /* bike photo probe — drop a file at content/art/bike.jpg */
    const media = $('cycle-media');
    if (media) {
      const path = 'content/' + (bike.photo || 'art/bike.jpg');
      const probe = new Image();
      probe.onload = () => { media.style.backgroundImage = `url('${path}')`; media.classList.add('has-photo'); media.classList.remove('placeholder'); };
      probe.src = path;
    }
  }

  /* cycle card → modal */
  const cycleCard = $('c-cycle');
  if (cycleCard) cycleCard.addEventListener('click', () => openModal(cycleModalHTML()));

  function cycleModalHTML() {
    const t = (strava && strava.totals) || {};
    const bike = (strava && strava.bike) || {};
    const rr = (strava && strava.recent_ride) || {};
    const synced = strava && strava.last_synced ? fmtDay(strava.last_synced.slice(0,10)) : '';
    const stat = (n, l) => `<div class="m-stat"><div class="ms-n">${n}</div><div class="ms-l">${l}</div></div>`;
    const totals = [
      stat(Math.round(t.all_time_distance_km ?? 0) + '<span style="font-size:.4em"> km</span>', 'distance, all-time'),
      stat(t.all_time_rides ?? '—', 'rides logged'),
      stat(t.biggest_ride_km ? t.biggest_ride_km + '<span style="font-size:.4em"> km</span>' : '—', 'longest ride'),
      stat(t.all_time_elevation_m ? Math.round(t.all_time_elevation_m).toLocaleString() + '<span style="font-size:.4em"> m</span>' : '—', 'elevation climbed'),
      stat(t.all_time_moving_time_h ? t.all_time_moving_time_h + '<span style="font-size:.4em"> h</span>' : '—', 'in the saddle'),
      stat('5<span style="font-size:.4em"> years</span>', 'age of the bike'),
    ].join('');
    const specRows = [
      ['Frame', bike.frame], ['Groupset', bike.groupset], ['Fork', bike.fork],
      ['Wheels', bike.wheels], ['Model year', bike.year],
    ].filter(([,v]) => v).map(([k,v]) =>
      `<div class="m-row" style="display:flex;justify-content:space-between;gap:14px;padding:9px 0">
         <span style="font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)">${esc(k)}</span>
         <span style="color:var(--ink)">${esc(v)}</span></div>`).join('');
    const recent = rr.name ? `
      <h3>Most recent ride</h3>
      <div class="m-row">
        <div class="t">${esc(rr.name)}${rr.url ? ` <a href="${esc(rr.url)}" target="_blank" rel="noopener" style="font-family:var(--mono);font-size:12px;color:var(--spark)">↗</a>` : ''}</div>
        <div class="o">${[rr.distance_km?rr.distance_km+' km':'', rr.moving_time||'', rr.elevation_m?rr.elevation_m+' m up':'', rr.avg_speed_kmh?rr.avg_speed_kmh+' km/h avg':'', fmtDay((rr.date||'').slice(0,10))].filter(Boolean).join(' · ')}</div>
      </div>` : '';
    return `
      <div class="m-kicker">10 · on two wheels</div>
      <h2>${esc(bike.name || 'Trek Marlin 5')}</h2>
      <p style="font-size:13.5px;color:var(--ink-2);line-height:1.55;margin:-10px 0 4px">
        ${esc(bike.type || 'Hardtail MTB')} — towpaths, trails and the long way home.</p>
      <div class="m-stats">${totals}</div>
      ${recent}
      <h3>Spec</h3>
      ${specRows}
      <p style="font-family:var(--mono);font-size:10px;letter-spacing:.04em;color:var(--ink-3);margin-top:20px;line-height:1.5">
        ↻ auto-synced from Strava${synced ? ' · last ' + esc(synced) : ''}.</p>`;
  }

  /* ════════ SLYTHERIN SORTING + EASTER EGGS ══════════════════ */
  const FOOT_DEFAULT = $('foot-updated') ? $('foot-updated').textContent : '';
  const FOOT_HOUSE = 'SORTED INTO SLYTHERIN · CUNNING FOLK USE ANY MEANS';

  function isSorted() { return root.dataset.house === 'slytherin'; }

  function applyFoot() {
    const f = $('foot-updated');
    if (f) f.textContent = isSorted() ? FOOT_HOUSE : FOOT_DEFAULT;
  }

  let heroObserver = null;

  function syncHeroImage(on) {
    const media = $('hero-media');
    if (!media) return;
    if (heroObserver) { heroObserver.disconnect(); heroObserver = null; }
    if (on) {
      const slyPath = 'content/' + ((profile && profile.heroImageSlytherin) || 'art/hero-slytherin.jpg');
      const apply = () => {
        media.style.backgroundImage = `url('${slyPath}')`;
        media.classList.add('has-photo');
        media.classList.remove('placeholder');
      };
      apply();
      /* grid.js sets the image asynchronously via an Image probe; re-apply if it overwrites us */
      heroObserver = new MutationObserver(apply);
      heroObserver.observe(media, { attributes: true, attributeFilter: ['style'] });
      setTimeout(() => { if (heroObserver) { heroObserver.disconnect(); heroObserver = null; } }, 4000);
    } else {
      const restorePath = 'content/' + ((profile && profile.heroImage) || 'art/hero.jpg');
      media.style.backgroundImage = `url('${restorePath}')`;
    }
  }

  function setHouse(on) {
    if (on) { root.dataset.house = 'slytherin'; localStorage.setItem('grid-house', 'slytherin'); }
    else { delete root.dataset.house; localStorage.setItem('grid-house', 'off'); }
    applyFoot();
    syncHouseUI();
    syncHeroImage(on);
  }

  function syncHouseUI() {
    const btn = document.querySelector('#c-house .house-toggle');
    if (btn) btn.textContent = isSorted() ? 'Remove house colours' : 'Apply house colours';
    const mtg = $('house-tg');
    if (mtg) mtg.setAttribute('aria-pressed', String(isSorted()));
  }

  /* restore persisted house state (FOUC script handles CSS; this syncs UI) */
  setHouse(localStorage.getItem('grid-house') === 'slytherin');

  /* masthead sort button */
  const houseTg = $('house-tg');
  if (houseTg) houseTg.addEventListener('click', () => {
    houseTg.classList.remove('sorting-anim');
    void houseTg.offsetWidth;
    houseTg.classList.add('sorting-anim');
    if (!isSorted()) { runSorting(() => setHouse(true)); }
    else { runSortingOut(() => setHouse(false)); }
  });

  /* house card: toggle button vs modal */
  const houseCard = $('c-house');
  if (houseCard) {
    houseCard.addEventListener('click', (e) => {
      if (e.target.closest('.house-toggle')) {
        e.stopPropagation();
        if (!isSorted()) { runSorting(() => setHouse(true)); }
        else { runSortingOut(() => setHouse(false)); }
        return;
      }
      openModal(houseModalHTML());
    });
  }

  function houseModalHTML() {
    const traits = [
      ['Ambition', 'a clear sense of where you’re going — and the patience to get there.'],
      ['Cunning', 'finding the elegant path, not just the obvious one.'],
      ['Resourcefulness', 'making the tools you’re missing.'],
      ['Determination', 'the quiet refusal to be the one who quits.'],
      ['Self-reliance', 'comfortable being the person who figures it out.'],
    ];
    return `
      <div class="m-kicker">11 · the sorting</div>
      <h2>Slytherin</h2>
      <p style="font-size:13.5px;color:var(--ink-2);line-height:1.6;margin:-10px 0 6px">
        Emerald &amp; silver, deep water and old stone. The house colours can take over the whole
        site — try the toggle, then watch for the small magic.</p>
      <div style="display:flex;gap:10px;margin:14px 0 22px">
        <button id="m-sort" style="font-family:var(--mono);font-size:11.5px;letter-spacing:.04em;color:var(--contrast-ink);background:var(--spark);border:none;border-radius:999px;padding:9px 18px;cursor:pointer">${isSorted() ? 'Remove house colours' : 'Apply house colours'}</button>
      </div>
      <h3>The traits</h3>
      ${traits.map(([k,v]) => `<div class="m-row"><div class="t" style="font-size:19px">${k}</div><p>${v}</p></div>`).join('')}
      <h3>Hidden magic</h3>
      <ul class="m-notes">
        <li>Green embers drift up the page while you’re sorted.</li>
        <li>The cursor takes on a serpent-green ring.</li>
        <li>Try the old spell on your keyboard: <span style="font-family:var(--mono);color:var(--spark)">↑ ↑ ↓ ↓</span>.</li>
      </ul>`;
  }

  /* delegated handler for the in-modal sort button */
  if (overlay) overlay.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'm-sort') {
      if (!isSorted()) { runSorting(() => setHouse(true)); }
      else { runSortingOut(() => setHouse(false)); }
    }
  });

  /* ── motes ────────────────────────────────────────────────── */
  const motes = document.createElement('div');
  motes.className = 'motes';
  for (let i = 0; i < 26; i++) {
    const m = document.createElement('span');
    m.className = 'mote';
    const dur = 9 + Math.random() * 12;
    m.style.left = (Math.random() * 100) + 'vw';
    m.style.animationDuration = dur + 's';
    m.style.animationDelay = (-Math.random() * dur) + 's';
    m.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
    m.style.opacity = '0';
    m.style.transform = `scale(${0.6 + Math.random()})`;
    motes.appendChild(m);
  }
  document.body.appendChild(motes);

  /* ── sorting flash ────────────────────────────────────────── */
  function runSorting(onCover) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (onCover) onCover();
      return;
    }

    const btn = $('house-tg');
    const btnR = btn ? btn.getBoundingClientRect() : null;
    const tx = btnR ? (btnR.left + btnR.width  / 2 - window.innerWidth  / 2) : 0;
    const ty = btnR ? (btnR.top  + btnR.height / 2 - window.innerHeight / 2) : 0;

    if (btn && btnR) {
      const rp = document.createElement('div');
      rp.className = 'sort-ripple';
      rp.style.left = (btnR.left + btnR.width  / 2) + 'px';
      rp.style.top  = (btnR.top  + btnR.height / 2) + 'px';
      document.body.appendChild(rp);
      requestAnimationFrame(() => requestAnimationFrame(() => rp.classList.add('run')));
      setTimeout(() => rp.remove(), 1000);
    }

    const halo = document.createElement('div');
    halo.className = 'sort-halo';
    halo.style.setProperty('--tx', tx + 'px');
    halo.style.setProperty('--ty', ty + 'px');
    document.body.appendChild(halo);
    requestAnimationFrame(() => requestAnimationFrame(() => halo.classList.add('run')));
    if (onCover) setTimeout(onCover, 1300);
    setTimeout(() => halo.remove(), 2600);

    const sourceSvg = document.querySelector('#house-tg svg');
    const el = document.createElement('div');
    el.className = 'sorting';
    const crest = document.createElement('div');
    crest.className = 'sort-crest';
    crest.style.setProperty('--tx', tx + 'px');
    crest.style.setProperty('--ty', ty + 'px');
    if (sourceSvg) {
      const svg = sourceSvg.cloneNode(true);
      crest.appendChild(svg);
    }
    crest.insertAdjacentHTML('beforeend', '<div class="sort-sub">welcome to slytherin</div>');
    el.appendChild(crest);
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('run'));
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 2500);
  }

  function runSortingOut(onCover) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (onCover) onCover();
      return;
    }

    const btn = $('house-tg');
    const btnR = btn ? btn.getBoundingClientRect() : null;
    const tx = btnR ? (btnR.left + btnR.width  / 2 - window.innerWidth  / 2) : 0;
    const ty = btnR ? (btnR.top  + btnR.height / 2 - window.innerHeight / 2) : 0;

    if (btn && btnR) {
      const rp = document.createElement('div');
      rp.className = 'sort-ripple';
      rp.style.left = (btnR.left + btnR.width  / 2) + 'px';
      rp.style.top  = (btnR.top  + btnR.height / 2) + 'px';
      document.body.appendChild(rp);
      requestAnimationFrame(() => requestAnimationFrame(() => rp.classList.add('run-out')));
      setTimeout(() => rp.remove(), 1000);
    }

    const halo = document.createElement('div');
    halo.className = 'sort-halo out';
    halo.style.setProperty('--tx', tx + 'px');
    halo.style.setProperty('--ty', ty + 'px');
    document.body.appendChild(halo);
    if (onCover) setTimeout(onCover, 650);
    setTimeout(() => halo.remove(), 2600);

    const sourceSvg = document.querySelector('#house-tg svg');
    const el = document.createElement('div');
    el.className = 'sorting run-out';
    const crest = document.createElement('div');
    crest.className = 'sort-crest';
    crest.style.setProperty('--tx', tx + 'px');
    crest.style.setProperty('--ty', ty + 'px');
    if (sourceSvg) {
      const svg = sourceSvg.cloneNode(true);
      crest.appendChild(svg);
    }
    crest.insertAdjacentHTML('beforeend', '<div class="sort-sub">mischief managed</div>');
    el.appendChild(crest);
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 2500);
  }

  /* ── konami → parseltongue ───────────────────────────────── */
  const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown'];
  let buf = [];
  window.addEventListener('keydown', (e) => {
    buf.push(e.key); buf = buf.slice(-SEQ.length);
    if (SEQ.every((k, i) => buf[i] === k)) {
      buf = [];
      if (!isSorted()) runSorting(() => setHouse(true));
      parselTongue();
    }
  });
  function parselTongue() {
    const t = document.createElement('div');
    t.textContent = 'ssss… you speak Parseltongue';
    t.style.cssText = 'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:9600;'
      + 'font-family:var(--serif);font-style:italic;font-size:22px;color:var(--spark);'
      + 'background:color-mix(in srgb,var(--bg-2) 90%,transparent);border:1px solid var(--line-2);'
      + 'padding:10px 20px;border-radius:999px;backdrop-filter:blur(6px);opacity:0;transition:opacity .4s,transform .4s';
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(-6px)'; });
    setTimeout(() => { t.style.opacity = '0'; }, 2600);
    setTimeout(() => t.remove(), 3100);
  }

  /* ── helpers ──────────────────────────────────────────────── */
  function fmtDay(d) {
    if (!d) return '';
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
    catch (e) { return String(d); }
  }
})();
