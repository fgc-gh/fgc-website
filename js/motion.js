// Organic motion to soften the hard grid. Everything here is skipped when the
// reader prefers reduced motion (device setting or Display settings), and the
// page works the same without it.
(() => {
  const root = document.documentElement;
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => root.getAttribute('data-motion') === 'reduce' || (reduceMQ.matches && root.getAttribute('data-motion') !== 'allow');
  const SETTLE = 'cubic-bezier(.22, 1, .36, 1)';

  /* ---------- Hover fill that spreads from where the pointer enters ---------- */
  document.querySelectorAll('.task, .acc summary, .panel-links a').forEach(el => {
    el.classList.add('spread');
    const set = e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    };
    el.addEventListener('pointerenter', set);
    el.addEventListener('pointerleave', set);
  });

  /* ---------- Accordions: open with a soft settle, close smoothly ---------- */
  document.querySelectorAll('.acc details').forEach(d => {
    const group = d.getAttribute('name');
    if (group) { d.dataset.group = group; d.removeAttribute('name'); } // we handle "one open at a time" ourselves
    const summary = d.querySelector('summary');
    const content = summary.nextElementSibling;
    summary.addEventListener('click', e => {
      e.preventDefault();
      if (d.dataset.busy) return;
      if (d.open) close(d, content); else {
        if (group) d.parentElement.querySelectorAll(`details[data-group="${group}"][open]`).forEach(o => o !== d && close(o, o.querySelector('summary').nextElementSibling));
        open(d, content);
      }
    });
  });
  function open(d, el) {
    d.open = true;
    if (still()) return;
    d.dataset.busy = '1';
    const h = el.scrollHeight;
    el.style.overflow = 'hidden';
    const a = el.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 650, easing: SETTLE });
    [...el.querySelectorAll(':scope > *, .body > *')].slice(0, 6).forEach((c, i) =>
      c.animate([{ transform: 'translateY(14px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, delay: 60 + i * 55, easing: SETTLE, fill: 'backwards' }));
    a.onfinish = () => { el.style.overflow = ''; delete d.dataset.busy; };
  }
  function close(d, el) {
    if (still()) { d.open = false; return; }
    d.dataset.busy = '1';
    const h = el.offsetHeight;
    el.style.overflow = 'hidden';
    const a = el.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.4, 0, .6, 1)' });
    a.onfinish = () => { d.open = false; el.style.overflow = ''; delete d.dataset.busy; };
  }

  /* ---------- Menu panels unfold like a map ---------- */
  const unfold = panel => {
    if (still()) return;
    panel.animate([{ clipPath: 'inset(0 0 100% 0)', transform: 'translateY(-6px)' }, { clipPath: 'inset(0 0 0% 0)', transform: 'none' }], { duration: 560, easing: SETTLE });
    [...panel.querySelectorAll('li, figure')].forEach((c, i) =>
      c.animate([{ transform: 'translateY(-10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, delay: 70 + i * 60, easing: SETTLE, fill: 'backwards' }));
  };
  document.querySelectorAll('.panel').forEach(panel =>
    new MutationObserver(() => { if (!panel.hidden) unfold(panel); }).observe(panel, { attributes: true, attributeFilter: ['hidden'] }));
  const list = document.querySelector('.nav-list');
  if (list) new MutationObserver(() => {
    if (!list.classList.contains('is-open') || still()) return;
    [...list.children].forEach((c, i) =>
      c.animate([{ transform: 'translateY(-8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, delay: i * 45, easing: SETTLE, fill: 'backwards' }));
  }).observe(list, { attributes: true, attributeFilter: ['class'] });

  /* ---------- Topo layers drift with the pointer and with scrolling ---------- */
  const hero = document.querySelector('.hero');
  const layers = hero ? [...hero.querySelectorAll('.topo-defs .layer')] : [];
  if (layers.length) {
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    hero.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * -2;
      ty = ((e.clientY - r.top) / r.height - .5) * -2;
      kick();
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
    addEventListener('scroll', kick, { passive: true });
    function frame() {
      raf = 0;
      if (still()) { layers.forEach(l => { l.style.transform = ''; }); return; }
      x += (tx - x) * .06; y += (ty - y) * .06;
      const s = Math.min(scrollY, innerHeight) / innerHeight;
      layers.forEach((l, i) => {
        const k = (i + 1) / layers.length;
        l.style.transform = `translate(${(x * 14 * k).toFixed(2)}px, ${(y * 10 * k + s * 40 * k).toFixed(2)}px)`;
      });
      if (Math.abs(tx - x) > .002 || Math.abs(ty - y) > .002) kick();
    }
  }
  /* ---------- Color lens: the map shows its colors under your hand ---------- */
  const lens = document.querySelector('.topo-lens');
  if (lens && hero) {
    const REST = { x: .74, y: .42, r: 300 };
    let cx = REST.x, cy = REST.y, r = REST.r, gx = REST.x, gy = REST.y, gr = REST.r, ripple = 0, raf2 = 0;
    const go = () => { if (!raf2) raf2 = requestAnimationFrame(step); };
    hero.addEventListener('pointermove', e => {
      if (still() || (e.pointerType !== 'mouse' && e.pointerType !== 'pen')) return;
      const b = hero.getBoundingClientRect();
      gx = (e.clientX - b.left) / b.width; gy = (e.clientY - b.top) / b.height; gr = 230; go();
    });
    hero.addEventListener('pointerleave', () => { gx = REST.x; gy = REST.y; gr = REST.r; go(); });
    // A tap or click sends color rippling outward, then it draws back
    hero.addEventListener('pointerdown', e => {
      if (still() || e.target.closest('a, button')) return;
      const b = hero.getBoundingClientRect();
      gx = cx = (e.clientX - b.left) / b.width; gy = cy = (e.clientY - b.top) / b.height;
      ripple = Math.max(b.width, b.height) * 1.1; go();
      setTimeout(() => { ripple = 0; if (e.pointerType !== 'mouse') { gx = REST.x; gy = REST.y; } go(); }, 900);
    });
    function step() {
      raf2 = 0;
      if (still()) { lens.style.removeProperty('--cx'); lens.style.removeProperty('--cy'); lens.style.removeProperty('--rr'); return; }
      const target = ripple || gr;
      cx += (gx - cx) * .08; cy += (gy - cy) * .08; r += (target - r) * (ripple ? .05 : .07);
      lens.style.setProperty('--cx', (cx * 100).toFixed(2) + '%');
      lens.style.setProperty('--cy', (cy * 100).toFixed(2) + '%');
      lens.style.setProperty('--rr', r.toFixed(1) + 'px');
      if (Math.abs(gx - cx) > .0008 || Math.abs(gy - cy) > .0008 || Math.abs(target - r) > .5) go();
    }
  }

  /* ---------- Buttons lean toward the pointer ---------- */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      if (still() || e.pointerType !== 'mouse') return;
      const b = btn.getBoundingClientRect();
      btn.style.setProperty('--tx', (((e.clientX - b.left) / b.width - .5) * 8).toFixed(1) + 'px');
      btn.style.setProperty('--ty', (((e.clientY - b.top) / b.height - .5) * 6).toFixed(1) + 'px');
    });
    btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--tx'); btn.style.removeProperty('--ty'); });
  });

  /* ---------- Content rises gently into view as you scroll ---------- */
  if ('IntersectionObserver' in window) {
    const targets = [...document.querySelectorAll('.statement, .tasks > li, .acc > details, .projects > li, .fields > div, .sec > .label')]
      .filter(el => el.getBoundingClientRect().top > innerHeight); // only things below the first screen
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      if (still()) return;
      const sibs = en.target.parentElement ? [...en.target.parentElement.children] : [];
      const i = Math.max(0, sibs.indexOf(en.target)) % 6;
      en.target.animate([{ transform: 'translateY(22px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 800, delay: i * 70, easing: SETTLE, fill: 'backwards' });
    }), { threshold: .12 });
    targets.forEach(t => io.observe(t));
  }
})();