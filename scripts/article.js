/* ──────────────────────────────────────────────────────────────
   article.js – Single‑article loader for Law Students Intellectual Forum

   • Imports Firebase Storage instance from ./firebase.js
   • Fetches the ?article=foo parameter → articles/foo.json
   • Sanitises any rich HTML with DOMPurify before injecting
   • Handles splash screen, banner fallback, and basic error UI
─────────────────────────────────────────────────────────────── */

import { storage }         from './firebase.js';
import { ref, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import DOMPurify            from 'https://cdn.jsdelivr.net/npm/dompurify@3.1.0/dist/purify.es.min.js';

/* Utility – quick selector */
const $ = sel => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', init);

async function init () {
  const splash     = $('#splash');
  const splashMsg  = $('#splash-message');

  try {
    /* 1️⃣  Determine which article to load */
    const params      = new URLSearchParams(window.location.search);
    const articleSlug = params.get('article'); // e.g. ?article=ai-the-new-oracle

    if (!articleSlug)
      throw new Error('No \'article\' query parameter provided.');

    splashMsg.textContent = 'Loading article…';

    /* 2️⃣  Fetch JSON from Storage */
    const fileRef = ref(storage, `articles/${articleSlug}.json`);
    const url     = await getDownloadURL(fileRef);
    const data    = await fetch(url).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });

    /* 3️⃣  Render the page */
    renderArticle(data);

    /* 4️⃣  Hide splash nicely */
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 400);  // allow CSS transition

  } catch (err) {
    console.error('Article load error:', err);
    if (splashMsg) splashMsg.textContent = 'Failed to load article';
    splash.classList.add('error');
    $('.article-content').innerHTML =
      '<p class="error">Sorry, we could not load this article.</p>';
  }
}

function renderArticle (data) {
  /* Title & meta */
  document.title             = `${data.title} – Law Students Intellectual Forum`;
  $('.article-title').textContent  = data.title;
  $('.article-date').textContent   = `Published: ${data.date   || 'Unknown'}`;
  $('.article-author').textContent = `Author:    ${data.author || 'Anonymous'}`;

  /* Banner (hide if none) */
  const banner = $('.article-banner');
  if (data.image) {
    banner.src          = data.image;
    banner.alt          = data.imageAlt || `${data.title} banner`;
    banner.style.display = '';
  } else {
    banner.style.display = 'none';
  }

  /* Body */
  const bodyEl = $('.article-body');
  bodyEl.innerHTML = '';

  if (Array.isArray(data.content)) {
    data.content.forEach(txt => {
      const p = document.createElement('p');
      p.textContent = txt;
      bodyEl.appendChild(p);
    });
  } else {
    bodyEl.innerHTML = DOMPurify.sanitize(
      data.content || 'No content available.'
    );
  }

  /* Topics */
  const topicsWrap = $('.article-topics');
  const labelSpan  = topicsWrap.querySelector('span');
  while (topicsWrap.lastChild !== labelSpan) {
    topicsWrap.removeChild(topicsWrap.lastChild);
  }

  (data.topics || []).forEach(topic => {
    const tag = document.createElement('span');
    tag.textContent = topic;
    topicsWrap.appendChild(tag);
  });
}
