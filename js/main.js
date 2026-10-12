// Fertile Ground Conservancy. Every page works without this script.
// It adds: display settings, the copy-email button, a preselected contact
// subject, and clearer form error messages.
(() => {
  const root = document.documentElement;

  /* ---------- Display settings (remembered on this device) ---------- */
  const KEYS = ['text', 'contrast', 'theme', 'spacing', 'motion'];
  const ATTR = { text: 'data-text', contrast: 'data-contrast', theme: 'data-theme', spacing: 'data-spacing', motion: 'data-motion' };
  const store = {
    get() { try { return JSON.parse(localStorage.getItem('fgc-display') || '{}') || {}; } catch { return {}; } },
    set(v) { try { localStorage.setItem('fgc-display', JSON.stringify(v)); return true; } catch { return false; } }
  };
  function apply(prefs) {
    KEYS.forEach(k => {
      if (prefs[k]) root.setAttribute(ATTR[k], prefs[k]); else root.removeAttribute(ATTR[k]);
      const input = document.querySelector(`input[name="display-${k}"][value="${prefs[k] || ''}"]`);
      if (input) input.checked = true;
    });
  }
  let prefs = store.get();
  apply(prefs);

  document.querySelectorAll('[data-needs-js]').forEach(el => { el.hidden = false; });

  const toggle = document.getElementById('settingsToggle');
  const panel = document.getElementById('settings');
  const note = document.getElementById('savedNote');
  if (toggle && panel) {
    toggle.hidden = false;
    const setOpen = (open, focusBack) => {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      const h = panel.querySelector('h2');
      if (open) { h.setAttribute('tabindex', '-1'); h.focus(); panel.scrollIntoView({ block: 'start' }); }
      else if (focusBack) toggle.focus();
    };
    toggle.addEventListener('click', () => setOpen(panel.hidden));
    document.querySelectorAll('[data-open-settings]').forEach(b => b.addEventListener('click', () => setOpen(true)));
    document.getElementById('closeSettings').addEventListener('click', () => setOpen(false, true));
    panel.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false, true); });
    panel.addEventListener('change', e => {
      const name = (e.target.name || '').replace('display-', '');
      if (!KEYS.includes(name)) return;
      prefs[name] = e.target.value;
      apply(prefs);
      const label = e.target.closest('label').textContent.trim();
      note.textContent = (store.set(prefs) ? 'Saved: ' : 'Applied for this visit: ') + label + '.';
    });
    document.getElementById('resetSettings').addEventListener('click', () => {
      prefs = {}; apply(prefs); store.set(prefs);
      note.textContent = 'All settings are back to standard.';
    });
  }

  /* ---------- Copy email ---------- */
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    const label = copyBtn.textContent;
    const status = document.getElementById('copyStatus');
    copyBtn.addEventListener('click', async () => {
      const email = document.getElementById('email');
      try { await navigator.clipboard.writeText(email.textContent.trim()); copyBtn.textContent = 'Copied'; status.textContent = 'Email address copied.'; }
      catch {
        const r = document.createRange(); r.selectNodeContents(email);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        copyBtn.textContent = 'Address selected'; status.textContent = 'Address selected. Press Control C to copy.';
      }
      setTimeout(() => { copyBtn.textContent = label; status.textContent = ''; }, 3000);
    });
  }

  /* ---------- Contact subject from a link, e.g. contact.html?topic=Land ---------- */
  const subject = document.querySelector('select[name="subject"]');
  const topic = new URLSearchParams(location.search).get('topic');
  if (subject && topic) {
    const match = [...subject.options].find(o => o.value.toLowerCase() === topic.toLowerCase());
    if (match) subject.value = match.value;
  }

  /* ---------- Form errors: a summary at the top, and a message by each question ---------- */
  document.querySelectorAll('form.form').forEach(form => {
    form.noValidate = true;
    const summary = form.querySelector('.error-summary');
    function message(el) {
      const name = el.closest('.field').querySelector('label').firstChild.textContent.trim();
      if (el.validity.valueMissing) return el.dataset.missing || `Answer this question: ${name}`;
      if (el.validity.typeMismatch && el.type === 'email') return 'Enter an email address in the format name@example.com';
      if (el.validity.typeMismatch && el.type === 'url') return 'Enter a web address that starts with https://, or leave this blank';
      return `Check your answer: ${name}`;
    }
    function clear(field) {
      field.classList.remove('has-error');
      const err = field.querySelector('.error');
      const input = field.querySelector('input, textarea, select');
      if (err) {
        err.remove();
        const ids = (input.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== err.id);
        if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
      }
      input.removeAttribute('aria-invalid');
    }
    form.addEventListener('submit', e => {
      const problems = [];
      form.querySelectorAll('.field').forEach(field => {
        clear(field);
        const input = field.querySelector('input, textarea, select');
        if (input.checkValidity()) return;
        const msg = message(input);
        const err = document.createElement('p');
        err.className = 'error'; err.id = input.id + '-error';
        err.innerHTML = '<span class="vh">Error:</span> ';
        err.append(msg);
        field.querySelector('label').after(err);
        field.classList.add('has-error');
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', [err.id, input.getAttribute('aria-describedby')].filter(Boolean).join(' '));
        problems.push({ id: input.id, msg });
      });
      if (!problems.length) { if (summary) summary.hidden = true; return; }
      e.preventDefault();
      if (!summary) { form.querySelector('[aria-invalid]').focus(); return; }
      const n = problems.length;
      summary.innerHTML = `<h3 id="${form.name}-errors" tabindex="-1">${n === 1 ? 'There is 1 problem' : `There are ${n} problems`} to fix before sending</h3><ul></ul>`;
      const ul = summary.querySelector('ul');
      problems.forEach(p => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + p.id; a.textContent = p.msg;
        a.addEventListener('click', ev => { ev.preventDefault(); document.getElementById(p.id).focus(); });
        li.append(a); ul.append(li);
      });
      summary.hidden = false;
      summary.querySelector('h3').focus();
    });
    // Clear a question's error as soon as it is fixed
    form.addEventListener('input', e => {
      const field = e.target.closest('.field');
      if (field && field.classList.contains('has-error') && e.target.checkValidity()) clear(field);
    });
  });
})();
