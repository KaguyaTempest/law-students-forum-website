/* ──────────────────────────────────────────────────────────────
   student-articles.js  – modular Firebase version (MERGED)
   Folder: /scripts
   Purpose: Dynamically list every article JSON inside
            Firebase Storage bucket path "articles/" and render
            them on the Student Articles page, keeping the
            existing topic‑filter system intact.
─────────────────────────────────────────────────────────────── */

import { storage } from './firebase.js';
import {
  ref,
  listAll,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

/* ───────────── Main Bootstrap ───────────── */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    /* 1. List every JSON file in /articles/ */
    const articlesRef = ref(storage, 'articles/');
    const listResult  = await listAll(articlesRef);

    /* 2. Pull each JSON, keeping filename so we can build links */
    const articlePromises = listResult.items
      .filter(item => item.name.endsWith('.json'))
      .map(async itemRef => {
        const url      = await getDownloadURL(itemRef);
        const article  = await fetch(url).then(r => r.json());
        return { filename: itemRef.name, article };
      });

    const articlesArray = await Promise.all(articlePromises);

    /* 3. Convert to object keyed by filename for existing render logic */
    const articlesObj = {};
    articlesArray.forEach(({ filename, article }) => {
      articlesObj[filename] = article;
    });

    /* 4. Render + activate filters */
    renderArticles(articlesObj);
    setupFilters();
  } catch (err) {
    console.error('Error loading articles from Storage:', err);
    const container = document.querySelector('.articles-list');
    if (container)
      container.innerHTML = '<p>Failed to load articles.</p>';
  }
});

/* ───────────── Render cards ───────────── */
function renderArticles(data) {
  const container = document.querySelector('.articles-list');
  if (!container) return;

  container.innerHTML = '';

  Object.entries(data).forEach(([filename, article]) => {
    const topicsAttr = (article.topics || [])
      .map(t => t.toLowerCase().replace(/\s+/g, '-'))
      .join(' ');

    const card = document.createElement('div');
    card.className      = 'article-card';
    card.dataset.topics = topicsAttr;

    card.innerHTML = `
      <img src="assets/${article.thumbnail}"
           alt="${article.title}"
           class="article-thumbnail">
      <h3>${article.title}</h3>
      <p class="article-excerpt">${article.excerpt}</p>

      <div class="article-meta">
        <span class="article-date">Published: ${article.date}</span>
        <span class="article-author">Author: ${article.author}</span>
      </div>

      <a href="article.html?article=${encodeURIComponent(filename.replace('.json',''))}"
         class="read-more-btn">Read More</a>

      <div class="article-topics">
        ${(article.topics || []).map(t => `<span>${t}</span>`).join(' ')}
      </div>
    `;

    container.appendChild(card);
  });
}

/* ───────────── Topic filter links ───────────── */
function setupFilters() {
  const filterLinks = document.querySelectorAll('.filter-link');
  if (!filterLinks.length) return;

  filterLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const filter = link.dataset.filter || 'all';

      filterLinks.forEach(fl => fl.classList.remove('active'));
      link.classList.add('active');

      document.querySelectorAll('.article-card').forEach(card => {
        const topics = card.dataset.topics.split(' ').filter(Boolean);
        card.style.display =
          filter === 'all' || topics.includes(filter) ? 'block' : 'none';
      });
    });
  });
}
