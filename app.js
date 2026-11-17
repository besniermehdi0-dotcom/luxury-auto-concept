/* Luxury Auto Service Centre, website concept. Behaviour layer.
   Works without GSAP/Lenis: they are fetched after first paint and only add
   parallax and smooth scrolling. */
(() => {
  'use strict';
  window.__app = true;
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '971501840030';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  const onceVisible = (el, fn, threshold = 0.3) => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { threshold });
    io.observe(el);
  };
  const waLink = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  const setSend = (a, msg, fallback) => {
    if (msg) {
      a.href = waLink(msg);
      a.target = '_blank';
      a.rel = 'noopener';
      a.classList.remove('is-disabled');
      a.removeAttribute('aria-disabled');
    } else {
      a.href = fallback;
      a.removeAttribute('target');
      a.classList.add('is-disabled');
      a.setAttribute('aria-disabled', 'true');
    }
  };
  /* Single-choice button groups (aria-pressed). Clicking the chosen one again clears it. */
  const single = (group, onChange) => {
    const bs = $$('button', group);
    bs.forEach((b) => b.addEventListener('click', () => {
      const was = b.getAttribute('aria-pressed') === 'true';
      bs.forEach((x) => x.setAttribute('aria-pressed', String(!was && x === b)));
      onChange(was ? null : b.dataset.v);
    }));
  };

  let lenisRef = null; // set once the motion layer loads; native scrolling until then
  const scrollToEl = (el, block = 'start') => {
    if (!el) return;
    if (lenisRef) {
      const h = el.getBoundingClientRect().height;
      const offset = block === 'center' ? -Math.max(72, (innerHeight - h) / 2) : -72;
      lenisRef.scrollTo(el, { offset, duration: 1 });
    } else {
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block });
    }
  };

  /* ---------- Reveal + counter ---------- */
  const revealIO = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }) : null;
  $$('[data-reveal]').forEach((el) => (revealIO ? revealIO.observe(el) : el.classList.add('in')));

  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    if (reduce) return;
    el.textContent = '0';
    onceVisible(el, () => {
      const t0 = performance.now();
      const dur = 1400;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 0.6);
  });

  /* ---------- Nav + dock ---------- */
  const nav = $('[data-nav]');
  const dock = $('[data-dock]');
  const hero = $('.hero');
  const vis = { hero: true, damage: false, service: false, foot: false };
  const syncDock = () => {
    const on = !vis.hero && !vis.damage && !vis.service && !vis.foot;
    dock.classList.toggle('is-on', on);
    dock.inert = !on; // hidden off-screen, so it must not take keyboard focus
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      nav.classList.toggle('is-solid', e.intersectionRatio < 0.88);
      vis.hero = e.intersectionRatio > 0.25;
      syncDock();
    }, { threshold: [0, 0.25, 0.88, 1] }).observe(hero);
    const mid = { threshold: 0, rootMargin: '-35% 0px -35% 0px' };
    new IntersectionObserver(([e]) => { vis.damage = e.isIntersecting; syncDock(); }, mid).observe($('#damage'));
    new IntersectionObserver(([e]) => { vis.service = e.isIntersecting; syncDock(); }, mid).observe($('#service'));
    new IntersectionObserver(([e]) => { vis.foot = e.isIntersecting; syncDock(); }, { threshold: 0 }).observe($('[data-foot]'));
  } else {
    dock.inert = false;
    dock.classList.add('is-on');
  }

  /* ---------- Damage map ---------- */
  /* Top view, front up. Left/right are the driver's (left-hand drive). Panels are
     oversized shapes clipped by the body outline, so the clip draws the curves. */
  const BODY = 'M210 34 C282 34 330 42 346 62 C360 80 364 104 364 128 C370 150 372 200 370 250 C368 290 362 320 362 360 L362 560 C362 600 368 630 370 670 C372 720 370 770 364 800 C358 832 340 854 312 862 C282 870 246 872 210 872 C174 872 138 870 108 862 C80 854 62 832 56 800 C50 770 48 720 50 670 C52 630 58 600 58 560 L58 360 C58 320 52 290 50 250 C48 200 50 150 56 128 C56 104 60 80 74 62 C90 42 138 34 210 34 Z';
  const mirrorX = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => `${420 - +x} ${y}`);
  const BODY_OPTS = ['Dent', 'Scratch', 'Repaint'];
  const L = {
    wing: 'M0 108 C60 90 90 84 118 82 C108 160 102 230 100 296 L0 296 Z',
    dfront: 'M0 296 L100 296 L97 388 L97 470 L0 470 Z',
    drear: 'M0 470 L97 470 L97 588 L101 620 L0 620 Z',
    quarter: 'M0 620 L101 620 L104 666 C106 720 108 770 114 806 C90 808 60 806 0 800 Z',
    sideglass: 'M100 296 L130 388 C134 460 134 520 130 588 L104 666 L101 620 L97 588 L97 388 Z',
    mirror: 'M60 312 L30 304 C24 303 21 307 22 312 L25 324 C26 329 31 331 36 330 L61 326 Z',
    head: 'M74 76 C92 58 120 46 154 42 L158 60 C130 64 106 74 90 92 Z',
    tail: 'M60 822 C78 846 110 860 148 864 L148 846 C118 842 92 832 74 812 Z',
  };
  const PANELS = [
    { id: 'fb', name: 'Front bumper', d: 'M0 0 H420 V108 C360 90 290 74 210 72 C130 74 60 90 0 108 Z' },
    { id: 'wfl', name: 'Front left fender', d: L.wing },
    { id: 'bon', name: 'Bonnet', d: 'M118 82 C150 74 180 72 210 72 C240 72 270 74 302 82 C312 160 318 230 320 296 L100 296 C102 230 108 160 118 82 Z' },
    { id: 'wfr', name: 'Front right fender', d: mirrorX(L.wing) },
    { id: 'dfl', name: 'Front left door', d: L.dfront },
    { id: 'dfr', name: 'Front right door', d: mirrorX(L.dfront) },
    { id: 'roof', name: 'Roof', d: 'M130 388 C134 460 134 520 130 588 L290 588 C286 520 286 460 290 388 Z' },
    { id: 'drl', name: 'Rear left door', d: L.drear },
    { id: 'drr', name: 'Rear right door', d: mirrorX(L.drear) },
    { id: 'qrl', name: 'Rear left quarter', d: L.quarter },
    { id: 'boot', name: 'Boot lid', d: 'M104 666 L316 666 C314 720 312 770 306 806 C280 814 240 818 210 818 C180 818 140 814 114 806 C108 770 106 720 104 666 Z' },
    { id: 'qrr', name: 'Rear right quarter', d: mirrorX(L.quarter) },
    { id: 'rb', name: 'Rear bumper', d: 'M0 900 H420 V800 C360 806 330 808 306 806 C280 814 240 818 210 818 C180 818 140 814 114 806 C90 808 60 806 0 800 Z' },
  ].map((p) => ({ ...p, opts: BODY_OPTS }));
  /* Windscreen and rear window are buttons; the side glass is drawing only. */
  const GLASS = [
    { id: 'ws', name: 'Windscreen', d: 'M100 296 L320 296 L290 388 L130 388 Z', opts: ['Chip', 'Crack', 'Scratches'] },
    { id: 'rw', name: 'Rear window', d: 'M130 588 L290 588 L316 666 L104 666 Z', opts: ['Chip', 'Crack'] },
  ];
  const SIDE_GLASS = [L.sideglass, mirrorX(L.sideglass)];
  /* Lights and grille: drawn shapes with a wider invisible hit area on top, so they can be tapped. */
  const PARTS = [
    { id: 'gr', name: 'Grille', d: 'M168 40 C192 38 228 38 252 40 L250 54 C228 52 192 52 170 54 Z', hit: { rect: [162, 31, 96, 30] }, opts: ['Broken', 'Scratch'] },
    { id: 'hlf', name: 'Front left headlight', d: L.head, opts: ['Broken', 'Cracked', 'Faded'] },
    { id: 'hrf', name: 'Front right headlight', d: mirrorX(L.head), opts: ['Broken', 'Cracked', 'Faded'] },
    { id: 'tll', name: 'Rear left tail light', d: L.tail, opts: ['Broken', 'Cracked'] },
    { id: 'tlr', name: 'Rear right tail light', d: mirrorX(L.tail), opts: ['Broken', 'Cracked'] },
  ];
  const MIRRORS = [
    { id: 'mrl', name: 'Left mirror', d: L.mirror, hx: 8, opts: ['Broken', 'Scratch'] },
    { id: 'mrr', name: 'Right mirror', d: mirrorX(L.mirror), hx: 360, opts: ['Broken', 'Scratch'] },
  ];
  const WHEELS = [
    { id: 'whfl', name: 'Front left wheel', x: 36, y: 140, hx: 4 },
    { id: 'whfr', name: 'Front right wheel', x: 358, y: 140, hx: 364 },
    { id: 'whrl', name: 'Rear left wheel', x: 36, y: 662, hx: 4 },
    { id: 'whrr', name: 'Rear right wheel', x: 358, y: 662, hx: 364 },
  ].map((w) => ({ ...w, opts: ['Kerb damage', 'Repaint'] }));
  const CHIPS = ['Service due', 'Warning light on', 'A/C not cooling', 'Brakes', 'Noise or vibration', 'Gearbox'];

  const car = $('[data-car]');
  const readout = $('[data-readout]');
  const byId = new Map(); // id -> item
  const byName = new Map(); // name -> id
  const picked = new Map(); // id -> { name, opts, choice }
  const chipsOn = new Set();
  const nodes = new Map(); // id -> elements that show the selected state

  /* el takes the clicks and focus; visuals show hover, keyboard focus and selection. */
  const makeButton = (el, item, visuals = [el]) => {
    byId.set(item.id, item);
    byName.set(item.name, item.id);
    nodes.set(item.id, [...new Set([el, ...visuals])]);
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-pressed', 'false');
    el.setAttribute('aria-label', item.name);
    el.addEventListener('click', () => toggle(item));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(item); }
    });
    el.addEventListener('pointerenter', () => { visuals.forEach((v) => v.classList.add('hl')); setReadout(item.name); });
    el.addEventListener('pointerleave', () => { visuals.forEach((v) => v.classList.remove('hl')); setReadout(); });
    el.addEventListener('focus', () => {
      if (el.matches(':focus-visible')) visuals.forEach((v) => v.classList.add('kf'));
      setReadout(item.name);
    });
    el.addEventListener('blur', () => { visuals.forEach((v) => v.classList.remove('kf')); setReadout(); });
  };

  if (car) {
    $('[data-body-path]', car).setAttribute('d', BODY);
    $('[data-outline]', car).setAttribute('d', BODY);
    const gPanels = $('[data-panels]', car);
    const gGlass = $('[data-glass]', car);
    const gWheels = $('[data-wheels]', car);
    const gTrim = $('[data-trim]', car);
    const gMirrors = $('[data-mirrors]', car);
    const gParts = $('[data-parts]', car);
    const gHits = $('[data-hits]', car);
    gParts.setAttribute('clip-path', 'url(#bodyClip)');

    // DOM order is the tab order: panels, glass, grille and lights, mirrors, wheels.
    PANELS.forEach((p, i) => {
      const el = svgEl('path', { d: p.d, class: 'panel' });
      el.style.setProperty('--d', `${0.45 + i * 0.06}s`);
      makeButton(el, p);
      gPanels.appendChild(el);
    });
    SIDE_GLASS.forEach((d) => {
      const el = svgEl('path', { d, class: 'glass' });
      el.style.setProperty('--d', '1.1s');
      gGlass.appendChild(el);
    });
    GLASS.forEach((g) => {
      const el = svgEl('path', { d: g.d, class: 'glass part' });
      el.style.setProperty('--d', '1.1s');
      makeButton(el, g);
      gGlass.appendChild(el);
    });
    PARTS.forEach((p) => {
      const el = svgEl('path', { d: p.d, class: p.id === 'gr' ? 'part grille' : p.id.startsWith('t') ? 'part tail' : 'part lamp' });
      gParts.appendChild(el);
      const hit = p.hit
        ? svgEl('rect', { x: p.hit.rect[0], y: p.hit.rect[1], width: p.hit.rect[2], height: p.hit.rect[3], class: 'hit' })
        : svgEl('path', { d: p.d, class: 'hit hit-wide' });
      makeButton(hit, p, [el]);
      gHits.appendChild(hit);
    });
    MIRRORS.forEach((m) => {
      const el = svgEl('path', { d: m.d, class: 'mirror' });
      el.style.setProperty('--d', '1.2s');
      gMirrors.appendChild(el);
      const hit = svgEl('rect', { x: m.hx, y: 292, width: 52, height: 50, class: 'hit' });
      makeButton(hit, m, [el]);
      gHits.appendChild(hit);
    });
    WHEELS.forEach((w) => {
      const el = svgEl('rect', { x: w.x, y: w.y, width: 26, height: 110, rx: 9, class: 'wheel' });
      el.style.setProperty('--d', '1.2s');
      gWheels.appendChild(el);
      const hit = svgEl('rect', { x: w.hx, y: w.y - 10, width: 52, height: 130, class: 'hit' });
      makeButton(hit, w, [el]);
      gHits.appendChild(hit);
    });
    [
      ['path', { d: 'M158 84 C154 170 152 240 156 292', class: 'crease' }],
      ['path', { d: 'M262 84 C266 170 268 240 264 292', class: 'crease' }],
    ].forEach(([t, a]) => gTrim.appendChild(svgEl(t, a)));
    gTrim.classList.add('trim');
    gTrim.style.setProperty('--d', '1.3s');
    gParts.classList.add('trim');
    gParts.style.setProperty('--d', '1.25s');

    if (reduce) car.classList.add('is-drawn');
    else onceVisible(car, () => car.classList.add('is-drawn'), 0.25);
  }

  function setReadout(name) {
    if (!readout) return;
    if (name) readout.innerHTML = `<b>${name}</b>${picked.has(byName.get(name)) ? ' selected' : ''}`;
    else readout.textContent = picked.size ? `${picked.size} marked. Tap again to remove.` : 'Tap any panel';
  }

  const list = $('[data-job-list]');
  const empty = $('[data-empty]');
  const badge = $('[data-count-badge]');
  const preview = $('[data-preview]');
  const send = $('[data-send]');
  const model = $('[data-car-model]');
  const year = $('[data-car-year]');
  const chipRow = $('[data-chips]');
  const claim = $('[data-claim]');
  const insurerWrap = $('[data-insurer-wrap]');
  const insurer = $('[data-insurer]');
  const rows = new Map(); // id -> li, so a tap adds or removes one row instead of rebuilding the list
  let pay = 'myself';
  let police = null;

  function toggle(item) {
    const on = !picked.has(item.id);
    if (on) {
      picked.set(item.id, { name: item.name, opts: item.opts, choice: item.opts[0] });
      addRow(item.id);
    } else {
      picked.delete(item.id);
      rows.get(item.id)?.remove();
      rows.delete(item.id);
    }
    (nodes.get(item.id) || []).forEach((n) => {
      n.classList.toggle('is-on', on);
      if (n.hasAttribute('aria-pressed')) n.setAttribute('aria-pressed', String(on));
    });
    setReadout(item.name);
    refreshCard();
  }

  function addRow(id) {
    const v = picked.get(id);
    const li = document.createElement('li');
    li.className = 'job-item';
    li.innerHTML = `<span class="name">${v.name}</span>
      <button type="button" class="remove" aria-label="Remove ${v.name}"><i class="ph ph-x" aria-hidden="true"></i></button>
      <div class="seg" role="group" aria-label="What happened to the ${v.name.toLowerCase()}"></div>`;
    const seg = $('.seg', li);
    v.opts.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o;
      b.setAttribute('aria-pressed', String(v.choice === o));
      b.addEventListener('click', () => {
        v.choice = o;
        $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        renderMessage();
      });
      seg.appendChild(b);
    });
    $('.remove', li).addEventListener('click', () => {
      // Keep keyboard focus in the card: move it to the neighbouring row, or back to the part on the car.
      const next = li.nextElementSibling || li.previousElementSibling;
      toggle(byId.get(id));
      const target = next ? $('.remove', next) : (nodes.get(id) || [])[0];
      if (target) target.focus({ preventScroll: true });
    });
    list.appendChild(li);
    rows.set(id, li);
  }

  CHIPS.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = c;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      chipsOn.has(c) ? chipsOn.delete(c) : chipsOn.add(c);
      b.setAttribute('aria-pressed', String(chipsOn.has(c)));
      refreshCard();
    });
    chipRow.appendChild(b);
  });
  // The digit filter must run before the message is rebuilt, or the message keeps the stray characters.
  year.addEventListener('input', () => { year.value = year.value.replace(/\D/g, '').slice(0, 4); });
  [model, year, insurer].forEach((i) => i.addEventListener('input', renderMessage));
  // "Paying by" always has an answer, so clicking the chosen option keeps it chosen.
  $$('[data-pay] button').forEach((b) => b.addEventListener('click', () => {
    pay = b.dataset.v;
    $$('[data-pay] button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    insurerWrap.hidden = pay !== 'insurance';
    renderMessage();
  }));
  single($('[data-police]'), (v) => { police = v; renderMessage(); });

  function refreshCard() {
    const n = picked.size + chipsOn.size;
    empty.hidden = picked.size > 0;
    claim.hidden = picked.size === 0;
    badge.textContent = `${n} ${n === 1 ? 'item' : 'items'}`;
    renderMessage();
  }

  function renderMessage() {
    const n = picked.size + chipsOn.size;
    const carLine = [model.value.trim(), year.value.trim()].filter(Boolean).join(', ');
    const lines = ['Hello Luxury Auto, I would like a price for my car.'];
    lines.push(`Car: ${carLine || 'to be added'}`);
    picked.forEach((v) => lines.push(`- ${v.name}: ${v.choice.toLowerCase()}`));
    chipsOn.forEach((c) => lines.push(`- ${c}`));
    if (picked.size) {
      const ins = insurer.value.trim();
      lines.push(`Paying: ${pay === 'insurance' ? `insurance claim${ins ? `, ${ins}` : ''}` : 'myself'}`);
      if (police) lines.push(`Police report: ${police === 'have' ? 'I have it' : 'not yet'}`);
    }
    lines.push('I can send photos here.');
    const msg = lines.join('\n');
    preview.textContent = n ? msg : 'Your message appears here once you mark something.';
    setSend(send, n ? msg : '', '#damage');
  }
  send.addEventListener('click', (e) => {
    if (send.getAttribute('aria-disabled') !== 'true') return;
    e.preventDefault();
    // Focus first (its handler writes the panel name), then the hint, then bring the car into view.
    const first = $('.panel', car);
    if (first) first.focus({ preventScroll: true });
    readout.innerHTML = '<b>Mark a panel on the car first</b>';
    scrollToEl($('[data-car-stage]'), 'center');
  });
  refreshCard();

  /* ---------- Service booking ---------- */
  const WORK = ['Scheduled service', 'Oil and filters', 'Brakes', 'A/C service', 'Warning light', 'Forty-point check-up'];
  const workOn = new Set();
  const workRow = $('[data-work]');
  const workBtns = new Map();
  const svcModel = $('[data-svc-model]');
  const svcKm = $('[data-svc-km]');
  const dayRow = $('[data-days]');
  const svcPreview = $('[data-svc-preview]');
  const svcSend = $('[data-svc-send]');
  const svcSummary = $('[data-svc-summary]');
  const svcHint = $('[data-svc-hint]');
  let day = null;
  let time = null;
  const fmtDay = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');

  const toggleWork = (w) => {
    workOn.has(w) ? workOn.delete(w) : workOn.add(w);
    workBtns.get(w).setAttribute('aria-pressed', String(workOn.has(w)));
    renderSvc();
  };
  WORK.forEach((w) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = w;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => toggleWork(w));
    workRow.appendChild(b);
    workBtns.set(w, b);
  });

  // The next six open days, starting tomorrow. Google lists the workshop as closed on Sunday.
  const days = [];
  for (let d = new Date(), i = 0; days.length < 6 && i < 14; i++) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    if (d.getDay() !== 0) days.push(d);
  }
  days.forEach((d, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'day';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }));
    b.dataset.v = String(i);
    b.innerHTML = `<span>${d.toLocaleDateString('en-GB', { weekday: 'short' })}</span><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-GB', { month: 'short' })}</span>`;
    dayRow.appendChild(b);
  });
  single(dayRow, (v) => { day = v === null ? null : days[+v]; renderSvc(); });
  single($('[data-time]'), (v) => { time = v; renderSvc(); });
  svcKm.addEventListener('input', () => { svcKm.value = svcKm.value.replace(/\D/g, '').slice(0, 7); });
  [svcModel, svcKm].forEach((i) => i.addEventListener('input', renderSvc));

  function renderSvc() {
    const when = day ? `${fmtDay(day)}${time ? `, ${time}` : ''}` : '';
    svcSummary.textContent = when || 'No day yet';
    const km = svcKm.value ? `${(+svcKm.value).toLocaleString('en-US')} km` : '';
    const carLine = [svcModel.value.trim(), km].filter(Boolean).join(', ');
    const lines = [
      'Hello Luxury Auto, I would like to book a service.',
      `Car: ${carLine || 'to be added'}`,
      `Work: ${workOn.size ? [...workOn].map((w, i) => (i ? w.toLowerCase() : w)).join(', ') : 'to be added'}`,
      `Preferred day: ${when || 'to be agreed'}`,
      'Please confirm a slot.',
    ];
    const ready = workOn.size > 0 && day;
    svcPreview.textContent = lines.join('\n');
    setSend(svcSend, ready ? lines.join('\n') : '', '#service');
    svcHint.textContent = ready ? 'Sends to +971 50 184 0030 on WhatsApp.' : 'Choose the work and a day to send the request.';
  }
  svcSend.addEventListener('click', (e) => {
    if (svcSend.getAttribute('aria-disabled') !== 'true') return;
    e.preventDefault();
    svcHint.textContent = workOn.size ? 'Pick a day first.' : 'Choose the work first.';
    const target = workOn.size ? $('button', dayRow) : $('button', workRow);
    if (target) target.focus({ preventScroll: true });
  });
  // Lines in the services menu arrive with their work already chosen.
  $$('[data-preset]').forEach((a) => a.addEventListener('click', () => {
    if (!workOn.has(a.dataset.preset)) toggleWork(a.dataset.preset);
  }));
  renderSvc();

  /* ---------- Repair tracker ---------- */
  /* The estimate card is always in the layout and only changes state, so nothing below it
     moves when the demo reaches the approval step. Days run Monday to Thursday, 9 AM to 6 PM:
     open hours on both his own site (Sat to Thu, 8 to 6) and Google (Mon to Sat, 9 to 7). */
  const STAGES = [
    { label: 'Checked in', time: 'Mon 09:10', msg: '<b>Checked in at Bay 4.</b> Arrival photos sent to your WhatsApp.' },
    { label: 'Inspected', time: 'Mon 11:35', msg: '<b>Inspection done.</b> Front bumper, right headlight and right fender. Findings and photos sent.' },
    { label: 'Your approval', time: 'Mon 14:02', approval: true, msg: '<b>You approved the estimate</b> on your phone at 14:02. Work starts.' },
    { label: 'Parts', time: 'Tue 10:20', msg: '<b>Genuine parts ordered.</b> Headlight and brackets arrive Wednesday morning.' },
    { label: 'Bodywork', time: 'Tue 15:40', msg: '<b>Bumper repaired and refitted.</b> Panel gaps checked.' },
    { label: 'Paint', time: 'Wed 12:05', msg: '<b>In the paint booth.</b> Colour matched to the original paint code.' },
    { label: 'Quality check', time: 'Thu 10:30', msg: '<b>Road test and forty-point check passed.</b>' },
    { label: 'Ready', time: 'Thu 16:00', msg: '<b>Ready for collection.</b> Washed and ready to drive away.' },
  ];
  const EST_TITLE = {
    pending: 'Estimate, sent after inspection',
    awaiting: 'Estimate ready. Nothing starts until you approve.',
    call: 'Waiting for your call. Nothing is touched until you approve.',
    approved: 'Estimate approved Mon 14:02',
    done: 'Estimate approved Mon 14:02',
  };
  const rail = $('[data-rail]');
  const detail = $('[data-detail]');
  const tracker = $('[data-tracker]');
  const est = $('[data-estimate]');
  const estTitle = $('[data-est-title]');
  const approveBtn = $('[data-approve]', est);
  const callBtn = $('[data-callme]', est);
  const replayBtn = $('[data-replay]', est);
  let step = -1;
  let timer = 0;
  let approved = false;
  let called = false;
  function setEst(state) {
    est.className = `estimate is-${state}`;
    estTitle.textContent = EST_TITLE[state];
    approveBtn.disabled = !(state === 'awaiting' || state === 'call');
    callBtn.disabled = state !== 'awaiting';
    replayBtn.hidden = state !== 'done';
  }
  approveBtn.addEventListener('click', () => { approved = true; showStage(); });
  callBtn.addEventListener('click', () => {
    called = true;
    setEst('call');
    detail.innerHTML = '<b>Your service advisor will call you.</b> The car waits until you approve.';
  });
  replayBtn.addEventListener('click', () => start());

  STAGES.forEach((s) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="dot"><i class="ph ph-check" aria-hidden="true"></i></span><span class="lbl">${s.label}</span><span class="time"></span>`;
    rail.appendChild(li);
  });
  const lis = $$('li', rail);

  function paint() {
    lis.forEach((li, i) => {
      li.classList.toggle('done', i < step || (i === step && i === STAGES.length - 1));
      li.classList.toggle('now', i === step && i !== STAGES.length - 1);
      $('.time', li).textContent = i < step || (i === step && !(STAGES[i].approval && !approved)) ? STAGES[i].time : '';
    });
    rail.style.setProperty('--p', String(Math.max(0, step) / (STAGES.length - 1)));
  }

  function showStage() {
    clearTimeout(timer);
    const s = STAGES[step];
    paint();
    if (s.approval && !approved) {
      if (!called) {
        setEst('awaiting');
        detail.innerHTML = '<b>Estimate sent to your phone.</b> Approve it, or ask for a call first.';
      }
      return;
    }
    detail.innerHTML = s.msg;
    const last = step === STAGES.length - 1;
    setEst(approved ? (last ? 'done' : 'approved') : 'pending');
    if (last) return;
    timer = setTimeout(() => { step++; showStage(); }, reduce ? 200 : 1150);
  }
  function start() {
    clearTimeout(timer);
    approved = false;
    called = false;
    step = 0;
    showStage();
  }
  paint();
  setEst('pending');
  onceVisible(tracker, start, 0.35);
  $('[data-track-form]').addEventListener('submit', (e) => { e.preventDefault(); start(); });

  /* ---------- Before / after ---------- */
  const CASES = [
    'https://luxury-auto-service.com/wp-content/uploads/2024/07/s1.jpg',
    'https://luxury-auto-service.com/wp-content/uploads/2024/07/s2.jpg',
    'https://luxury-auto-service.com/wp-content/uploads/2024/07/s3.jpg',
  ];
  /* Side by side, not a wipe: each composite's two halves are shot from different angles,
     so a divider across them joins two unrelated frames. */
  const pair = $('[data-pair]');
  const before = $('[data-before]');
  const after = $('[data-after]');
  const tabs = $$('[data-case]');
  const setCase = (i) => {
    const url = `url("${CASES[i]}")`;
    before.style.backgroundImage = url;
    after.style.backgroundImage = url;
    tabs.forEach((b) => {
      const on = +b.dataset.case === i;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    pair.setAttribute('aria-labelledby', `case-${i}`);
    if (!reduce && pair.animate) pair.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
  };
  setCase(0);
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => setCase(i));
    b.addEventListener('keydown', (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus();
      n.click();
    });
  });

  /* ---------- Motion layer (optional) ---------- */
  if (reduce) return;
  const load = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500));
  Promise.race([
    Promise.all([
      load('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js').then(() => load('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js')),
      load('https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js'),
    ]),
    timeout,
  ]).then(enhance).catch(() => { /* page already works without the motion layer */ });

  function enhance() {
    const { gsap, ScrollTrigger, Lenis } = window;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    if (Lenis && !matchMedia('(pointer: coarse)').matches) {
      const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
      lenisRef = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      // The skip link keeps native behaviour so keyboard focus actually moves into the page.
      $$('a[href^="#"]:not(.skip)').forEach((a) => a.addEventListener('click', (e) => {
        const id = a.getAttribute('href') || '';
        if (!id.startsWith('#') || id.length < 2 || a.getAttribute('aria-disabled') === 'true') return;
        const t = $(id);
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: id === '#top' ? 0 : -72, duration: 1.3 });
      }));
    }

    gsap.to('[data-hero-media]', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-copy', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '35% top', end: 'bottom top', scrub: true } });
    gsap.from('[data-wm]', { yPercent: 70, ease: 'none', scrollTrigger: { trigger: '[data-foot]', start: 'top bottom', end: 'top 45%', scrub: true } });
  }
})();
