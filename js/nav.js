// Main menu: preview panels that open on click, keyboard, or a pause of the
// mouse; a menu button on small screens; and a header that hides on scroll
// down and returns on scroll up. The page works fully without this script.
(() => {
  const root = document.documentElement;
  const header = document.querySelector('header.top');
  const nav = header && header.querySelector('nav.main');
  if (!nav) return;
  root.classList.add('js-nav');

  /* Turn panel links into disclosure buttons; the panel's first link goes to the page */
  const items = [...nav.querySelectorAll('.nav-item.has-panel')];
  items.forEach(item => {
    const a = item.querySelector('.nav-link');
    const panel = item.querySelector('.panel');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = a.className;
    btn.textContent = a.textContent;
    if (a.hasAttribute('aria-current')) btn.setAttribute('aria-current', a.getAttribute('aria-current'));
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', panel.id);
    a.replaceWith(btn);
    item._btn = btn; item._panel = panel;
    btn.addEventListener('click', () => toggle(item, btn.getAttribute('aria-expanded') !== 'true'));
  });

  let openItem = null;
  function toggle(item, open) {
    if (open && openItem && openItem !== item) toggle(openItem, false);
    item._btn.setAttribute('aria-expanded', String(open));
    item._panel.hidden = !open;
    item.classList.toggle('open', open);
    openItem = open ? item : (openItem === item ? null : openItem);
    header.classList.toggle('has-open', !!openItem);
  }
  const closeAll = () => { if (openItem) toggle(openItem, false); };

  // Escape closes and returns focus; clicking or tabbing elsewhere closes
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && openItem) { const b = openItem._btn; closeAll(); b.focus(); }
  });
  document.addEventListener('click', e => { if (openItem && !openItem.contains(e.target)) closeAll(); });
  nav.addEventListener('focusout', e => { if (openItem && !openItem.contains(e.relatedTarget)) closeAll(); });

  // Mouse: open after a short pause, stay open while the pointer is over the item or its panel
  const fine = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1101px)');
  items.forEach(item => {
    let t;
    item.addEventListener('mouseenter', () => { if (!fine.matches) return; clearTimeout(t); t = setTimeout(() => toggle(item, true), 140); });
    item.addEventListener('mouseleave', () => { if (!fine.matches) return; clearTimeout(t); t = setTimeout(() => { if (!item.contains(document.activeElement)) toggle(item, false); }, 300); });
  });

  /* Small screens: a Menu button shows and hides the list */
  const menuBtn = nav.querySelector('.menu-toggle');
  const list = nav.querySelector('.nav-list');
  menuBtn.hidden = false;
  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', String(open));
    list.classList.toggle('is-open', open);
    if (!open) closeAll();
  });

  /* Header that hides on scroll down and returns on scroll up.
     Off when the reader prefers reduced motion or has chosen larger text. */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  function smartAllowed() {
    return !reduce.matches && root.getAttribute('data-motion') !== 'reduce' && !root.hasAttribute('data-text');
  }
  function updateMode() {
    root.classList.toggle('smart-header', smartAllowed());
    if (!smartAllowed()) header.classList.remove('is-hidden', 'is-scrolled');
  }
  updateMode();
  reduce.addEventListener('change', updateMode);
  new MutationObserver(updateMode).observe(root, { attributes: true, attributeFilter: ['data-motion', 'data-text'] });

  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (!root.classList.contains('smart-header')) { lastY = y; return; }
    header.classList.toggle('is-scrolled', y > header.offsetHeight);
    const busy = openItem || header.contains(document.activeElement) || list.classList.contains('is-open');
    if (y > lastY + 4 && y > header.offsetHeight * 2 && !busy) header.classList.add('is-hidden');
    else if (y < lastY - 4 || y < header.offsetHeight) header.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });
  // Keyboard users always see the header when focus moves into it
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
})();

// Let the hero photo run up behind the header, using the header's real height
(() => {
  const root = document.documentElement;
  const header = document.querySelector('header.top');
  if (!header || !document.querySelector('main > .hero:first-child')) return;
  root.classList.add('overlay-header');
  const set = () => root.style.setProperty('--header-h', header.offsetHeight + 'px');
  set();
  new ResizeObserver(set).observe(header);
})();
