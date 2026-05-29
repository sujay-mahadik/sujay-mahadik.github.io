(() => {
  // ─── State ─────────────────────────────────────────
  const stage = document.getElementById('stage');
  const world = document.getElementById('world');
  const mm = document.getElementById('mm');
  const mmZoom = document.getElementById('mm-zoom');
  const WORLD_W = 3000, WORLD_H = 2600;
  const MIN_S = 0.30, MAX_S = 2.0;
  let scale = 0.75, tx = 60, ty = 40;
  let mmInited = false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Region → element id mapping
  const REGIONS = {
    overview: { id: 'overview', label: 'Overview' },
    about:    { id: 'about',    label: 'About'    },
    work:     { id: 'work',     label: 'Work'     },
    photo:    { id: 'photo',    label: 'Photo'    },
    words:    { id: 'words',    label: 'Words'    },
    contact:  { id: 'contact',  label: 'Contact'  },
  };

  function apply(){
    world.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (mmZoom) mmZoom.textContent = Math.round(scale * 100) + '%';
    updateMinimap();
  }

  // ─── Pan with pointer ─────────────────────────────
  let dragging = false, sx=0, sy=0, stx=0, sty=0;
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('.hud, .minimap, .legend, .controls, a, button')) return;
    if (e.target.closest('.card[tabindex]')) return; // don't grab from a focused card
    dragging = true; sx = e.clientX; sy = e.clientY; stx = tx; sty = ty;
    stage.classList.add('drag'); stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    clampPan(); apply();
  });
  stage.addEventListener('pointerup', () => {
    dragging = false; stage.classList.remove('drag');
  });

  function clampPan(){
    const w = window.innerWidth, h = window.innerHeight;
    const minTx = w - WORLD_W * scale - 100;
    const minTy = h - WORLD_H * scale - 100;
    const maxTx = 100, maxTy = 100;
    tx = Math.min(maxTx, Math.max(minTx, tx));
    ty = Math.min(maxTy, Math.max(minTy, ty));
  }

  // ─── Wheel + pinch zoom ────────────────────────────
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0015);
    zoomAt(factor, e.clientX, e.clientY);
  }, { passive: false });

  function zoomAt(factor, cx, cy){
    const ns = Math.max(MIN_S, Math.min(MAX_S, scale * factor));
    const rect = stage.getBoundingClientRect();
    const px = cx - rect.left, py = cy - rect.top;
    const wx = (px - tx) / scale, wy = (py - ty) / scale;
    scale = ns;
    tx = px - wx * scale; ty = py - wy * scale;
    clampPan(); apply();
  }
  window.zoomBy = function(f){
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    zoomAt(f, cx, cy);
  };

  // ─── Smooth fly-to ─────────────────────────────────
  function flyTo(targetTx, targetTy, targetScale, dur = 600){
    if (prefersReducedMotion){
      tx = targetTx; ty = targetTy; scale = targetScale;
      clampPan(); apply();
      return;
    }
    const sTx = tx, sTy = ty, sSc = scale;
    const t0 = performance.now();
    const ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2) / 2;
    function step(now){
      const t = Math.min(1, (now - t0) / dur);
      const k = ease(t);
      tx = sTx + (targetTx - sTx) * k;
      ty = sTy + (targetTy - sTy) * k;
      scale = sSc + (targetScale - sSc) * k;
      clampPan(); apply();
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function goTo(region){
    const r = REGIONS[region]; if (!r) return;
    const el = document.getElementById(r.id); if (!el) return;
    const w = window.innerWidth, h = window.innerHeight;
    const sc = 0.95;
    const cx = el.offsetLeft + el.offsetWidth / 2;
    const cy = el.offsetTop + el.offsetHeight / 2;
    const targetTx = w / 2 - cx * sc;
    const targetTy = h / 2 - cy * sc;
    flyTo(targetTx, targetTy, sc);
    setActive(region);
  }
  window.goTo = goTo;

  function setActive(region){
    document.querySelectorAll('.hud button').forEach(b => {
      b.setAttribute('aria-current', b.dataset.go === region ? 'true' : 'false');
    });
  }
  document.querySelectorAll('.hud button[data-go]').forEach(b => {
    b.addEventListener('click', () => goTo(b.dataset.go));
  });

  window.zoomFit = function(){
    const w = window.innerWidth, h = window.innerHeight;
    const sc = Math.min(w / (WORLD_W + 200), h / (WORLD_H + 200));
    const targetTx = (w - WORLD_W * sc) / 2;
    const targetTy = (h - WORLD_H * sc) / 2;
    flyTo(targetTx, targetTy, Math.max(MIN_S, sc), 700);
  };

  window.toggleTheme = function(){
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  };

  // ─── Keyboard navigation ───────────────────────────
  const KEY_MAP = {
    '1': 'overview', '2': 'about', '3': 'work',
    '4': 'photo', '5': 'words', '6': 'contact',
  };
  window.addEventListener('keydown', e => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    if (KEY_MAP[e.key]) { goTo(KEY_MAP[e.key]); e.preventDefault(); return; }
    const PAN = 80, ZOOM = 1.15;
    switch (e.key) {
      case 'ArrowLeft':  tx += PAN; clampPan(); apply(); e.preventDefault(); break;
      case 'ArrowRight': tx -= PAN; clampPan(); apply(); e.preventDefault(); break;
      case 'ArrowUp':    ty += PAN; clampPan(); apply(); e.preventDefault(); break;
      case 'ArrowDown':  ty -= PAN; clampPan(); apply(); e.preventDefault(); break;
      case '+': case '=': window.zoomBy(ZOOM); e.preventDefault(); break;
      case '-': case '_': window.zoomBy(1/ZOOM); e.preventDefault(); break;
      case '0': window.zoomFit(); e.preventDefault(); break;
      case 't': case 'T': window.toggleTheme(); break;
    }
  });

  // ─── Minimap ───────────────────────────────────────
  function initMM(){
    if (mmInited) return; mmInited = true;
    document.querySelectorAll('#world .card').forEach(c => {
      const d = document.createElement('div');
      d.className = 'mm-card';
      d.style.left   = (c.offsetLeft   / WORLD_W * 100) + '%';
      d.style.top    = (c.offsetTop    / WORLD_H * 100) + '%';
      d.style.width  = (c.offsetWidth  / WORLD_W * 100) + '%';
      d.style.height = (c.offsetHeight / WORLD_H * 100) + '%';
      mm.appendChild(d);
    });
    // region label dots
    document.querySelectorAll('#world .region').forEach(r => {
      const d = document.createElement('div');
      d.className = 'mm-region';
      const txt = r.textContent.trim().split(' ')[0];
      d.textContent = txt;
      d.style.left = (parseFloat(r.style.left) / WORLD_W * 100) + '%';
      d.style.top  = (parseFloat(r.style.top)  / WORLD_H * 100) + '%';
      mm.appendChild(d);
    });
    const v = document.createElement('div');
    v.className = 'mm-view'; v.id = 'mmview';
    mm.appendChild(v);
    // click-to-jump on minimap
    mm.addEventListener('click', e => {
      const rect = mm.getBoundingClientRect();
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top)  / rect.height;
      const wx = fx * WORLD_W, wy = fy * WORLD_H;
      const w = window.innerWidth, h = window.innerHeight;
      flyTo(w / 2 - wx * scale, h / 2 - wy * scale, scale, 500);
    });
  }
  function updateMinimap(){
    initMM();
    const v = document.getElementById('mmview'); if (!v) return;
    const w = window.innerWidth, h = window.innerHeight;
    const vx = (-tx) / scale, vy = (-ty) / scale;
    v.style.left   = (vx / WORLD_W * 100) + '%';
    v.style.top    = (vy / WORLD_H * 100) + '%';
    v.style.width  = (w  / scale / WORLD_W * 100) + '%';
    v.style.height = (h  / scale / WORLD_H * 100) + '%';
  }

  window.addEventListener('resize', () => { clampPan(); apply(); });

  // ─── Load all content + render ─────────────────────
  (async () => {
    if (!window.Content || !window.Render) return;
    const C = window.Content, R = window.Render;

    const [profile, now, contact, timeline, reading, certs, art] = await Promise.all([
      C.loadJSON('profile'),
      C.loadJSON('now'),
      C.loadJSON('contact'),
      C.loadJSON('timeline'),
      C.loadJSON('reading'),
      C.loadJSON('certs'),
      C.loadJSON('art'),
    ]);

    R.renderHero    ('overview', profile,  { variant: 'atlas' });
    R.renderTimeline('timeline', timeline, { variant: 'atlas' });
    R.renderReading ('reading',  reading);
    R.renderCerts   ('certs',    certs,    { variant: 'atlas' });
    R.renderContact ('contact',  contact,  { variant: 'atlas' });

    // Now widget — atlas has hand-tuned layout, so render rows inline
    const nowEl = document.getElementById('now');
    if (nowEl && now){
      nowEl.innerHTML = `
        <div class="k"><span class="badge-live">Now · live</span></div>
        <h3>Currently</h3>
        ${now.items.map(item => `<div class="row">
          <span class="l">${item.label}</span>
          <span class="v">${item.url
            ? `<a href="${item.url}" target="_blank" rel="noopener">${R.md(item.value)}</a>`
            : R.md(item.value)}</span>
        </div>`).join('')}
        <div class="meta">Updated ${new Date(now.updated).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</div>
      `;
    }

    // About — fill long bio inside existing card
    const aboutEl = document.getElementById('about');
    if (aboutEl && profile){
      aboutEl.innerHTML = `
        <div class="k">The longer story</div>
        <h2>I write data pipelines for a living and pretend I'm setting type for a periodical.</h2>
        ${profile.longBio.map(p => `<p>${R.md(p)}</p>`).join('')}
        <p style="margin-top:6px"><span class="tag">${profile.location.from} → ${profile.location.city}</span></p>
      `;
    }
  })();

  // ─── Work tiles, art cards, words, poem ─ ─ ─ ─ ─ ─ ─
  (async () => {
    if (!window.Content || !window.Render) return;
    const C = window.Content, R = window.Render;

    // WORDS (essays list) — fills #words
    const essays = await C.loadCollection('writing', C.MANIFESTS.writing);
    const wordsEl = document.getElementById('words');
    if (wordsEl && essays.length){
      const sorted = essays.sort((a,b) =>
        (b.frontmatter.date||'').localeCompare(a.frontmatter.date||''));
      wordsEl.innerHTML = `
        <div class="k">Words · ${sorted.length} note${sorted.length===1?'':'s'}</div>
        <h3 style="margin-bottom:6px">Recent essays</h3>
        ${sorted.map(e => `<div class="post">
          <h4>${e.frontmatter.title}</h4>
          <div class="d">${new Date(e.frontmatter.date).toLocaleDateString(undefined,{month:'short',year:'numeric'})}${e.frontmatter.readMinutes ? ' · ' + e.frontmatter.readMinutes + ' min' : ''}</div>
        </div>`).join('')}
      `;
    }

    // POEM — replace static poem with content/poetry
    const poems = await C.loadCollection('poetry', C.MANIFESTS.poetry);
    const poemEl = document.getElementById('poem');
    if (poemEl && poems.length){
      const p = poems[0];
      poemEl.innerHTML = `
        <div class="k">A poem · ${p.frontmatter.summary || ''}</div>
        <h2 style="font-family:var(--f-display);font-style:italic;font-weight:300;font-size:30px;line-height:1.35;margin:14px 0 12px">${p.body.trim().split('\n').map(l => R.md(l)).join('<br>')}</h2>
        <div class="meta">— S.M.</div>
      `;
    }
  })();

  // ─── Boot: focus overview ──────────────────────────
  apply();
  setTimeout(() => goTo('overview'), 80);
})();
