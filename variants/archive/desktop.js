(() => {
  // ─── Boot screen ───────────────────────────────────
  const boot = document.getElementById('boot');
  setTimeout(() => boot && boot.classList.add('gone'), 900);
  setTimeout(() => boot && boot.remove(), 1600);

  // ─── Clock ─────────────────────────────────────────
  const clock = document.getElementById('clock');
  function tick(){
    const d = new Date();
    clock.textContent =
      String(d.getHours()).padStart(2,'0') + ':' +
      String(d.getMinutes()).padStart(2,'0');
  }
  tick(); setInterval(tick, 30000);

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

    R.renderHero    ('hero-body',    profile,  { variant: 'desktop' });
    R.renderAbout   ('about-body',   profile);
    R.renderNow     ('now-rows',     now);
    R.renderContact ('contact-body', contact,  { variant: 'desktop' });
    R.renderReading ('reading-body', reading);
    R.renderCerts   ('certs-body',   certs,    { variant: 'desktop' });
    R.renderArt     ('art-body',     art,      { variant: 'desktop', max: 8 });

    // Timeline — terminal-style format
    const tbody = document.getElementById('timeline-body');
    if (tbody && timeline){
      tbody.innerHTML = `<div class="prompt">cat ~/career/timeline.txt</div>` +
        timeline.entries.map(e => `<div class="row">
          <div class="l">${e.year}</div>
          <div>${e.role} · <em>${e.org}</em>${e.where ? ' · ' + e.where : ''}</div>
        </div>`).join('') +
        `<div class="prompt">cat ~/education.txt</div>
         ${(profile?.education||[]).map(ed => `<div class="row">
            <div class="l">${ed.year}</div>
            <div>${ed.what} · ${ed.where} · <em>${ed.grade}</em></div>
         </div>`).join('')}
         <div class="prompt">echo publications</div>
         <div>· Zeppelin Server — IJSER Vol 10 Issue 9, Sep 2019</div>`;
    }

    // Work tiles + featured projects from markdown
    const works = await C.loadCollection('work', C.MANIFESTS.work);
    const workBody = document.getElementById('work-body');
    if (workBody && works.length){
      const featured = works.filter(w => w.frontmatter.featured)
        .sort((a,b) => (a.frontmatter.order||99) - (b.frontmatter.order||99));
      const rest = works.filter(w => !w.frontmatter.featured)
        .sort((a,b) => (b.frontmatter.year||0) - (a.frontmatter.year||0));
      workBody.innerHTML = `
        <h2>★ featured</h2>
        ${featured.map(w => `<p><strong>${w.frontmatter.title.toLowerCase()}.</strong> ${R.md(w.frontmatter.summary)}</p>`).join('')}
        <h3>the rest of the archive</h3>
        <div class="tiles">
          ${rest.map(w => `<div class="tile-mini">
            <div class="t">${w.frontmatter.title}</div>
            <div class="y">${w.frontmatter.year} · ${w.frontmatter.kind || ''}</div>
          </div>`).join('')}
        </div>
      `;
    }

    // Writing + poetry
    const [essays, poems] = await Promise.all([
      C.loadCollection('writing', C.MANIFESTS.writing),
      C.loadCollection('poetry',  C.MANIFESTS.poetry),
    ]);
    const writeBody = document.getElementById('write-body');
    if (writeBody){
      const essayList = essays.sort((a,b) => (b.frontmatter.date||'').localeCompare(a.frontmatter.date||''))
        .map(e => `<li>${e.frontmatter.title} <span style="color:var(--ink-3);font-size:14px">· ${new Date(e.frontmatter.date).toLocaleDateString(undefined,{month:'short',year:'numeric'})}${e.frontmatter.readMinutes ? ' · ' + e.frontmatter.readMinutes + ' min' : ''}</span></li>`).join('');
      const poemHTML = poems.map(p => `
        <p style="font-family:'Caveat',cursive;font-size:23px;line-height:1.35;background:#fff5a3;padding:14px;color:#3a3a1a;border-radius:3px;border:1px solid #c2a64a">
          ${p.body.trim().split('\n').map(l => R.md(l)).join('<br>')}
        </p>`).join('');
      writeBody.innerHTML = `<h2>writing/</h2>
        <h3>essays</h3>
        <ul>${essayList}</ul>
        <h3>poetry corner</h3>
        ${poemHTML}`;
    }
  })();

  // ─── Window management ────────────────────────────
  let zTop = 100;
  const tasks = document.getElementById('tasks');
  const taskMap = new Map();
  const winState = new Map();  // id -> { prevStyle, minimized, maxed }
  let focused = null;

  function focusWin(w){
    document.querySelectorAll('.win.focused').forEach(x => x.classList.remove('focused'));
    w.classList.add('focused');
    w.style.zIndex = ++zTop;
    focused = w;
    document.querySelectorAll('.task').forEach(t => t.classList.remove('active'));
    const task = taskMap.get(w.id);
    if (task) task.classList.add('active');
  }

  function openWin(id){
    const w = document.getElementById(id);
    if (!w) return;
    if (w.style.display === 'none' || w.classList.contains('minimizing')){
      w.style.display = 'flex';
      w.classList.remove('minimizing');
      // animate in
      w.style.opacity = '0';
      w.style.transform = 'scale(.95) translateY(20px)';
      requestAnimationFrame(() => {
        w.style.transition = 'opacity .2s, transform .2s';
        w.style.opacity = '1';
        w.style.transform = '';
        setTimeout(() => { w.style.transition = '' }, 250);
      });
    }
    if (!taskMap.has(id)){
      const t = document.createElement('button');
      t.className = 'task';
      t.innerHTML = '<span class="dot"></span>' + (w.querySelector('.ttl').textContent);
      t.onclick = () => {
        const s = winState.get(id) || {};
        if (s.minimized){
          // restore
          w.style.display = 'flex';
          w.classList.remove('minimizing');
          s.minimized = false;
          winState.set(id, s);
        }
        if (w === focused){
          // toggle minimize
          minimizeWin(w);
          return;
        }
        focusWin(w);
      };
      tasks.appendChild(t);
      taskMap.set(id, t);
    }
    focusWin(w);
  }

  function closeWin(w){
    w.style.display = 'none';
    if (taskMap.has(w.id)){
      taskMap.get(w.id).remove();
      taskMap.delete(w.id);
    }
    winState.delete(w.id);
    if (focused === w) focused = null;
  }

  function minimizeWin(w){
    const s = winState.get(w.id) || {};
    s.minimized = true;
    winState.set(w.id, s);
    w.classList.add('minimizing');
    setTimeout(() => { if (s.minimized) w.style.display = 'none'; }, 200);
    if (focused === w){
      focused = null;
      document.querySelectorAll('.task').forEach(t => t.classList.remove('active'));
    }
  }

  function maximizeWin(w){
    const s = winState.get(w.id) || {};
    if (w.classList.contains('maximized')){
      // restore
      w.classList.remove('maximized');
      if (s.prevStyle){
        w.style.left = s.prevStyle.left;
        w.style.top  = s.prevStyle.top;
        w.style.width = s.prevStyle.width;
      }
    } else {
      s.prevStyle = { left: w.style.left, top: w.style.top, width: w.style.width };
      winState.set(w.id, s);
      w.classList.add('maximized');
    }
  }

  // ─── Icon click + double-click + keyboard ─────────
  document.querySelectorAll('.icon').forEach(icn => {
    let lastClick = 0;
    icn.addEventListener('click', () => {
      const now = Date.now();
      document.querySelectorAll('.icon.selected').forEach(x => x.classList.remove('selected'));
      icn.classList.add('selected');
      if (now - lastClick < 380){
        openWin(icn.dataset.open);
      }
      lastClick = now;
    });
    icn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openWin(icn.dataset.open);
      }
    });
  });

  // Hint user that single click selects, double-click opens
  // (also: any icon, when re-clicked while selected, opens)
  document.querySelectorAll('.icon').forEach(icn => {
    icn.addEventListener('click', () => {
      if (icn.classList.contains('selected') && icn.dataset.lastOpen){
        const now = Date.now();
        if (now - icn.dataset.lastOpen < 1500){
          openWin(icn.dataset.open);
        }
      }
      icn.dataset.lastOpen = Date.now();
    });
  });

  // ─── Window drag + controls ───────────────────────
  document.querySelectorAll('.win').forEach(w => {
    const bar = w.querySelector('.bar');
    let drag = false, sx=0, sy=0, ox=0, oy=0;
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('.ctrl')) return;
      if (w.classList.contains('maximized')) return;
      drag = true; sx = e.clientX; sy = e.clientY;
      const r = w.getBoundingClientRect();
      ox = r.left; oy = r.top;
      focusWin(w);
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', e => {
      if (!drag) return;
      let nx = ox + e.clientX - sx;
      let ny = Math.max(0, oy + e.clientY - sy);
      w.style.left = nx + 'px';
      w.style.top  = ny + 'px';
    });
    bar.addEventListener('pointerup', () => drag = false);
    bar.addEventListener('dblclick', e => {
      if (e.target.closest('.ctrl')) return;
      maximizeWin(w);
    });

    // Focus on click anywhere in window
    w.addEventListener('pointerdown', () => focusWin(w));

    // Controls
    const close = w.querySelector('.ctrl.close');
    const min   = w.querySelector('.ctrl.min');
    const max   = w.querySelector('.ctrl.max');
    if (close) close.addEventListener('click', e => { e.stopPropagation(); closeWin(w); });
    if (min)   min.addEventListener('click',   e => { e.stopPropagation(); minimizeWin(w); });
    if (max)   max.addEventListener('click',   e => { e.stopPropagation(); maximizeWin(w); });
  });

  // ─── Drag stickies & polaroids ────────────────────
  document.querySelectorAll('.drag').forEach(el => {
    let drag = false, sx=0, sy=0, ox=0, oy=0;
    el.addEventListener('pointerdown', e => {
      drag = true; sx = e.clientX; sy = e.clientY;
      const r = el.getBoundingClientRect();
      ox = r.left; oy = r.top;
      el.style.left = ox + 'px'; el.style.top = oy + 'px';
      el.style.right = 'auto'; el.style.bottom = 'auto';
      el.style.zIndex = ++zTop;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e => {
      if (!drag) return;
      el.style.left = (ox + e.clientX - sx) + 'px';
      el.style.top  = Math.max(0, oy + e.clientY - sy) + 'px';
    });
    el.addEventListener('pointerup', () => drag = false);
  });

  // ─── Click desktop to deselect ─────────────────────
  document.getElementById('desk').addEventListener('pointerdown', e => {
    if (e.target.id === 'desk'){
      document.querySelectorAll('.icon.selected').forEach(x => x.classList.remove('selected'));
    }
  });

  // ─── Keyboard: Esc to close focused, Tab cycles ────
  window.addEventListener('keydown', e => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key === 'Escape' && focused){
      e.preventDefault();
      closeWin(focused);
    }
  });

  // ─── Konami ↑↑↓↓ — theme flip ─────────────────────
  const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown'];
  let buf = [];
  window.addEventListener('keydown', e => {
    buf.push(e.key);
    if (buf.length > 4) buf.shift();
    if (SEQ.every((k,i) => buf[i] === k)){
      const html = document.documentElement;
      html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
      buf = [];
    }
  });

  // ─── Start dock toggle: open all/none ──────────────
  const start = document.querySelector('.start');
  if (start){
    start.addEventListener('click', () => {
      // If hero is closed, open it; otherwise close all
      const hero = document.getElementById('hero');
      if (!hero || hero.style.display === 'none'){
        openWin('hero');
      } else {
        document.querySelectorAll('.win').forEach(w => {
          if (w.style.display !== 'none') minimizeWin(w);
        });
      }
    });
  }

  // ─── Boot: open hero ───────────────────────────────
  setTimeout(() => openWin('hero'), 1000);
})();
