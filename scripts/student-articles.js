/* ──────────────────────────────────────────────────────────────
   student-articles.js  – modular Firebase version
   Folder: /scripts
   Depends on:  storage (Firebase Storage) exported from ./firebase.js
─────────────────────────────────────────────────────────────── */

import { storage } from './firebase.js';
import {
  ref,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    /* 1. Download the JSON file from Storage */
    const url  = await getDownloadURL(
      ref(storage, 'articles/articles.json')
    );
    const data = await fetch(url).then(r => r.json());

    /* 2. Render + activate filters */
    renderArticles(data);
    setupFilters();
  } catch (err) {
    console.error('Error loading articles.json:', err);
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
    const topicsAttr = article.topics
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

      <a href="article.html?article=${filename.replace('.json','')}"
         class="read-more-btn">Read More</a>

      <div class="article-topics">
        ${article.topics.map(t => `<span>${t}</span>`).join(' ')}
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
        const topics = card.dataset.topics.split(' ');
        card.style.display =
          filter === 'all' || topics.includes(filter) ? 'block' : 'none';
      });
    });
  });
}
