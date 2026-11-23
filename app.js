/* Luxury Auto Service Centre, concept v3 (2026-11-19). Behaviour layer, no libraries.
   Damage map and booking carried over from concept v2; Our work is direction B's drag-to-compare. */
(() => {
  'use strict';
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
  const icon = (id) => `<svg class="i" aria-hidden="true"><use href="#i-${id}"/></svg>`;
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
  const scrollToEl = (el, block = 'start') => { if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block }); };

  /* Service cards that ask their own question on WhatsApp. */
  $$('[data-ask]').forEach((a) => { a.href = waLink(`Hello Luxury Auto. ${a.dataset.ask}`); });

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
      makeButton(el, p);
      gPanels.appendChild(el);
    });
    SIDE_GLASS.forEach((d) => {
      const el = svgEl('path', { d, class: 'glass' });
      gGlass.appendChild(el);
    });
    GLASS.forEach((g) => {
      const el = svgEl('path', { d: g.d, class: 'glass part' });
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
      gMirrors.appendChild(el);
      const hit = svgEl('rect', { x: m.hx, y: 292, width: 52, height: 50, class: 'hit' });
      makeButton(hit, m, [el]);
      gHits.appendChild(hit);
    });
    WHEELS.forEach((w) => {
      const el = svgEl('rect', { x: w.x, y: w.y, width: 26, height: 110, rx: 9, class: 'wheel' });
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
    gParts.classList.add('trim');

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
      <button type="button" class="remove" aria-label="Remove ${v.name}">${icon('x')}</button>
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
  const WORK = ['Scheduled service', 'Oil change', 'Brakes', 'A/C service', 'Warning light', 'Forty-point check-up'];
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
    setSend(svcSend, ready ? lines.join('\n') : '', '#book');
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

  /* ---------- Our work: drag between the damaged car and the finished one ---------- */
  /* The garage shot each pair from a different angle, so the halves do not line up mid-drag;
     matched-angle photos from the next repairs would fix that. */
  const CASES = [
    { k: 's1', car: 'Porsche Cayenne', dmg: 'front right corner damaged' },
    { k: 's2', car: 'Range Rover Sport', dmg: 'front right corner damaged' },
    { k: 's3', car: 'Mercedes-Benz C200', dmg: 'front left bumper damaged' },
  ];
  const cmp = $('[data-compare]');
  const range = $('[data-range]');
  const before = $('[data-before]');
  const after = $('[data-after]');
  const caseBtns = $$('[data-case]');
  const setX = (v) => cmp.style.setProperty('--x', `${v}%`);
  range.addEventListener('input', () => { cmp.classList.remove('is-hint'); setX(range.value); });
  CASES.forEach((c) => ['before', 'after'].forEach((s) => { const im = new Image(); im.src = `img/${c.k}_${s}.webp`; }));
  caseBtns.forEach((b) => b.addEventListener('click', () => {
    const c = CASES[+b.dataset.case];
    before.src = `img/${c.k}_before.webp`;
    before.alt = `${c.car} before the repair, ${c.dmg}`;
    after.src = `img/${c.k}_after.webp`;
    after.alt = `The same ${c.car} after the repair`;
    caseBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    range.value = 50;
    setX(50);
  }));
  // One slow sweep the first time the photos come into view shows the line can be moved.
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (range.value !== '50') return;
      cmp.classList.add('is-hint');
      [[350, 28], [1350, 66], [2350, 50]].forEach(([t, v]) => setTimeout(() => { if (cmp.classList.contains('is-hint')) setX(v); }, t));
      setTimeout(() => cmp.classList.remove('is-hint'), 3350);
    }, { threshold: 0.6 });
    io.observe(cmp);
  }

  /* ---------- Header: solid once the hero heading has scrolled under it ---------- */
  const hdr = $('[data-hdr]');
  if (hdr && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => hdr.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' }).observe($('.hero-copy h1'));
  }

  /* ---------- Phone dock: after the hero, out of the way of the footer ---------- */
  const dock = $('[data-dock]');
  if (dock && 'IntersectionObserver' in window) {
    const seen = { hero: true, foot: false };
    const sync = () => {
      const on = !seen.hero && !seen.foot;
      dock.classList.toggle('is-on', on);
      dock.inert = !on;
    };
    new IntersectionObserver(([e]) => { seen.hero = e.isIntersecting; sync(); }, { threshold: 0 }).observe($('[data-hero-cta]'));
    new IntersectionObserver(([e]) => { seen.foot = e.isIntersecting; sync(); }, { threshold: 0 }).observe($('[data-foot]'));
    sync();
  } else if (dock) {
    dock.classList.add('is-on');
  }
})();
