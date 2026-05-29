/* ───────────────────────────────────────────────────────────
   sujay.os — desktop window manager + content renderer
   glassmorphism · topographic wallpaper · spotlight · konami
   ─────────────────────────────────────────────────────────── */
(async () => {
  const esc = Render.esc, md = Render.md;
  const root = document.documentElement;

  // ─── Theme ───────────────────────────────────────────────
  const savedTheme = localStorage.getItem('os-theme') || 'dark';
  root.dataset.theme = savedTheme;
  function toggleTheme(){
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('os-theme', root.dataset.theme);
    drawTopo();
  }

  // ─── Load content ────────────────────────────────────────
  const [profile, now, contact, timeline, reading, certs, art] = await Promise.all([
    Content.loadJSON('profile'), Content.loadJSON('now'), Content.loadJSON('contact'),
    Content.loadJSON('timeline'), Content.loadJSON('reading'), Content.loadJSON('certs'),
    Content.loadJSON('art'),
  ]);
  const [work, writing, poetry, zines] = await Promise.all([
    Content.loadCollection('work', Content.MANIFESTS.work),
    Content.loadCollection('writing', Content.MANIFESTS.writing),
    Content.loadCollection('poetry', Content.MANIFESTS.poetry),
    Content.loadCollection('zines', Content.MANIFESTS.zines),
  ]);
  const workSorted = (work||[]).slice().sort((a,b)=>(a.frontmatter.order||99)-(b.frontmatter.order||99));
  const writingSorted = (writing||[]).slice().sort((a,b)=>new Date(b.frontmatter.date||0)-new Date(a.frontmatter.date||0));
  const fmtDate = d => { if(!d) return ''; try { return new Date(d).toLocaleDateString('en-GB',{month:'short',year:'numeric'}); } catch(e){ return String(d); } };

  // ─── Window body renderers ───────────────────────────────
  function bAbout(){
    const bio = (profile.longBio||[]).map(p=>`<p>${md(p)}</p>`).join('');
    return `<h1>hi, i'm <span class="ac">${esc(profile.shortName.toLowerCase())}</span>.</h1>
      <span class="strap">${esc(profile.tagline)}</span>
      <p style="margin-top:14px">${md(profile.blurb)} This portfolio is a <em>desktop</em>, not a feed — drag the icons, open the windows, move things where you like.</p>
      ${bio}
      <div class="divider"></div>
      <p style="font-size:13px;color:var(--ink-3)">try: <span class="kbd">⌘K</span> to search · open <span class="kbd">work/</span> · drag a polaroid · <span class="kbd">↑↑↓↓←→←→ba</span></p>`;
  }
  function bWork(){
    const feat = workSorted.filter(w=>w.frontmatter.featured).slice(0,3);
    const rest = workSorted.filter(w=>!w.frontmatter.featured);
    const featHtml = feat.map(w=>{
      const fm=w.frontmatter;
      const meta=[fm.kind,fm.client||fm.location,fm.year].filter(Boolean).join(' · ');
      return `<div class="work-feat"><div class="ft">${esc(fm.title)}${fm.metric?` · <span style="color:var(--accent)">${esc(fm.metric)}</span>`:''}</div>
        <div class="fmeta">${esc(meta)}</div><div class="fd">${esc(fm.summary||'')}</div></div>`;
    }).join('<div class="divider"></div>');
    const tiles = rest.map(w=>{
      const fm=w.frontmatter;
      return `<div class="tile"><div class="t">${esc(fm.title)}</div><div class="y">${esc(fm.year||'')}${fm.kind?' · '+esc(fm.kind):''}</div></div>`;
    }).join('');
    return `<h2>★ featured</h2>${featHtml}<h3>the rest of the archive</h3><div class="tiles">${tiles}</div>`;
  }
  function bResume(){
    const exp = (timeline.entries||[]).map(e=>`<div class="trow"><div class="l">${esc(e.year)}</div><div>${esc(e.role)} · <em>${esc(e.org)}</em>${e.where?' · '+esc(e.where):''}</div></div>`).join('');
    const edu = (profile.education||[]).map(e=>`<div class="trow"><div class="l">${esc(e.year)}</div><div>${esc(e.what)} · <em>${esc(e.where)}</em>${e.grade?' · '+esc(e.grade):''}</div></div>`).join('');
    const pubs = (profile.publications||[]).map(p=>`<div>· ${esc(p.title)} — ${esc(p.venue)}${p.date?', '+esc(fmtDate(p.date)):''}</div>`).join('');
    return `<span class="prompt">cat ~/career/timeline.txt</span>${exp}
      <span class="prompt">cat ~/education.txt</span>${edu}
      ${pubs ? `<span class="prompt">echo "publications.bib"</span>${pubs}` : ''}`;
  }
  function bNow(){
    const rows = (now.items||[]).map(it=>{
      const live = it.live ? '<span class="bdot"></span>' : '';
      const v = it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.value)}</a>${live}` : esc(it.value)+live;
      return `<div class="now-row"><div class="l">${esc(it.label)}</div><div class="v">${v}</div></div>`;
    }).join('');
    const upd = now.updated ? `<div class="now-row"><div class="l">Updated</div><div class="v">${fmtDate(now.updated)}</div></div>` : '';
    return `<h2 style="text-align:center;border-bottom:1px solid var(--hairline);padding-bottom:10px">· currently ·</h2>${rows}${upd}`;
  }
  function bPhotos(){
    const cells = (art.items||[]).map(a=>{
      const meta=[a.location||a.client,a.date].filter(Boolean).join(' · ');
      return `<div class="pcell"><span class="cap">${esc(a.caption||'')}${meta?'<br>'+esc(meta):''}</span></div>`;
    }).join('');
    return `<h2>photos &amp; design</h2><p>A drawer of pictures. Drop JPGs into <code>art/</code> and list them in <code>content/art.json</code>.</p><div class="pgrid">${cells}</div>`;
  }
  function bWriting(){
    const essays = writingSorted.map(w=>`<li><strong>${esc(w.frontmatter.title)}</strong> <span style="color:var(--ink-3);font-size:13px">· ${esc(fmtDate(w.frontmatter.date))}${w.frontmatter.readMinutes?' · '+w.frontmatter.readMinutes+' min':''}</span></li>`).join('');
    const poemHtml = (poetry||[]).map(p=>{
      const lines=(p.body||'').trim().split('\n').map(l=>md(l)).join('<br>');
      return `<div class="poem-block">${lines}</div><p style="font-size:12px;color:var(--ink-3);margin-top:8px">— ${esc(p.frontmatter.title)}</p>`;
    }).join('');
    return `<h2>writing/</h2><h3>essays</h3><ul>${essays}</ul><h3>poetry corner</h3>${poemHtml}`;
  }
  function bReading(){
    const books = (reading.reading||[]).map(b=>`<li>${esc(b.author)} — <em>${esc(b.title)}</em></li>`).join('');
    const infl = (reading.influences||[]).map(i=>`<span class="chip">${esc(i)}</span>`).join('');
    return `<h2>reading/</h2><h3>on the desk</h3><ul>${books}</ul><h3>influences</h3>${infl}`;
  }
  function bCerts(){
    const groups = (certs.groups||[]).map(g=>`<h3>${esc(g.name.toLowerCase())}</h3>${g.items.map(it=>`<span class="chip${it.highlight?' ac':''}">${esc(it.title)}</span>`).join('')}`).join('');
    return `<h2>certs.zip</h2><p>A streak of self-taught credentials, grouped.</p>${groups}`;
  }
  function bContact(){
    const links = (contact.links||[]).map(l=>`<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label.toLowerCase())} →</a>${l.note?` <span style="color:var(--ink-3);font-size:13px">· ${esc(l.note)}</span>`:''}</li>`).join('');
    return `<h2>say hi.</h2><p>Open to: ${esc(contact.openTo)}.</p><ul style="font-size:17px;line-height:1.8">${links}</ul>`;
  }
  function bSecret(){
    const p = (poetry||[])[0];
    const lines = p ? (p.body||'').trim().split('\n').map(l=>md(l)).join('<br>') : 'the pipeline is a kind of <em>prayer</em>.';
    return `<h2>secret.txt</h2><p style="color:var(--ink-3);font-size:13px">↑↑↓↓←→←→ b a — you found it.</p><div class="poem-block">${lines}</div>`;
  }

  // ─── App registry ────────────────────────────────────────
  const APPS = [
    { id:'about',   glyph:'@', label:'about.me',  title:'about.me',  kw:'bio profile sujay who', w:560, render:bAbout },
    { id:'work',    glyph:'◧', label:'work/',      title:'work/',     kw:'projects portfolio kafka', w:600, render:bWork },
    { id:'resume',  glyph:'$', label:'résumé.sh',  title:'résumé.sh', kw:'cv career experience timeline barclays', w:580, term:true, render:bResume },
    { id:'now',     glyph:'●', label:'now.live',   title:'now.live',  kw:'currently listening reading brewing', w:380, render:bNow },
    { id:'photos',  glyph:'▣', label:'photos/',    title:'photos/',   kw:'photography design art drawer', w:580, render:bPhotos },
    { id:'writing', glyph:'✎', label:'writing/',   title:'writing/',  kw:'essays poetry words', w:500, render:bWriting },
    { id:'reading', glyph:'≡', label:'reading/',   title:'reading/',  kw:'books influences desk', w:400, render:bReading },
    { id:'certs',   glyph:'★', label:'certs.zip',  title:'certs.zip', kw:'certifications elastic anthropic', w:460, render:bCerts },
    { id:'contact', glyph:'✉', label:'contact',    title:'contact',   kw:'email linkedin github hire', w:420, render:bContact },
  ];
  const SECRET = { id:'secret', glyph:'⚘', title:'secret.txt', w:440, render:bSecret };
  const ALL = APPS.concat([SECRET]);
  const byId = Object.fromEntries(ALL.map(a=>[a.id,a]));

  const desk = document.getElementById('desk');
  const wins = {};
  let zTop = 10;

  // ─── Build windows ───────────────────────────────────────
  ALL.forEach(app => {
    const win = document.createElement('section');
    win.className = 'win' + (app.term ? ' term' : '');
    win.id = 'win-' + app.id;
    win.style.width = app.w + 'px';
    win.setAttribute('role','dialog');
    win.innerHTML = `
      <header class="bar">
        <div class="lights">
          <button class="lt c" aria-label="Close"></button>
          <button class="lt m" aria-label="Minimize"></button>
          <button class="lt x" aria-label="Maximize"></button>
        </div>
        <div class="ttl">${esc(app.title)}</div>
        <div class="spacer-r"></div>
      </header>
      <div class="body">${app.render()}</div>`;
    desk.appendChild(win);
    wins[app.id] = win;

    win.querySelector('.lt.c').addEventListener('click', e=>{ e.stopPropagation(); closeApp(app.id); });
    win.querySelector('.lt.m').addEventListener('click', e=>{ e.stopPropagation(); minApp(app.id); });
    win.querySelector('.lt.x').addEventListener('click', e=>{ e.stopPropagation(); maxApp(app.id); });
    win.querySelector('.bar').addEventListener('dblclick', ()=> maxApp(app.id));
    win.addEventListener('pointerdown', ()=> focusWin(app.id), true);
    makeDraggable(win, win.querySelector('.bar'));
  });

  // ─── Desktop icons ───────────────────────────────────────
  const iconWrap = document.getElementById('icons');
  APPS.forEach(app=>{
    const b = document.createElement('button');
    b.className = 'dicon';
    b.innerHTML = `<span class="gl">${esc(app.glyph)}</span><span class="lbl">${esc(app.label)}</span>`;
    b.addEventListener('click', ()=>{ clearSel(); b.classList.add('sel'); });
    b.addEventListener('dblclick', ()=> openApp(app.id));
    // single click opens too (friendlier), but keep dbl for the "OS" feel — use a quick timer
    let t=null;
    b.addEventListener('click', ()=>{ if(t){clearTimeout(t);t=null;return;} t=setTimeout(()=>{ openApp(app.id); t=null; }, 200); });
    iconWrap.appendChild(b);
  });
  function clearSel(){ document.querySelectorAll('.dicon.sel').forEach(i=>i.classList.remove('sel')); }
  desk.addEventListener('pointerdown', e=>{ if(e.target===desk||e.target===iconWrap) clearSel(); });

  // ─── Dock ────────────────────────────────────────────────
  const dock = document.getElementById('dock');
  APPS.forEach(app=>{
    const d = document.createElement('button');
    d.className = 'dock-app'; d.dataset.app = app.id;
    d.innerHTML = `<span>${esc(app.glyph)}</span><span class="run"></span><span class="tip">${esc(app.label)}</span>`;
    d.addEventListener('click', ()=> openApp(app.id));
    dock.appendChild(d);
  });
  const div = document.createElement('div'); div.className='dock-div'; dock.appendChild(div);
  const searchBtn = document.createElement('button'); searchBtn.className='dock-btn'; searchBtn.innerHTML='⌕'; searchBtn.title='Search (⌘K)';
  searchBtn.addEventListener('click', openSpotlight); dock.appendChild(searchBtn);
  const themeBtn = document.createElement('button'); themeBtn.className='dock-btn'; themeBtn.innerHTML='◐'; themeBtn.title='Theme';
  themeBtn.addEventListener('click', toggleTheme); dock.appendChild(themeBtn);
  const clock = document.createElement('div'); clock.className='dock-clock'; dock.appendChild(clock);
  function tick(){ clock.textContent = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }
  tick(); setInterval(tick, 15000);
  function setDockRunning(id, on){ const d=dock.querySelector(`.dock-app[data-app="${id}"]`); if(d) d.classList.toggle('running', on); }

  // ─── Window manager ──────────────────────────────────────
  function focusWin(id){
    Object.values(wins).forEach(w=>w.classList.remove('focused'));
    const win = wins[id]; if(!win) return;
    win.classList.add('focused');
    win.style.zIndex = (++zTop);
  }
  function placeWindow(win, id){
    if (win.dataset.placed) return;
    const i = Object.values(wins).filter(w=>w.dataset.placed).length;
    const baseX = 360, baseY = 64;
    let x = baseX + (i*32), y = baseY + (i*30);
    const maxX = window.innerWidth - win.offsetWidth - 40;
    if (x > maxX) x = Math.max(40, maxX - (i%3)*40);
    if (y > window.innerHeight - 260) y = baseY + (i%4)*26;
    win.style.left = x + 'px'; win.style.top = y + 'px';
    win.dataset.placed = '1';
  }
  function openApp(id){
    const win = wins[id]; if(!win) return;
    const wasOpen = win.classList.contains('open') && win.dataset.min!=='1';
    placeWindow(win, id);
    win.classList.add('open'); win.dataset.min='';
    if(!wasOpen){ win.classList.add('appearing'); setTimeout(()=>win.classList.remove('appearing'),200); }
    focusWin(id); setDockRunning(id, true); closeSpotlight();
  }
  function closeApp(id){
    const win = wins[id]; if(!win) return;
    win.classList.remove('open','focused','maximized'); win.dataset.min='';
    setDockRunning(id, false);
  }
  function minApp(id){
    const win = wins[id]; if(!win) return;
    win.classList.add('minimizing');
    setTimeout(()=>{ win.classList.remove('open','minimizing','focused'); win.dataset.min='1'; }, 180);
  }
  function maxApp(id){ wins[id] && wins[id].classList.toggle('maximized'); focusWin(id); }

  function makeDraggable(win, handle){
    let sx, sy, ox, oy, dragging=false;
    handle.addEventListener('pointerdown', e=>{
      if(e.target.classList.contains('lt')) return;
      if(win.classList.contains('maximized')) return;
      dragging=true; win.dataset.placed='1';
      sx=e.clientX; sy=e.clientY;
      const r=win.getBoundingClientRect(); ox=r.left; oy=r.top;
      handle.setPointerCapture(e.pointerId); focusWin(win.id.replace('win-',''));
    });
    handle.addEventListener('pointermove', e=>{
      if(!dragging) return;
      let nx=ox+(e.clientX-sx), ny=oy+(e.clientY-sy);
      nx=Math.max(-win.offsetWidth+120, Math.min(nx, window.innerWidth-120));
      ny=Math.max(0, Math.min(ny, window.innerHeight-90));
      win.style.left=nx+'px'; win.style.top=ny+'px';
    });
    handle.addEventListener('pointerup', e=>{ dragging=false; try{handle.releasePointerCapture(e.pointerId);}catch(_){} });
  }

  // ─── Polaroids ───────────────────────────────────────────
  const photos = (art && art.items ? art.items.filter(a=>a.kind==='photo') : []).slice(0,3);
  const polaSpots = [
    { x: window.innerWidth-250, y: 120, r: -4 },
    { x: window.innerWidth-205, y: 320, r: 5 },
    { x: window.innerWidth-280, y: 510, r: -2 },
  ];
  photos.forEach((a,i)=>{
    const sp = polaSpots[i] || { x: window.innerWidth-240, y: 140+i*180, r: 0 };
    const p = document.createElement('div');
    p.className='pola';
    p.style.left = Math.max(20, sp.x)+'px'; p.style.top = sp.y+'px';
    p.style.transform = `rotate(${sp.r}deg)`;
    const tag = ((a.location||a.client||'').toUpperCase()) + (a.date?(' · '+a.date):'');
    p.innerHTML = `<div class="shot">${esc(tag)}</div><div class="cap">${esc(a.caption||'')}</div>`;
    desk.appendChild(p);
    makePolaDraggable(p, sp.r);
  });
  function makePolaDraggable(el, rot){
    let sx,sy,ox,oy,drag=false;
    el.addEventListener('pointerdown', e=>{
      drag=true; sx=e.clientX; sy=e.clientY;
      const r=el.getBoundingClientRect(); ox=r.left; oy=r.top;
      el.style.zIndex=200; el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e=>{
      if(!drag) return;
      el.style.left=(ox+(e.clientX-sx))+'px'; el.style.top=(oy+(e.clientY-sy))+'px';
      el.style.transform=`rotate(${rot}deg)`;
    });
    el.addEventListener('pointerup', e=>{ drag=false; try{el.releasePointerCapture(e.pointerId);}catch(_){} });
  }

  // ─── Spotlight ───────────────────────────────────────────
  const spot = document.getElementById('spot');
  const spotQ = document.getElementById('spot-q');
  const spotResults = document.getElementById('spot-results');
  let spotSel = 0, spotList = [];
  function openSpotlight(){ spot.classList.add('open'); spotQ.value=''; renderSpot(''); spotQ.focus(); }
  function closeSpotlight(){ spot.classList.remove('open'); }
  function renderSpot(q){
    q = q.toLowerCase().trim();
    spotList = APPS.filter(a => !q || a.label.toLowerCase().includes(q) || a.title.toLowerCase().includes(q) || a.kw.includes(q));
    spotSel = 0;
    spotResults.innerHTML = spotList.map((a,i)=>`
      <div class="spot-item${i===0?' sel':''}" data-i="${i}">
        <div class="si">${esc(a.glyph)}</div>
        <div><div class="st">${esc(a.label)}</div><div class="sd">${esc(a.kw.split(' ').slice(0,3).join(' · '))}</div></div>
      </div>`).join('') || `<div class="spot-item"><div class="sd" style="padding:8px">no matches</div></div>`;
    spotResults.querySelectorAll('.spot-item[data-i]').forEach(el=>{
      el.addEventListener('click', ()=>{ openApp(spotList[+el.dataset.i].id); });
      el.addEventListener('mousemove', ()=>{ setSpotSel(+el.dataset.i); });
    });
  }
  function setSpotSel(i){ spotSel=i; spotResults.querySelectorAll('.spot-item[data-i]').forEach(el=>el.classList.toggle('sel', +el.dataset.i===i)); }
  spotQ.addEventListener('input', e=> renderSpot(e.target.value));
  spotQ.addEventListener('keydown', e=>{
    if(e.key==='ArrowDown'){ e.preventDefault(); setSpotSel(Math.min(spotSel+1, spotList.length-1)); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); setSpotSel(Math.max(spotSel-1,0)); }
    else if(e.key==='Enter'){ e.preventDefault(); if(spotList[spotSel]) openApp(spotList[spotSel].id); }
  });
  spot.addEventListener('click', e=>{ if(e.target===spot) closeSpotlight(); });

  // ─── Keyboard ────────────────────────────────────────────
  document.addEventListener('keydown', e=>{
    if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); spot.classList.contains('open')?closeSpotlight():openSpotlight(); return; }
    if(e.key==='Escape'){
      if(spot.classList.contains('open')){ closeSpotlight(); return; }
      const f = Object.entries(wins).find(([id,w])=>w.classList.contains('focused') && w.classList.contains('open'));
      if(f) closeApp(f[0]);
    }
  });

  // ─── Konami ──────────────────────────────────────────────
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let ki = 0;
  document.addEventListener('keydown', e=>{
    const k = e.key.length===1 ? e.key.toLowerCase() : e.key;
    if(k===seq[ki]){ ki++; if(ki===seq.length){ ki=0; konami(); } } else { ki = (k===seq[0])?1:0; }
  });
  function konami(){
    const t=document.getElementById('egg-toast');
    t.textContent='↑↑↓↓←→←→ ba — the désign daemon wakes';
    t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2600);
    openApp('secret');
    glyphRain();
  }
  function glyphRain(){
    const glyphs='✦✧·◦∘※❉✺'.split('');
    for(let i=0;i<30;i++){
      const s=document.createElement('div');
      s.textContent=glyphs[Math.floor(Math.random()*glyphs.length)];
      s.style.cssText=`position:fixed;z-index:280;pointer-events:none;color:var(--accent);font-size:${10+Math.random()*16}px;left:${Math.random()*100}vw;top:-30px;opacity:${.4+Math.random()*.5}`;
      document.body.appendChild(s);
      s.animate([{transform:'translateY(0) rotate(0)'},{transform:`translateY(${window.innerHeight+60}px) rotate(${Math.random()*360}deg)`}],
        {duration:2200+Math.random()*1800, easing:'cubic-bezier(.4,0,.6,1)'}).onfinish=()=>s.remove();
    }
  }

  // ─── Topographic wallpaper ───────────────────────────────
  const canvas = document.getElementById('topo');
  const ctx = canvas.getContext('2d');
  function drawTopo(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W*dpr; canvas.height = H*dpr;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const cs = getComputedStyle(root);
    const g1 = cs.getPropertyValue('--d1').trim(), g2 = cs.getPropertyValue('--d2').trim(), g3 = cs.getPropertyValue('--d3').trim();
    const line = cs.getPropertyValue('--topo').trim(), lineHi = cs.getPropertyValue('--topo-strong').trim();
    // backdrop gradient
    const grad = ctx.createLinearGradient(0,0,W,H);
    grad.addColorStop(0,g1); grad.addColorStop(.5,g2); grad.addColorStop(1,g3);
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
    // contour "peaks"
    const centers = [
      {x:W*0.26, y:H*0.34, max:Math.max(W,H)*0.5, ph:0.6},
      {x:W*0.74, y:H*0.66, max:Math.max(W,H)*0.46, ph:2.1},
      {x:W*0.58, y:H*0.18, max:Math.max(W,H)*0.32, ph:4.0},
    ];
    ctx.lineWidth = 1;
    centers.forEach((c,ci)=>{
      for(let r=34; r<c.max; r+=24){
        ctx.beginPath();
        const steps=96;
        for(let s=0;s<=steps;s++){
          const a=(s/steps)*Math.PI*2;
          const wob = Math.sin(a*3 + c.ph + r*0.012)*r*0.06
                    + Math.sin(a*5 - c.ph*1.5 + r*0.02)*r*0.035
                    + Math.cos(a*2 + ci)*r*0.05;
          const rr = r + wob;
          const x = c.x + Math.cos(a)*rr;
          const y = c.y + Math.sin(a)*rr*0.86;
          s===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.closePath();
        ctx.strokeStyle = (Math.round(r/24) % 5 === 0) ? lineHi : line;
        ctx.stroke();
      }
    });
  }
  drawTopo();
  let rz; window.addEventListener('resize', ()=>{ clearTimeout(rz); rz=setTimeout(drawTopo, 120); });

  // ─── Hint ────────────────────────────────────────────────
  document.getElementById('hint').innerHTML =
    `<span class="kbd">⌘K</span> search · double-click an icon · drag titlebars · <span class="kbd">Esc</span> closes`;

  // ─── Boot ────────────────────────────────────────────────
  const boot = document.getElementById('boot');
  function runBoot(){
    const lines = boot.querySelectorAll('.line');
    lines.forEach((l,i)=> setTimeout(()=> l.classList.add('show'), 240*i));
    const total = 240*lines.length + 520;
    setTimeout(finishBoot, total);
  }
  let booted=false;
  function finishBoot(){
    if(booted) return; booted=true;
    boot.classList.add('gone');
    setTimeout(()=>{ boot.style.display='none'; openApp('about'); }, 600);
    sessionStorage.setItem('os-booted','1');
  }
  boot.addEventListener('click', finishBoot);
  if(sessionStorage.getItem('os-booted')){
    boot.style.display='none'; booted=true; openApp('about');
  } else {
    runBoot();
  }
})();
