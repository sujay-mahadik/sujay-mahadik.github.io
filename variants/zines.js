/* ════════════════════════════════════════════════════════════════
   zines.js — HKA newsstand: tile, rack card, and the book reader.
   Exposes window.ZinesUI.  Designed to drop into the real site:
     • mountTile(cardEl, variant)  → render the #c-zines tile
     • openRack(mountFn)           → build the rack-card modal body
     • openReader(issue, index)    → the fullscreen book reader
   ════════════════════════════════════════════════════════════════ */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── DATA ─────────────────────────────────────────────────────
  // Populated by mountTile() from content/zines.json.
  let three = null;
  let catalogue = [];

  let PH = {};   // blur placeholders, loaded async
  fetch('zines/placeholders.json').then(r => r.json()).then(p => PH = p).catch(() => {});
  const ph = name => PH[name] || '';

  // ── TILE ─────────────────────────────────────────────────────
  function mountTile(card, variant, data) {
    if (!data || !data.catalogue) return;
    catalogue = data.catalogue;
    const avail = catalogue.find(z => z.state === 'available');
    if (!avail) return;
    const base = `assets/zines/${avail.slug}/web/`;
    three = { ...avail, kind: avail.kind, views: avail.views.map(v => ({ ...v, src: base + v.name + '.jpg' })) };

    variant = variant || 'rack';
    card.classList.add('zns-card');
    card.dataset.zv = variant;

    const coverBg = `background-image:url('${three.cover}')`;
    const archives = catalogue.filter(z => z.state === 'archive');
    const ghosts = archives.slice(-2).map((z, idx) => {
      const cls = idx === 0 ? 'l2' : 'l1';
      return `<div class="zns-cover ghost ${cls}"><span class="zns-tab">\u2116 ${z.num}</span></div>`;
    }).join('');

    card.innerHTML = `
      <div class="zns-stack">
        ${ghosts}
        <div class="zns-cover lead" style="${coverBg}"><span class="zns-spine"></span></div>
      </div>
      <div class="zns-body">
        <div class="zns-head">
          <span class="zns-wordmark">08 \u00b7 Zines</span>
          <span class="zns-issuecount">Est. 2022</span>
        </div>
        <div class="zns-foot">
          <div class="zns-sub">
            <span>No.\u00a0${three.num}</span>
            <span class="zns-dot"></span>
            <span>${three.date}</span>
          </div>
          <span class="zns-stamp">Read \u2192</span>
        </div>
      </div>`;
  }


  // ── RACK CARD (modal body) ───────────────────────────────────
  function rackHTML() {
    const arch = catalogue.map(z => {
      if (z.state === 'available') {
        return `<div class="zns-arch live" data-open="1">
          <div class="zns-acover" style="background-image:url('${three.cover}')"></div>
          <div class="zns-anum">\u2116 ${three.num} \u00b7 current</div>
          <div class="zns-aname">A Thousand Desires</div>
        </div>`;
      }
      const cls = z.state === 'soon' ? 'soon' : 'archive';
      const tag = z.state === 'soon' ? 'in the works' : 'print only';
      return `<div class="zns-arch ${cls}">
        <div class="zns-acover"></div>
        <div class="zns-anum">\u2116 ${z.num} \u00b7 ${tag}</div>
        <div class="zns-aname">${z.name}</div>
      </div>`;
    }).join('');

    return `
      <div class="zns-masthead">
        <div class="km">08 \u00b7 The Newsstand</div>
        <h2 class="zns-mh-title">HKA <em>\u2014</em> Hazaron Khwahishen&nbsp;Aisi</h2>
        <div class="zns-mh-meta">A self-published film-photo &amp; poetry zine. Hand-sequenced spreads,
          shot on 35&nbsp;mm, set in small print runs.</div>
      </div>

      <div class="zns-feature">
        <div class="zns-fcover" data-open="1" style="background-image:url('${three.cover}')">
          <div class="zns-readcue"><span>Open the book</span></div>
        </div>
        <div class="zns-fmeta">
          <div class="km">\u2116 ${three.num} \u00b7 Latest issue \u00b7 ${three.date}</div>
          <h3 class="zns-ft">A Thousand <em>Desires</em></h3>
          <div class="zns-fsub">${three.kind}</div>
          <p class="zns-fblurb">${three.blurb}</p>
          <div class="zns-frow">
            <button class="zns-btn primary" data-open="1">\u2197 Read the issue</button>
            <a class="zns-btn ghost" href="${three.pdf}" download>\u2193 PDF</a>
            <span class="zns-availtag available">In print</span>
          </div>
        </div>
      </div>

      <div class="zns-archive">
        <h4>The full run</h4>
        <div class="zns-spines">${arch}</div>
      </div>`;
  }

  // wire clicks inside a freshly-rendered rack body
  function wireRack(root) {
    root.querySelectorAll('[data-open]').forEach(el =>
      el.addEventListener('click', () => openReader(three, 0)));
  }

  // ── BOOK READER ──────────────────────────────────────────────
  // Narrow / portrait screens get a true single-page reader instead of
  // a two-page spread squished into a phone (see openReaderMobile).
  const isMobile = () => matchMedia('(max-width: 700px)').matches;

  function openReader(issue, start) {
    if (isMobile()) return openReaderMobile(issue, start);
    const views = issue.views;
    let i = Math.max(0, Math.min(start || 0, views.length - 1));
    let busy = false;

    const ov = document.createElement('div');
    ov.className = 'zns-reader';
    ov.innerHTML = `
      <div class="zns-reader-top">
        <div class="zns-rt-l">
          <span class="zns-rt-mark">${issue.issue} \u00b7 \u2116 ${issue.num}</span>
          <span class="zns-rt-title">Hazaron Khwahishen Aisi</span>
        </div>
        <div class="zns-rt-r">
          <a class="zns-rt-btn" href="${issue.pdf}" download>\u2193 PDF</a>
          <button class="zns-rt-btn zns-rt-close" aria-label="Close">\u2715</button>
        </div>
      </div>
      <div class="zns-stage">
        <div class="zns-ambient" data-amb="a"></div>
        <div class="zns-ambient" data-amb="b"></div>
        <div class="zns-vignette"></div>
        <div class="zns-zone l" data-dir="-1"></div>
        <div class="zns-zone r" data-dir="1"></div>
        <div class="zns-book">
          <div class="zns-base"></div>
          <div class="zns-fold-shadow"></div>
          <div class="zns-gutter"></div>
        </div>
      </div>
      <div class="zns-reader-foot">
        <button class="zns-nav zns-prev" aria-label="Previous">\u2039</button>
        <div class="zns-progress">
          <div class="zns-pcount"></div>
          <div class="zns-pbar"><i></i></div>
        </div>
        <button class="zns-nav zns-next" aria-label="Next">\u203a</button>
      </div>`;
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => ov.classList.add('open'));

    const book   = ov.querySelector('.zns-book');
    const baseEl = ov.querySelector('.zns-base');
    const fold   = ov.querySelector('.zns-fold-shadow');
    const ambA   = ov.querySelector('[data-amb="a"]');
    const ambB   = ov.querySelector('[data-amb="b"]');
    const pcount = ov.querySelector('.zns-pcount');
    const pbar   = ov.querySelector('.zns-pbar i');
    const prevB  = ov.querySelector('.zns-prev');
    const nextB  = ov.querySelector('.zns-next');

    const cache = {};
    function preload(idx) {
      if (idx < 0 || idx >= views.length || cache[idx]) return;
      const im = new Image(); im.src = views[idx].src; cache[idx] = im;
    }

    let ambCur = ambA;
    function setAmbient(view) {
      const next = (ambCur === ambA) ? ambB : ambA;
      next.style.backgroundImage = `url('${view.src}')`;
      next.classList.add('show');
      ambCur.classList.remove('show');
      ambCur = next;
    }

    // a paper sheet for a whole view, sized to its slot (full / right / left)
    function makeSheet(view) {
      const sheet = document.createElement('div');
      sheet.className = 'zns-sheet ' + view.slot;
      const phUrl = ph(view.name);
      let p = null;
      if (phUrl) {
        p = document.createElement('div');
        p.className = 'zns-ph';
        p.style.backgroundImage = `url('${phUrl}')`;
        sheet.appendChild(p);
      }
      const img = document.createElement('img');
      img.alt = '';
      if (p) { img.onload = () => p.classList.add('gone'); }
      img.src = view.src;
      if (p && img.complete) p.classList.add('gone');
      sheet.appendChild(img);
      return sheet;
    }

    // one face (half-panel) of the turning leaf; transparent if the view
    // doesn't occupy that half (e.g. the blank beside a cover)
    function buildFace(view, half, isBack) {
      const face = document.createElement('div');
      face.className = 'zns-face' + (isBack ? ' zns-back' : '');
      const fills = view.slot === 'full' || view.slot === half;
      if (fills) {
        face.classList.add('paper');
        const img = document.createElement('img');
        img.alt = ''; img.src = view.src;
        if (view.slot === 'full') {
          img.style.width = '200%';
          img.style.left = (half === 'right') ? '-100%' : '0';
        } else {
          img.style.width = '100%';
          img.style.left = '0';
        }
        face.appendChild(img);
      }
      return face;
    }

    function paintBase() {
      const v = views[i];
      book.classList.toggle('zns-spread', v.slot === 'full');
      baseEl.innerHTML = '';
      baseEl.appendChild(makeSheet(v));
      setAmbient(v);
    }
    function chrome() {
      pcount.textContent = `${i + 1} / ${views.length}`;
      pbar.style.width = ((i + 1) / views.length * 100) + '%';
      prevB.disabled = i === 0;
      nextB.disabled = i === views.length - 1;
      preload(i + 1); preload(i - 1);
    }
    function render() { paintBase(); chrome(); }

    function turn(dir) {
      if (busy) return;
      const to = i + dir;
      if (to < 0 || to >= views.length) return;
      if (reduce) { i = to; render(); return; }
      busy = true;
      const fromV = views[i], toV = views[to];
      const fwd = dir > 0;

      // destination page, revealed on the half the turning leaf uncovers
      const under = document.createElement('div');
      under.className = 'zns-under';
      under.style.clipPath = fwd ? 'inset(0 0 0 50%)' : 'inset(0 50% 0 0)';
      under.appendChild(makeSheet(toV));

      // soft shadow the lifting leaf casts onto the page it sweeps over
      const cast = document.createElement('div');
      cast.className = 'zns-cast';
      cast.style.left = fwd ? '0' : '50%';
      cast.style.background = fwd
        ? 'linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,.30) 100%)'
        : 'linear-gradient(90deg, rgba(0,0,0,.30), rgba(0,0,0,0) 100%)';

      // the turning leaf — a half-page panel hinged at the gutter
      const leaf = document.createElement('div');
      leaf.className = 'zns-leaf';
      leaf.style.cssText = 'top:0;height:100%;width:50%;' +
        (fwd ? 'left:50%;transform-origin:left center;'
             : 'left:0;transform-origin:right center;');

      const front = buildFace(fromV, fwd ? 'right' : 'left', false);
      const back  = buildFace(toV,  fwd ? 'left'  : 'right', true);

      // per-face shading: darkest toward the gutter (the hinge)
      const fShade = document.createElement('div'); fShade.className = 'zns-shade';
      const bShade = document.createElement('div'); bShade.className = 'zns-shade';
      fShade.style.background = fwd
        ? 'linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,0) 62%)'
        : 'linear-gradient(270deg, rgba(0,0,0,.55), rgba(0,0,0,0) 62%)';
      bShade.style.background = fwd
        ? 'linear-gradient(270deg, rgba(0,0,0,.5), rgba(0,0,0,0) 62%)'
        : 'linear-gradient(90deg, rgba(0,0,0,.5), rgba(0,0,0,0) 62%)';
      front.appendChild(fShade); back.appendChild(bShade);
      leaf.appendChild(front); leaf.appendChild(back);
      book.appendChild(under);
      book.appendChild(cast);
      book.appendChild(leaf);

      const DUR = 780;
      const end = fwd ? -180 : 180;
      const ease = 'cubic-bezier(.45,.05,.25,1)';

      // debug freeze (inert in production): window.__zineFreeze = 0..1
      if (typeof window.__zineFreeze === 'number') {
        const f = window.__zineFreeze;
        leaf.style.transform = `rotateY(${end * f}deg)`;
        fShade.style.opacity = f < .5 ? f : .5;
        bShade.style.opacity = f < .5 ? .5 : (1 - f);
        cast.style.opacity = (1 - Math.abs(f - .5) * 2) * .55;
        busy = false;
        return;
      }

      const leafAnim = leaf.animate(
        [{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${end}deg)` }],
        { duration: DUR, easing: ease });
      // front darkens as it lifts away; hidden once past vertical
      fShade.animate([{ opacity: 0 }, { opacity: .5, offset: .5 }, { opacity: .5 }],
        { duration: DUR, easing: 'ease-in' });
      // back enters dark (near the spine) then flattens into the light
      bShade.animate([{ opacity: .5 }, { opacity: .5, offset: .5 }, { opacity: 0 }],
        { duration: DUR, easing: 'ease-out' });
      cast.animate([{ opacity: 0 }, { opacity: .55, offset: .5 }, { opacity: 0 }],
        { duration: DUR, easing: 'ease-in-out' });
      fold.animate([{ opacity: 0 }, { opacity: .35, offset: .5 }, { opacity: 0 }],
        { duration: DUR, easing: 'ease-in-out' });

      let done = false;
      const commit = () => {
        if (done) return; done = true;
        i = to;
        render();
        leaf.remove(); under.remove(); cast.remove();
        busy = false;
      };
      leafAnim.onfinish = commit;
      // safety net: WAAPI onfinish is throttled when the tab is offscreen,
      // so guarantee the turn commits even if the event never fires.
      setTimeout(commit, DUR + 140);
    }

    // ── CURLED page-turn (mode 2) ───────────────────────────────
    // The turning leaf is rebuilt from N vertical strips laid along an
    // arc, so the sheet visibly bends like paper. Each strip is a true
    // double-sided panel: a FRONT face carrying the current page and a
    // BACK face (pre-flipped 180°) carrying the destination page. The
    // background-position of every face is solved in book coordinates so
    // the back reads as the *next* page — not a mirror of the current one.
    //
    //   geometry recap (book spans 0..2L, gutter/​hinge at x = L):
    //     forward  → right page lifts, swings left, lands face-down at left
    //     backward → left page lifts, swings right, lands face-down at right
    //
    //   per-face background solve (s = strip's hinge-offset, w = strip width):
    //     family A  → full: -(L+s)   half: -s        (fwd FRONT / back BACK)
    //     family B  → s + w - L  (both full & half)   (fwd BACK  / back FRONT)
    //   A faces are upright; B faces ride a flipped child, and the two 180°
    //   rotations cancel so the slice lands upright over the right column.
    function turnCurl(dir) {
      if (busy) return;
      const to = i + dir;
      if (to < 0 || to >= views.length) return;
      if (reduce) { i = to; render(); return; }
      busy = true;
      const fromV = views[i], toV = views[to];
      const fwd = dir > 0;

      const bw = book.getBoundingClientRect().width;
      const L  = bw / 2;                // one page width (px)
      const N  = 26;                    // strips
      const ds = L / N;                 // material step between hinges
      const w  = ds + 1.1;              // drawn width (overlap hides seams)

      // destination spread, revealed on the half the leaf uncovers
      const under = document.createElement('div');
      under.className = 'zns-under';
      under.style.clipPath = fwd ? 'inset(0 0 0 50%)' : 'inset(0 50% 0 0)';
      under.appendChild(makeSheet(toV));
      book.appendChild(under);

      // soft shadow the lifting leaf throws onto the page it sweeps over
      const cast = document.createElement('div');
      cast.className = 'zns-cast';
      cast.style.left = fwd ? '0' : '50%';
      cast.style.background = fwd
        ? 'linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,.32) 100%)'
        : 'linear-gradient(90deg, rgba(0,0,0,.32), rgba(0,0,0,0) 100%)';
      book.appendChild(cast);

      // container spans the whole book; strips hinge at the centre gutter
      const curl = document.createElement('div');
      curl.className = 'zns-curl';
      curl.style.cssText = 'top:0;height:100%;left:0;width:100%;';
      book.appendChild(curl);

      const fillsFront = fromV.slot === 'full' || fromV.slot === (fwd ? 'right' : 'left');
      const fillsBack  = toV.slot   === 'full' || toV.slot   === (fwd ? 'left'  : 'right');

      // build the strips, each a double-sided panel hinged at the gutter
      const strips = [];
      for (let k = 0; k < N; k++) {
        const s = k * ds;

        const st = document.createElement('div');
        st.className = 'zns-strip';
        st.style.width = w + 'px';
        st.style.transformOrigin = (fwd ? '0%' : '100%') + ' 50%';

        // paint one face's vertical slice of a page (or leave it empty)
        const paint = (face, page, fills, family) => {
          if (!fills) { face.style.background = 'transparent'; return null; }
          const full = page.slot === 'full';
          const span = full ? 2 * L : L;
          const bgX  = family === 'A' ? (full ? -(L + s) : -s) : (s + w - L);
          face.style.backgroundImage    = `url('${page.src}')`;
          face.style.backgroundSize     = span + 'px 100%';
          face.style.backgroundRepeat   = 'no-repeat';
          face.style.backgroundPositionX = bgX + 'px';
          const sh = document.createElement('div'); sh.className = 'zns-sh';
          face.appendChild(sh);
          return sh;
        };

        const front = document.createElement('div'); front.className = 'zns-sface';
        const back  = document.createElement('div'); back.className  = 'zns-sface zns-sback';
        const fSh = paint(front, fromV, fillsFront, fwd ? 'A' : 'B');
        const bSh = paint(back,  toV,   fillsBack,  fwd ? 'B' : 'A');

        st.appendChild(front); st.appendChild(back);
        curl.appendChild(st);
        strips.push({ st, u: s / L, fSh, bSh });
      }

      const DUR = 820;
      const t0  = performance.now();
      const easeOut = x => 1 - Math.pow(1 - x, 3);
      const RAD = Math.PI / 180;
      const curlMax = 20;               // peak bend across the page (deg)
      const dirSign = fwd ? 1 : -1;

      function frame(now) {
        const frozen = (typeof window.__zineFreeze === 'number');
        const p = frozen ? window.__zineFreeze : Math.min(1, (now - t0) / DUR);
        const e = easeOut(p);
        const spine = (fwd ? -180 : 180) * e;            // base hinge angle
        const bend  = curlMax * Math.sin(Math.PI * p);   // curvature, peaks mid-turn

        // integrate along the arc from the gutter so strips stay joined
        let x = L, z = 0, prevDeg = 0;
        for (let k = 0; k < N; k++) {
          const o = strips[k];
          const deg = spine + dirSign * bend * o.u;      // outer strips lag → curl
          if (k > 0) {
            x += dirSign * ds * Math.cos(prevDeg * RAD);
            z += -dirSign * ds * Math.sin(prevDeg * RAD); // lift toward viewer
          }
          const tx = fwd ? x : x - w;                    // place hinge edge
          o.st.style.transform = `translate3d(${tx}px,0,${z}px) rotateY(${deg}deg)`;
          const dark = Math.min(.62, Math.abs(deg) / 180 * .72);
          if (o.fSh) o.fSh.style.opacity = dark;
          if (o.bSh) o.bSh.style.opacity = Math.max(0, .5 - dark);
          prevDeg = deg;
        }
        cast.style.opacity = (1 - Math.abs(p - .5) * 2) * .5;

        if (frozen) { busy = false; return; }
        if (p < 1) requestAnimationFrame(frame);
        else commit();
      }
      let done = false;
      const commit = () => {
        if (done) return; done = true;
        i = to; render();
        curl.remove(); under.remove(); cast.remove();
        busy = false;
      };
      requestAnimationFrame(frame);
      if (typeof window.__zineFreeze !== 'number') setTimeout(commit, DUR + 220);
      else frame(performance.now());
    }

    // controls
    const go = d => (window.ZINE_FLIP === 'curl' ? turnCurl(d) : turn(d));
    nextB.addEventListener('click', () => go(1));
    prevB.addEventListener('click', () => go(-1));
    ov.querySelectorAll('.zns-zone').forEach(z =>
      z.addEventListener('click', () => go(+z.dataset.dir)));
    function onKey(e) {
      if (e.key === 'Escape') return close();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); go(-1); }
    }
    window.addEventListener('keydown', onKey);

    // touch swipe
    let sx = 0;
    ov.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    ov.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    function close() {
      ov.classList.remove('open');
      window.removeEventListener('keydown', onKey);
      setTimeout(() => { ov.remove(); document.body.style.overflow = ''; }, 320);
    }
    ov.querySelector('.zns-rt-close').addEventListener('click', close);

    render();
  }

  // ── MOBILE READER ────────────────────────────────────────────
  // A spread (slot:full) is two leaves; a cover/back (slot:right/left)
  // is one. We expand the run into single 3:4 pages and present them as
  // a swipeable horizontal stack — the natural phone reading gesture.
  function openReaderMobile(issue, startView) {
    // expand views → single pages
    const pages = [];
    let startPage = 0;
    issue.views.forEach((v, vi) => {
      if (vi === (startView || 0)) startPage = pages.length;
      if (v.slot === 'full') {
        pages.push({ src: v.src, name: v.name, half: 'left'  });
        pages.push({ src: v.src, name: v.name, half: 'right' });
      } else {
        pages.push({ src: v.src, name: v.name, half: 'whole' });
      }
    });

    let i = Math.max(0, Math.min(startPage, pages.length - 1));

    const ov = document.createElement('div');
    ov.className = 'zns-reader zns-mobile';
    ov.innerHTML = `
      <div class="zns-ambient" data-amb="a"></div>
      <div class="zns-ambient" data-amb="b"></div>
      <div class="zns-vignette"></div>
      <div class="zns-reader-top">
        <div class="zns-rt-l">
          <span class="zns-rt-mark">\u2116 ${issue.num}</span>
          <span class="zns-rt-title">Hazaron Khwahishen Aisi</span>
        </div>
        <div class="zns-rt-r">
          <a class="zns-rt-btn" href="${issue.pdf}" download>\u2193 PDF</a>
          <button class="zns-rt-btn zns-rt-close" aria-label="Close">\u2715</button>
        </div>
      </div>
      <div class="zns-mstage">
        <div class="zns-mtrack"></div>
        <div class="zns-mhint"><span class="zns-mhint-ar">\u2039</span> swipe to turn <span class="zns-mhint-ar">\u203a</span></div>
      </div>
      <div class="zns-reader-foot">
        <button class="zns-nav zns-prev" aria-label="Previous">\u2039</button>
        <div class="zns-progress">
          <div class="zns-pcount"></div>
          <div class="zns-pbar"><i></i></div>
        </div>
        <button class="zns-nav zns-next" aria-label="Next">\u203a</button>
      </div>`;
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => ov.classList.add('open'));

    const track  = ov.querySelector('.zns-mtrack');
    const stage  = ov.querySelector('.zns-mstage');
    const pcount = ov.querySelector('.zns-pcount');
    const pbar   = ov.querySelector('.zns-pbar i');
    const prevB  = ov.querySelector('.zns-prev');
    const nextB  = ov.querySelector('.zns-next');
    const hint   = ov.querySelector('.zns-mhint');
    const ambA   = ov.querySelector('[data-amb="a"]');
    const ambB   = ov.querySelector('[data-amb="b"]');

    // build slides (images lazy-loaded by setWindow)
    const slides = pages.map((pg, k) => {
      const page = document.createElement('div');
      page.className = 'zns-mpage';
      const sheet = document.createElement('div');
      sheet.className = 'zns-msheet ' + (pg.half === 'whole' ? 'whole' : 'half');

      const phUrl = ph(pg.name);
      let phEl = null;
      if (phUrl) {
        phEl = document.createElement('div');
        phEl.className = 'zns-ph';
        phEl.style.backgroundImage = `url('${phUrl}')`;
        if (pg.half !== 'whole') {
          phEl.style.backgroundSize = '200% 100%';
          phEl.style.backgroundPositionX = pg.half === 'right' ? '100%' : '0%';
        } else {
          phEl.style.backgroundSize = 'cover';
        }
        sheet.appendChild(phEl);
      }

      const img = document.createElement('img');
      img.alt = '';
      if (pg.half === 'whole') { img.style.width = '100%'; img.style.left = '0'; }
      else { img.style.width = '200%'; img.style.left = pg.half === 'right' ? '-100%' : '0'; }
      img.onload = () => { if (phEl) phEl.classList.add('gone'); };
      sheet.appendChild(img);

      page.appendChild(sheet);
      track.appendChild(page);
      return { page, sheet, img, pg, loaded: false };
    });

    let W = stage.clientWidth;
    function place(animate) {
      track.style.transition = animate
        ? 'transform .44s cubic-bezier(.22,.61,.36,1)' : 'none';
      track.style.transform = `translate3d(${-i * W}px,0,0)`;
    }
    function setWindow() {
      slides.forEach((s, k) => {
        if (Math.abs(k - i) <= 2 && !s.loaded) { s.img.src = s.pg.src; s.loaded = true; }
      });
    }
    let ambCur = ambA;
    function setAmbient() {
      const next = (ambCur === ambA) ? ambB : ambA;
      next.style.backgroundImage = `url('${pages[i].src}')`;
      next.classList.add('show');
      ambCur.classList.remove('show');
      ambCur = next;
    }
    function update() {
      pcount.textContent = `${i + 1} / ${pages.length}`;
      pbar.style.width = ((i + 1) / pages.length * 100) + '%';
      prevB.disabled = i === 0;
      nextB.disabled = i === pages.length - 1;
      resetZoom(false);
      setWindow();
      setAmbient();
    }
    function go(n) {
      const to = Math.max(0, Math.min(n, pages.length - 1));
      if (to === i) { place(true); return; }
      i = to; place(true); update();
    }

    // ── zoom (double-tap) ──────────────────────────────────────
    let zoom = 1, panX = 0, panY = 0, panning = false, psx = 0, psy = 0;
    const curSheet = () => slides[i].sheet;
    function applyZoom(animate) {
      const s = curSheet();
      s.style.transition = animate ? 'transform .3s ease' : 'none';
      s.style.transform = zoom > 1 ? `translate(${panX}px,${panY}px) scale(${zoom})` : '';
      s.classList.toggle('zoomed', zoom > 1);
    }
    function resetZoom(animate) {
      if (zoom === 1) return;
      zoom = 1; panX = 0; panY = 0; applyZoom(animate);
      ov.classList.remove('chrome-hidden');
    }
    function clampPan() {
      const r = curSheet().getBoundingClientRect();
      const maxX = (r.width  * (1 - 1 / zoom)) / 2;
      const maxY = (r.height * (1 - 1 / zoom)) / 2;
      panX = Math.max(-maxX, Math.min(maxX, panX));
      panY = Math.max(-maxY, Math.min(maxY, panY));
    }
    function toggleZoom(clientX, clientY) {
      if (zoom > 1) { resetZoom(true); return; }
      const s = curSheet(); const r = s.getBoundingClientRect();
      s.style.transformOrigin =
        `${((clientX - r.left) / r.width) * 100}% ${((clientY - r.top) / r.height) * 100}%`;
      zoom = 2.3; panX = 0; panY = 0; applyZoom(true);
      ov.classList.add('chrome-hidden');
    }

    // ── pointer: drag-to-turn, tap, pan-when-zoomed ────────────
    let dragging = false, sx = 0, sy = 0, dx = 0, lock = null, t0 = 0;
    let lastTap = 0, tapTimer = null;
    function onDown(e) {
      hideHint();
      if (zoom > 1) {
        panning = true; psx = e.clientX - panX; psy = e.clientY - panY;
        curSheet().style.transition = 'none';
        try { stage.setPointerCapture(e.pointerId); } catch (_) {}
        return;
      }
      dragging = true; sx = e.clientX; sy = e.clientY; dx = 0; lock = null; t0 = performance.now();
      track.style.transition = 'none';
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    }
    function onMove(e) {
      if (panning) {
        panX = e.clientX - psx; panY = e.clientY - psy; clampPan();
        curSheet().style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`;
        e.preventDefault(); return;
      }
      if (!dragging) return;
      const mx = e.clientX - sx, my = e.clientY - sy;
      if (lock === null && (Math.abs(mx) > 8 || Math.abs(my) > 8))
        lock = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (lock !== 'x') return;
      dx = mx;
      if ((i === 0 && dx > 0) || (i === pages.length - 1 && dx < 0)) dx *= 0.34; // end resistance
      track.style.transform = `translate3d(${-i * W + dx}px,0,0)`;
      e.preventDefault();
    }
    function onUp(e) {
      if (panning) { panning = false; return; }
      if (!dragging) return; dragging = false;
      const dt = performance.now() - t0;
      const vx = dx / Math.max(1, dt); // px/ms
      if (lock !== 'x') { onTap(e); place(true); return; }
      const thresh = W * 0.2;
      if ((dx < -thresh || vx < -0.4) && i < pages.length - 1) { i++; update(); }
      else if ((dx > thresh || vx > 0.4) && i > 0) { i--; update(); }
      place(true);
    }
    function onTap(e) {
      const now = performance.now();
      if (now - lastTap < 300) {           // double-tap → zoom
        clearTimeout(tapTimer); lastTap = 0;
        toggleZoom(e.clientX, e.clientY);
      } else {                              // single-tap → toggle chrome
        lastTap = now;
        tapTimer = setTimeout(() => {
          if (zoom === 1) ov.classList.toggle('chrome-hidden');
          lastTap = 0;
        }, 260);
      }
    }
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);

    nextB.addEventListener('click', () => go(i + 1));
    prevB.addEventListener('click', () => go(i - 1));

    function onKey(e) {
      if (e.key === 'Escape') return close();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(i + 1); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); go(i - 1); }
    }
    window.addEventListener('keydown', onKey);

    function onResize() { W = stage.clientWidth; resetZoom(false); place(false); }
    window.addEventListener('resize', onResize);

    let hintGone = false;
    function hideHint() { if (hintGone) return; hintGone = true; hint.classList.add('gone'); }
    setTimeout(hideHint, 2600);

    function close() {
      ov.classList.remove('open');
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      setTimeout(() => { ov.remove(); document.body.style.overflow = ''; }, 320);
    }
    ov.querySelector('.zns-rt-close').addEventListener('click', close);

    // first paint
    place(false); update();
  }

  window.ZinesUI = { mountTile, rackHTML, wireRack, openReader };
})();
