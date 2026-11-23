/* Luxury Auto Service Centre, concept v5 "Under the lights". Live layer.
   app.js runs every tool on its own (damage card, compare, booking, dock); this file adds the rendered paint,
   the live opening status and the motion. The page reads in full without it.
   Measured on the field before writing (craft teardown + REA, Nov 2026): ESR Bespoke and Forge (both Awwwards
   Site of the Day, Oct 2026) carry one signature lighting idea, a serif voice, an accent under 2% of the screen,
   word-by-word manifesto fills and numbered chapters; Lusion and Active Theory put WebGL first; Forge's Lenis lerp
   is .09 and its eases are expo-out. Patterns only, written fresh.
   Libraries load after the page; if they are slow (3 s) or blocked, a CSS-only version runs instead.
   Reduced motion: the still image replaces the live paint and nothing moves. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- opening status and clock, Dubai time (UTC+4, no daylight saving) ---------- */
  const dubai = () => { const d = new Date(Date.now() + (4 * 60 + new Date().getTimezoneOffset()) * 60000); return d; };
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function status() {
    const d = dubai(), day = d.getDay(), h = d.getHours() + d.getMinutes() / 60;
    const open = day !== 0 && h >= 9 && h < 19;
    let short, long;
    if (open) { short = 'Open now, until 7 PM'; long = 'Open now, closes at 7 PM'; }
    else {
      const next = (day === 6 && h >= 19) || day === 0 ? 'Monday' : (h < 9 ? 'today' : (day === 6 ? 'Monday' : 'tomorrow'));
      short = `Closed, opens 9 AM ${next === 'today' ? '' : next}`.trim();
      long = `Closed now, opens at 9 AM ${next === 'today' ? 'today' : (next === 'tomorrow' ? 'tomorrow' : 'on ' + next)}`;
    }
    const el = $('[data-status]');
    if (el) { el.classList.toggle('is-open', open); $('[data-status-text]').textContent = short; }
    const l = $('[data-status-long]'); if (l) l.textContent = long;
    const c = $('[data-clock]');
    if (c) c.textContent = `Dubai ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}, ${days[day]}`;
  }
  status(); setInterval(status, 30000);

  /* ---------- the rendered paint ---------- */
  let hero = null, layers = null;
  const heroCanvas = $('[data-paint]'), layersCanvas = $('[data-layers-gl]');
  const gl2 = 'WebGL2RenderingContext' in window;   // mount() returns null when a context cannot be had
  const small = matchMedia('(max-width: 860px)').matches;
  if (!reduce && gl2 && window.PaintPanel) {
    hero = PaintPanel.mount(heroCanvas, { scale: small ? 0.8 : 1 });
    if (hero) requestAnimationFrame(() => setTimeout(() => heroCanvas.classList.add('is-live'), 120));
    // the labels sit either side of the tape, wherever the tape crosses their height
    const placeTags = () => {
      if (!hero) return;
      const tags = $('.hero-tags'), r = heroCanvas.getBoundingClientRect(), t = tags.getBoundingClientRect();
      const v = 1 - (t.top - r.top) / r.height;
      tags.style.setProperty('--tape-x', (hero.tapeX(v) * 100).toFixed(2) + '%');
    };
    placeTags(); addEventListener('resize', placeTags);
    if (layersCanvas) {
      layers = PaintPanel.mount(layersCanvas, { layers: 1, stage: 3.4, tape: false, tapeX: 99, demo: false, torch: 0, gap: 0, key: '#ffffff', paint: '#b0101a', flake: 0,
        scale: small ? 0.75 : 0.9, frame: (a) => (a < 1 ? [0.36, -0.30, 0.95] : [0.16, -0.06, 0.92]) });
      if (layers) setTimeout(() => layersCanvas.classList.add('is-live'), 200);
      const media = $('.layers-media');
      media.addEventListener('pointerenter', () => layers && layers.set('torch', 1));
      media.addEventListener('pointerleave', () => layers && layers.set('torch', 0));
    }
  }
  if (!layers) $('[data-layers]')?.classList.add('no-gl');
  // swatches: one tab stop, arrow keys move and choose (radiogroup pattern)
  const sws = $$('[data-swatches] button');
  const syncTab = () => sws.forEach((x) => (x.tabIndex = x.getAttribute('aria-checked') === 'true' ? 0 : -1));
  syncTab();
  sws.forEach((b, i) => b.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
    e.preventDefault(); const n = sws[(i + d + sws.length) % sws.length]; n.click(); n.focus();
  }));
  // swatches: re-spray the panel
  $$('[data-swatches] button').forEach((b) => b.addEventListener('click', () => {
    $$('[data-swatches] button').forEach((x) => x.setAttribute('aria-checked', String(x === b))); syncTab();
    if (!layers) return;
    layers.set('paint', b.dataset.paint); layers.set('flake', +b.dataset.flake);
    // re-spray: the base coat front crosses again, then the clear
    if (window.gsap) { const o = { s: 1.7 }; gsap.to(o, { s: 3.4, duration: 1.8, ease: 'power2.inOut', onUpdate: () => layers.set('stage', o.s) }); }
  }));

  if (reduce) return;
  root.classList.add('m');

  /* ---------- helpers ---------- */
  const split = (el, cls = 'w', chars = false) => {
    const out = [];
    const walk = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 1) { walk(n); continue; }
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        const frag = document.createDocumentFragment();
        for (const part of n.textContent.split(chars ? /()/ : /(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.append(part); continue; }
          const s = document.createElement('span'); s.className = cls; s.textContent = part; out.push(s); frag.append(s);
        }
        n.replaceWith(frag);
      }
    };
    walk(el);
    return out;
  };
  // lines: wrap words, then group them by their rendered top into masked lines
  const lines = (el) => {
    const words = split(el, 'lw');
    const groups = []; let top = null;
    for (const w of words) { const t = Math.round(w.getBoundingClientRect().top); if (top === null || Math.abs(t - top) > 4) { groups.push([]); top = t; } groups[groups.length - 1].push(w); }
    const html = groups.map((g) => `<span class="line"><span>${g.map((w) => w.parentElement.tagName === 'EM' ? `<em>${w.textContent}</em>` : w.textContent).join(' ')}</span></span>`).join('');
    el.innerHTML = html;
    return $$('.line > span', el);
  };

  /* ---------- no loader: the studio lights coming up in the hero are the entrance ---------- */
  const ready = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);

  /* ---------- libraries ---------- */
  const load = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.append(s); });
  const libs = Promise.all([
    load('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js').then(() => load('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js')),
    load('https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js'),
  ]);
  Promise.race([libs, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 3000))])
    .then(() => (window.gsap && window.ScrollTrigger && window.Lenis ? full() : cssOnly()))
    .catch(cssOnly);

  /* ---------- pointer: cursor label, magnetic buttons, service photo ---------- */
  function pointer(gsap) {
    if (!fine) return;
    const cur = $('[data-cursor-el]'), label = $('[data-cursor-label]');
    const qx = gsap ? gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' }) : (v) => (cur.style.left = v + 'px');
    const qy = gsap ? gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' }) : (v) => (cur.style.top = v + 'px');
    addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); }, { passive: true });
    $$('[data-cursor]').forEach((el) => {
      const mode = el.hasAttribute('data-cursor-ring') ? 'is-ring' : 'is-label';
      el.addEventListener('pointerenter', () => { label.textContent = el.dataset.cursor; cur.classList.add(mode); });
      el.addEventListener('pointerleave', () => cur.classList.remove(mode));
    });
    $$('a, button, input, summary').forEach((el) => {
      if (el.closest('[data-cursor]')) return;
      el.addEventListener('pointerenter', () => cur.classList.add('is-hidden'));
      el.addEventListener('pointerleave', () => cur.classList.remove('is-hidden'));
    });
    if (gsap) $$('[data-magnet]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, .45)' }), my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, .45)' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.22); my((e.clientY - r.top - r.height / 2) * 0.3); });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
    // service rows: the job's photo opens under the pointer
    const fl = $('[data-menu-float]'), flImg = fl && $('img', fl);
    if (fl) {
      const fx = gsap ? gsap.quickTo(fl, 'x', { duration: 0.7, ease: 'power3' }) : (v) => (fl.style.left = v + 'px');
      const fy = gsap ? gsap.quickTo(fl, 'y', { duration: 0.7, ease: 'power3' }) : (v) => (fl.style.top = v + 'px');
      $$('[data-menu] li').forEach((li) => {
        li.addEventListener('pointerenter', () => { flImg.src = li.dataset.img; fl.classList.add('is-on'); });
        li.addEventListener('pointerleave', () => fl.classList.remove('is-on'));
        li.addEventListener('pointermove', (e) => { fx(e.clientX + 30); fy(e.clientY - 120); });
      });
    }
  }

  /* ---------- CSS-only fallback ---------- */
  function cssOnly() {
    root.classList.add('m-css');
    root.classList.remove('intro');
    pointer(null);
    $$('[data-count]').forEach((el) => (el.textContent = el.dataset.fmt === 'comma' ? (+el.dataset.count).toLocaleString('en-US') : el.dataset.count));
    const words = $('[data-words]') ? split($('[data-words]')) : [];
    words.forEach((w) => w.classList.add('is-on'));
  }

  /* ---------- full motion ---------- */
  function full() {
    const { gsap, ScrollTrigger, Lenis } = window;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.2 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('pre, .preview, .faq-list, .job-list').forEach((el) => el.setAttribute('data-lenis-prevent', ''));
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || a.classList.contains('skip')) return;
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = $(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: id === '#top' ? 0 : -70, duration: 1.4 });
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
      try { history.pushState(null, '', id); } catch (err) { /* sandboxed frames */ }
    });
    const EXPO = 'expo.out';
    pointer(gsap);

    // header: hides going down, returns going up; solid once past the hero
    const hdr = $('[data-hdr]'); let lastY = 0;
    lenis.on('scroll', ({ scroll }) => { hdr.classList.toggle('is-up', scroll > 300 && scroll > lastY); lastY = scroll; });
    gsap.to('[data-progress]', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

    // hero intro after the loader: lines rise, the kicker and foot follow
    const heroLines = $$('.hero h1 .ln > *').flatMap((l) => split(l, 'hw'));
    gsap.set(heroLines, { yPercent: 110 });
    root.classList.remove('intro');
    gsap.set(['[data-hero-foot] > *', '[data-hero-tag]'], { opacity: 0, y: 18 });
    // the lede's words settle in turn (no filter here: a filtered layer over the WebGL canvas leaves a stale patch in Chrome)
    const ledeWords = split($('.hero-lede'), 'lw3');
    gsap.set(ledeWords, { opacity: 0, y: 10 });
    const intro = () => {
      const tl = gsap.timeline({ defaults: { ease: EXPO } });
      tl.to(heroLines, { yPercent: 0, duration: 1.5, stagger: 0.06 }, 0.1)
        .to('[data-hero-foot] > *', { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.75)
        .to(ledeWords, { opacity: 1, y: 0, duration: 0.9, stagger: 0.012 }, 0.8)
        .to('[data-hero-tag]', { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 1.6);
    };
    ready.then(intro);

    // hero on scroll: the lights travel over the panel, the copy lifts away
    ScrollTrigger.create({ trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: (s) => { if (hero) hero.scroll(s.progress); } });
    gsap.to('.hero-copy, .hero-foot', { yPercent: -18, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'center center', end: 'bottom top', scrub: true } });
    gsap.to('.hero-media', { scale: 1.06, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } });

    // counters
    $$('[data-count]').forEach((el) => {
      const to = +el.dataset.count, from = +(el.dataset.from || 0), dec = +(el.dataset.dec || 0), o = { v: from };
      const fmt = (x) => (el.dataset.fmt === 'comma' ? Math.round(x).toLocaleString('en-US') : x.toFixed(dec));
      el.textContent = fmt(from);
      gsap.to(o, { v: to, duration: 2.2, ease: 'expo.out', onUpdate: () => (el.textContent = fmt(o.v)),
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    gsap.from('.fact', { y: 40, opacity: 0, filter: 'blur(8px)', duration: 1.2, ease: EXPO, stagger: 0.08, clearProps: 'filter', scrollTrigger: { trigger: '.facts', start: 'top 85%', once: true } });

    // the marquee follows the scroll direction
    const mq = $('[data-marquee]');
    if (mq) { let dir = 1; lenis.on('scroll', ({ direction }) => { if (direction && direction !== dir) { dir = direction; mq.style.animationDirection = dir > 0 ? 'normal' : 'reverse'; } }); }

    // statement: words light up as it scrolls
    const words = split($('[data-words]'));
    ScrollTrigger.create({ trigger: '.chapter-copy', start: 'top 85%', end: 'bottom 70%', scrub: true,
      onUpdate: (s) => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('is-on', i < n)); } });

    // section headings rise line by line behind a mask
    document.fonts.ready.then(() => {
      $$('[data-lines]').forEach((h) => {
        const ls = lines(h);
        const ws = ls.map((l) => split(l, 'lw2'));
        gsap.from(ws.flat(), { yPercent: 115, duration: 1.3, ease: EXPO, stagger: (i) => 0.035 * i, scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
      });
      ScrollTrigger.refresh();
    });
    $$('.idx').forEach((el) => gsap.from(el, { x: -24, opacity: 0, duration: 1.1, ease: EXPO, scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    // section ledes come in word by word, softly out of focus (none of them sits over a canvas)
    $$('.sec-lede').forEach((el) => { const ws = split(el, 'lw3'); gsap.from(ws, { y: 12, opacity: 0, filter: 'blur(6px)', duration: 1, ease: EXPO, stagger: 0.012, clearProps: 'filter', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }); });

    // claims: on wide screens the steps travel sideways while the section holds
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const track = $('[data-claims-track]');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tl = gsap.timeline({ scrollTrigger: { trigger: '[data-claims-pin]', start: 'top top', end: () => '+=' + (dist() + innerHeight * 0.4), pin: true, scrub: 1, invalidateOnRefresh: true } });
      tl.to(track, { x: () => -dist(), ease: 'none' }, 0).to('[data-claims-line]', { scaleX: 1, ease: 'none' }, 0);
      return () => tl.kill();
    });
    mm.add('(max-width: 860px)', () => {
      $$('.step').forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: EXPO, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
    });
    $$('.step-n').forEach((el) => gsap.from(el, { yPercent: 40, opacity: 0, duration: 1.3, ease: EXPO, scrollTrigger: { trigger: el, start: 'left 95%', containerAnimation: undefined, once: true } }));

    // job file, panels, rows
    // the job file and the plan drawing slide out of a slot as they scroll in (scrubbed clip-path)
    ['.file', '.car-stage'].forEach((sel) => gsap.fromTo(sel, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: sel, start: 'top 92%', end: 'top 40%', scrub: true } }));
    gsap.from('.cases button', { y: 30, opacity: 0, duration: 1.1, ease: EXPO, stagger: 0.08, scrollTrigger: { trigger: '.cases', start: 'top 85%', once: true } });
    gsap.from('.jobcard', { y: 50, opacity: 0, duration: 1.3, ease: EXPO, stagger: 0.12, scrollTrigger: { trigger: '.damage-grid', start: 'top 85%', once: true } });
    gsap.from('.menu li', { y: 30, opacity: 0, duration: 1, ease: EXPO, stagger: 0.06, scrollTrigger: { trigger: '.menu', start: 'top 85%', once: true } });
    gsap.from('.swatches button', { x: -24, opacity: 0, duration: 1, ease: EXPO, stagger: 0.06, scrollTrigger: { trigger: '.swatches', start: 'top 90%', once: true } });
    gsap.from('.faq-list details', { y: 24, opacity: 0, duration: 1, ease: EXPO, stagger: 0.06, scrollTrigger: { trigger: '.faq-list', start: 'top 88%', once: true } });

    // the paint: pinned; scrolling drives the spray front through the four layers, then the colours open
    const steps = $$('[data-layers-steps] li'), ticks = $$('.layers-rail i'), pick = $('.layers-pick'), rail = $('.layers-rail');
    if (layers) layers.set('stage', -0.4);
    if (rail) rail.style.setProperty('--p', 0);
    ScrollTrigger.create({ trigger: '[data-layers-pin]', start: 'top top', end: () => '+=' + Math.round(innerHeight * (small ? 2.2 : 3)), pin: true, scrub: true,
      onUpdate: (s) => {
        const p = s.progress, stage = -0.4 + Math.min(1, p / 0.82) * 3.8;
        if (layers) { layers.set('stage', stage); layers.scroll(p * 0.6 - 0.1); }
        const i = Math.max(0, Math.min(3, Math.floor(stage + 0.3)));
        steps.forEach((li, k) => li.classList.toggle('is-on', k === i));
        ticks.forEach((t, k) => t.classList.toggle('is-on', k <= i));
        if (rail) rail.style.setProperty('--p', Math.min(1, p / 0.82).toFixed(3));
        if (pick) { pick.classList.toggle('is-on', p > 0.8); pick.inert = p <= 0.8; }
      } });

    gsap.fromTo('.chapter-media img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.chapter', start: 'top bottom', end: 'bottom top', scrub: true } });

    // visit photo opens from a slot and drifts
    const vi = $('.visit-img');
    if (vi) {
      gsap.fromTo(vi, { clipPath: 'inset(18% 12% 18% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: vi, start: 'top 90%', end: 'top 25%', scrub: true } });
      gsap.fromTo('.visit-img [data-parallax]', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: vi, start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    // footer wordmark: letters rise in turn
    const wm = $('[data-wordmark]');
    if (wm) { const ch = split(wm, 'ch', true); gsap.from(ch, { yPercent: 100, opacity: 0, duration: 1.4, ease: EXPO, stagger: 0.04, scrollTrigger: { trigger: wm, start: 'top 95%', once: true } }); }
    ['.foot-call', '.book-head h3'].forEach((sel) => { const el = $(sel); if (!el) return; const ws = split(el, 'lw2'); el.style.overflow = 'hidden';
      gsap.from(ws, { yPercent: 110, duration: 1.3, ease: EXPO, stagger: 0.04, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }); });
    gsap.from('.foot-top .btn', { y: 30, opacity: 0, duration: 1.2, ease: EXPO, scrollTrigger: { trigger: '.foot', start: 'top 85%', once: true } });

    addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
