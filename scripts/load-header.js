// load-header.js – injects the shared header and signals when ready
// Assumes there is a <div id="header-placeholder"></div> in each page
// and that header.html lives at the site root (adjust HEADER_URL if not).
// After insertion it dispatches a custom "header:loaded" event so that
// scripts like auth.js can safely bind event listeners.

const HEADER_URL = '/header.html';

async function insertHeader() {
  try {
    const res = await fetch(HEADER_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const headerHTML = await res.text();
    const placeholder = document.getElementById('header-placeholder');
    if (!placeholder) throw new Error('header-placeholder div not found.');

    placeholder.innerHTML = headerHTML;

    // ── Highlight the active nav link ───────────────────────────────
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    placeholder.querySelectorAll('nav a').forEach(link => {
      const linkHref = link.getAttribute('href');
      if (linkHref === currentPage) link.classList.add('active');
    });

    // ── Emit event so other modules know header is ready ────────────
    document.dispatchEvent(new Event('header:loaded'));
  } catch (err) {
    console.error('[load-header] ' + err.message);
  }
}

// Run immediately (DOM may already be parsed because this is a module)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', insertHeader);
} else {
  insertHeader();
}

// Export for optional manual control / unit tests
export { insertHeader };
