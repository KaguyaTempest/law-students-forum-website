/* ───────────────────────────────────────────────
   Static‑card helper for Student Articles page
   • No network calls — works with cards already
     present in the DOM.
   • Features:
       ① Tag/category filtering
       ② Sort by newest / oldest / A‑Z
       ③ Client‑side pagination (6 per page)
─────────────────────────────────────────────── */

const PAGE_SIZE = 6;

/* Cached node lists */
const cardNodes   = Array.from(document.querySelectorAll('.article-card'));
const filterLinks = document.querySelectorAll('.filter-link');
const sortSelect  = document.getElementById('sort-select');   // <select> (add in HTML)
const pagBar      = document.getElementById('pagination');
const prevBtn     = pagBar?.querySelector('.prev-page');
const nextBtn     = pagBar?.querySelector('.next-page');
const curPageEl   = pagBar?.querySelector('#current-page');
const totPagesEl  = pagBar?.querySelector('#total-pages');

/* State */
let currentFilter = 'all';
let currentSort   = 'newest';
let currentPage   = 1;
let filteredCards = cardNodes;

/* ── Init ───────────────────────────────────── */
setupFilters();
setupSort();
applyAll();                                // initial render

/* ── FILTERING ─────────────────────────────── */
function setupFilters() {
  filterLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      currentFilter = link.dataset.filter || 'all';
      filterLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      currentPage = 1;
      applyAll();
    });
  });
}

/* ── SORTING ───────────────────────────────── */
function setupSort() {
  if (!sortSelect) return;
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    currentPage = 1;
    applyAll();
  });
}

/* ── MAIN PIPELINE ─────────────────────────── */
function applyAll() {
  filterCards();
  sortCards();
  paginateCards();
}

/* Step 1: filter */
function filterCards() {
  filteredCards = cardNodes.filter(card => {
    if (currentFilter === 'all') return true;
    const topics = card.dataset.topics?.split(' ').filter(Boolean) || [];
    return topics.includes(currentFilter);
  });
}

/* Step 2: sort (needs data-date attr "YYYY-MM-DD") */
function sortCards() {
  if (currentSort === 'a-z') {
    filteredCards.sort((a, b) =>
      a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));
  } else { // newest or oldest
    filteredCards.sort((a, b) => {
      const dA = new Date(a.dataset.date);
      const dB = new Date(b.dataset.date);
      return currentSort === 'newest' ? dB - dA : dA - dB;
    });
  }
}

/* Step 3: pagination */
function paginateCards() {
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  if (pagBar) pagBar.classList.toggle('hidden', totalPages <= 1);
  if (curPageEl) curPageEl.textContent = currentPage;
  if (totPagesEl) totPagesEl.textContent = totalPages;

  prevBtn?.classList.toggle('opacity-50', currentPage === 1);
  nextBtn?.classList.toggle('opacity-50', currentPage === totalPages);

  prevBtn?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; applyAll(); }
  });
  nextBtn?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; applyAll(); }
  });

  /* Show / hide cards */
  cardNodes.forEach(card => card.style.display = 'none');
  filteredCards
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    .forEach(card => card.style.display = 'block');
}
