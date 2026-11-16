/* Luxury Auto Service Centre, website concept. Behaviour layer.
   Works without GSAP/Lenis: they are fetched after first paint and only add
   parallax, smooth scrolling and the cursor-follow image. */
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

  /* ---------- Reveal + counters ---------- */
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
        const v = Math.round(end * (1 - Math.pow(1 - p, 3)));
        el.textContent = v.toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 0.6);
  });

  /* ---------- Nav + dock ---------- */
  const nav = $('[data-nav]');
  const dock = $('[data-dock]');
  const hero = $('.hero');
  const vis = { hero: true, damage: false, foot: false };
  const syncDock = () => dock.classList.toggle('is-on', !vis.hero && !vis.damage && !vis.foot);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      nav.classList.toggle('is-solid', e.intersectionRatio < 0.88);
      vis.hero = e.intersectionRatio > 0.25;
      syncDock();
    }, { threshold: [0, 0.25, 0.88, 1] }).observe(hero);
    new IntersectionObserver(([e]) => { vis.damage = e.isIntersecting; syncDock(); }, { threshold: 0, rootMargin: '-35% 0px -35% 0px' }).observe($('#damage'));
    new IntersectionObserver(([e]) => { vis.foot = e.isIntersecting; syncDock(); }, { threshold: 0 }).observe($('[data-foot]'));
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
  ];
  const GLASS = [
    'M100 296 L320 296 L290 388 L130 388 Z',
    'M130 588 L290 588 L316 666 L104 666 Z',
    L.sideglass,
    mirrorX(L.sideglass),
  ];
  const WHEELS = [
    { id: 'whfl', name: 'Front left wheel', x: 36, y: 140, hx: 4 },
    { id: 'whfr', name: 'Front right wheel', x: 358, y: 140, hx: 364 },
    { id: 'whrl', name: 'Rear left wheel', x: 36, y: 662, hx: 4 },
    { id: 'whrr', name: 'Rear right wheel', x: 358, y: 662, hx: 364 },
  ];
  const MIRRORS = [
    { id: 'mrl', name: 'Left mirror', d: L.mirror, hx: 8 },
    { id: 'mrr', name: 'Right mirror', d: mirrorX(L.mirror), hx: 360 },
  ];
  const CHIPS = ['Service due', 'Warning light on', 'A/C not cooling', 'Brakes', 'Noise or vibration', 'Gearbox'];

  const car = $('[data-car]');
  const readout = $('[data-readout]');
  const picked = new Map(); // id -> { name, opts, choice }
  const chipsOn = new Set();
  const nodes = new Map(); // id -> element that shows the selected state

  if (car) {
    $('[data-body-path]', car).setAttribute('d', BODY);
    $('[data-outline]', car).setAttribute('d', BODY);
    const gPanels = $('[data-panels]', car);
    const gGlass = $('[data-glass]', car);
    const gWheels = $('[data-wheels]', car);
    const gTrim = $('[data-trim]', car);
    const gMirrors = $('[data-mirrors]', car);

    const makeButton = (el, item, opts) => {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-pressed', 'false');
      el.setAttribute('aria-label', item.name);
      el.addEventListener('click', () => toggle(item, opts));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(item, opts); }
      });
      el.addEventListener('pointerenter', () => setReadout(item.name));
      el.addEventListener('focus', () => setReadout(item.name));
      el.addEventListener('pointerleave', () => setReadout());
      el.addEventListener('blur', () => setReadout());
    };

    PANELS.forEach((p, i) => {
      const el = svgEl('path', { d: p.d, class: 'panel' });
      el.style.setProperty('--d', `${0.45 + i * 0.06}s`);
      makeButton(el, p, BODY_OPTS);
      gPanels.appendChild(el);
      nodes.set(p.id, [el]);
    });
    GLASS.forEach((d) => {
      const el = svgEl('path', { d, class: 'glass' });
      el.style.setProperty('--d', '1.1s');
      gGlass.appendChild(el);
    });
    WHEELS.forEach((w) => {
      const hit = svgEl('rect', { x: w.hx, y: w.y - 10, width: 52, height: 130, class: 'hit' });
      const el = svgEl('rect', { x: w.x, y: w.y, width: 26, height: 110, rx: 9, class: 'wheel' });
      el.style.setProperty('--d', '1.2s');
      makeButton(hit, w, ['Kerb damage', 'Repaint']);
      gWheels.append(hit, el);
      nodes.set(w.id, [hit, el]);
    });
    MIRRORS.forEach((m) => {
      const hit = svgEl('rect', { x: m.hx, y: 292, width: 52, height: 50, class: 'hit' });
      const el = svgEl('path', { d: m.d, class: 'mirror' });
      el.style.setProperty('--d', '1.2s');
      makeButton(hit, m, ['Broken', 'Scratch']);
      gMirrors.append(hit, el);
      nodes.set(m.id, [hit, el]);
    });
    [
      ['path', { d: 'M158 84 C154 170 152 240 156 292', class: 'crease' }],
      ['path', { d: 'M262 84 C266 170 268 240 264 292', class: 'crease' }],
      ['path', { d: 'M78 70 C96 54 124 46 150 44 L152 56 C126 60 102 68 86 82 Z', class: 'lamp' }],
      ['path', { d: mirrorX('M78 70 C96 54 124 46 150 44 L152 56 C126 60 102 68 86 82 Z'), class: 'lamp' }],
      ['path', { d: 'M64 826 C80 846 110 858 146 862 L146 850 C116 846 90 836 72 818 Z', class: 'tail' }],
      ['path', { d: mirrorX('M64 826 C80 846 110 858 146 862 L146 850 C116 846 90 836 72 818 Z'), class: 'tail' }],
    ].forEach(([t, a]) => gTrim.appendChild(svgEl(t, a)));
    gTrim.classList.add('trim');
    gTrim.style.setProperty('--d', '1.3s');

    if (reduce) car.classList.add('is-drawn');
    else onceVisible(car, () => car.classList.add('is-drawn'), 0.25);
  }

  function setReadout(name) {
    if (!readout) return;
    if (name) readout.innerHTML = `<b>${name}</b>${picked.has(idOf(name)) ? ' selected' : ''}`;
    else readout.textContent = picked.size ? `${picked.size} marked. Tap again to remove.` : 'Tap any panel';
  }
  const idOf = (name) => [...PANELS, ...WHEELS, ...MIRRORS].find((x) => x.name === name)?.id;

  function toggle(item, opts) {
    if (picked.has(item.id)) picked.delete(item.id);
    else picked.set(item.id, { name: item.name, opts, choice: opts[0] });
    const on = picked.has(item.id);
    (nodes.get(item.id) || []).forEach((n) => {
      n.classList.toggle('is-on', on);
      if (n.hasAttribute('aria-pressed')) n.setAttribute('aria-pressed', String(on));
    });
    setReadout(item.name);
    renderCard();
  }

  const list = $('[data-job-list]');
  const empty = $('[data-empty]');
  const badge = $('[data-count-badge]');
  const preview = $('[data-preview]');
  const send = $('[data-send]');
  const model = $('[data-car-model]');
  const year = $('[data-car-year]');
  const chipRow = $('[data-chips]');

  CHIPS.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = c;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      chipsOn.has(c) ? chipsOn.delete(c) : chipsOn.add(c);
      b.setAttribute('aria-pressed', String(chipsOn.has(c)));
      renderCard();
    });
    chipRow.appendChild(b);
  });
  // The digit filter must run before the message is rebuilt, or the message keeps the stray characters.
  year.addEventListener('input', () => { year.value = year.value.replace(/\D/g, '').slice(0, 4); });
  [model, year].forEach((i) => i.addEventListener('input', renderMessage));

  function renderCard() {
    list.innerHTML = '';
    picked.forEach((v, id) => {
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
        const item = [...PANELS, ...WHEELS, ...MIRRORS].find((x) => x.id === id);
        toggle(item, v.opts);
      });
      list.appendChild(li);
    });
    const n = picked.size + chipsOn.size;
    empty.hidden = picked.size > 0;
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
    lines.push('I can send photos here.');
    const msg = lines.join('\n');
    preview.textContent = n ? msg : 'Your message appears here once you mark something.';
    if (n) {
      send.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
      send.target = '_blank';
      send.rel = 'noopener';
      send.classList.remove('is-disabled');
      send.removeAttribute('aria-disabled');
    } else {
      send.href = '#damage';
      send.removeAttribute('target');
      send.classList.add('is-disabled');
      send.setAttribute('aria-disabled', 'true');
    }
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
  renderCard();

  /* ---------- Repair tracker ---------- */
  /* The estimate card is always in the layout and only changes state, so nothing below it
     moves when the demo reaches the approval step. Days run Saturday to Wednesday: the garage
     is open Saturday to Thursday. */
  const STAGES = [
    { label: 'Checked in', time: 'Sat 09:10', msg: '<b>Checked in at Bay 4.</b> Arrival photos sent to your WhatsApp.' },
    { label: 'Inspected', time: 'Sat 11:35', msg: '<b>Inspection done.</b> Front bumper, right headlight and right fender. Findings and photos sent.' },
    { label: 'Your approval', time: 'Sat 14:02', approval: true, msg: '<b>You approved the estimate</b> on your phone at 14:02. Work starts.' },
    { label: 'Parts', time: 'Sun 10:20', msg: '<b>Genuine parts ordered.</b> Headlight and brackets arrive Monday morning.' },
    { label: 'Bodywork', time: 'Mon 15:40', msg: '<b>Bumper repaired and refitted.</b> Panel gaps checked.' },
    { label: 'Paint', time: 'Tue 12:05', msg: '<b>In the paint booth.</b> Colour matched to the original paint code.' },
    { label: 'Quality check', time: 'Wed 10:30', msg: '<b>Road test and forty-point check passed.</b>' },
    { label: 'Ready', time: 'Wed 16:00', msg: '<b>Ready for collection.</b> Washed and ready to drive away.' },
  ];
  const EST_TITLE = {
    pending: 'Estimate, sent after inspection',
    awaiting: 'Estimate ready. Nothing starts until you approve.',
    call: 'Waiting for your call. Nothing is touched until you approve.',
    approved: 'Estimate approved Sat 14:02',
    done: 'Estimate approved Sat 14:02',
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

  /* ---------- Service strips ---------- */
  const strips = $$('.strip');
  const wide = matchMedia('(min-width: 768px)');
  const openStrip = (s) => { if (!wide.matches) return; strips.forEach((x) => x.classList.toggle('is-open', x === s)); };
  strips.forEach((s) => {
    s.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') openStrip(s); });
    s.addEventListener('focus', () => openStrip(s));
    s.addEventListener('click', () => openStrip(s));
  });

  /* ---------- Marques: image follows the cursor ---------- */
  const mList = $('[data-marques]');
  const float = $('[data-marque-float]');
  const fImg = $('[data-marque-img]');
  const mSection = $('.marques');
  let moveFloat = (x, y) => { float.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`; };
  if (!matchMedia('(hover: hover) and (min-width: 768px)').matches) {
    $$('li', mList).forEach((li) => {
      const im = document.createElement('img');
      im.className = 'marque-thumb';
      im.loading = 'lazy';
      im.decoding = 'async';
      im.alt = '';
      im.src = li.dataset.img.replace('w=900', 'w=760');
      li.prepend(im);
    });
  } else {
    let warmed = false;
    $$('li', mList).forEach((li) => {
      li.addEventListener('pointerenter', () => {
        if (!warmed) { $$('li', mList).forEach((x) => { const i = new Image(); i.src = x.dataset.img; }); warmed = true; }
        $$('li', mList).forEach((x) => x.classList.toggle('is-hot', x === li));
        fImg.src = li.dataset.img;
        float.classList.add('is-on');
      });
    });
    mList.addEventListener('pointerleave', () => {
      float.classList.remove('is-on');
      $$('li', mList).forEach((x) => x.classList.remove('is-hot'));
    });
    mSection.addEventListener('pointermove', (e) => {
      const r = mSection.getBoundingClientRect();
      moveFloat(e.clientX - r.left, e.clientY - r.top);
    });
  }

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

    const xTo = gsap.quickTo(float, 'x', { duration: 0.55, ease: 'power3' });
    const yTo = gsap.quickTo(float, 'y', { duration: 0.55, ease: 'power3' });
    gsap.set(float, { xPercent: -50, yPercent: -50 });
    moveFloat = (x, y) => { xTo(x); yTo(y); };

    gsap.from('[data-wm]', { yPercent: 70, ease: 'none', scrollTrigger: { trigger: '[data-foot]', start: 'top bottom', end: 'top 45%', scrub: true } });

    $$('.strip img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.strips', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }
})();
