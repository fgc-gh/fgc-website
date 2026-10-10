// Copy-email button (homepage and contact page)
const copyBtn = document.getElementById('copyBtn');
if (copyBtn) {
  const label = copyBtn.textContent;
  copyBtn.addEventListener('click', async () => {
    const email = document.getElementById('email');
    const status = document.getElementById('copyStatus');
    try {
      await navigator.clipboard.writeText(email.textContent.trim());
      copyBtn.textContent = 'Copied';
      status.textContent = 'Email address copied.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(email);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      copyBtn.textContent = 'Selected';
      status.textContent = 'Address selected. Press Control C to copy.';
    }
    setTimeout(() => { copyBtn.textContent = label; status.textContent = ''; }, 2500);
  });
}

// Preselect the contact form subject from a link, e.g. contact.html?topic=Campaign%20support
const subject = document.querySelector('select[name="subject"]');
const topic = new URLSearchParams(location.search).get('topic');
if (subject && topic) {
  const match = [...subject.options].find(o => o.value.toLowerCase() === topic.toLowerCase());
  if (match) subject.value = match.value;
}
