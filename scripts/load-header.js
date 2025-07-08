// load-header.js – injects the shared header and signals when ready
// • Works from ANY folder depth because HEADER_URL is computed
//   relative to this script’s own location (import.meta.url).
// • After insertion it dispatches a custom "header:loaded" event.

const HEADER_URL = new URL('../header.html', import.meta.url).href; // ✔ dynamic

async function insertHeader() {
  try {
    const res = await fetch(HEADER_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const headerHTML  = await res.text();
    const placeholder = document.getElementById('header-placeholder');
    if (!placeholder) throw new Error('header-placeholder div not found');

    placeholder.innerHTML = headerHTML;

    // Move auth-modal (if present) to <body> so z‑index works across pages
    const modal = placeholder.querySelector('#auth-modal');
    if (modal) document.body.appendChild(modal);

    /* ── Highlight active nav link ───────────────────────────── */
    const currentPath = window.location.pathname.replace(/\/+/g, '/');
    placeholder.querySelectorAll('nav a').forEach(link => {
      const linkPath = new URL(link.getAttribute('href'), window.location.origin).pathname;
      if (currentPath.endsWith(linkPath)) link.classList.add('active');
    });

    /* ── Notify other modules header is ready ────────────────── */
    document.dispatchEvent(new Event('header:loaded'));
  } catch (err) {
    console.error('[load-header]', err.message);
  }
}

/* Run immediately (DOM may already be parsed because this is a module) */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', insertHeader);
} else {
  insertHeader();
}

/* Optional named export (e.g. for unit tests) */
export { insertHeader };
