/* scripts/home.js — modular, no global firebase object */
import { auth } from '../js/firebase.js';   // adjust path if you moved firebase.js
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ───────────────── DOM READY ────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadHeader();          // pulls in header.html then wires up auth UI
  generateArticleCards();
});

/* Hide splash once every asset has loaded */
window.addEventListener('load', () => {
  document.getElementById('splash')?.classList.add('hidden');
});

/* ───────────────── HEADER LOAD + AUTH UI ───────────────── */
function loadHeader() {
  fetch('header.html')
    .then(res => (res.ok ? res.text() : Promise.reject('Header load failed')))
    .then(html => {
      document.getElementById('header-placeholder').innerHTML = html;
      setupAuthUI();               // run only after header markup exists
    })
    .catch(err => {
      console.error(err);
      document.getElementById('header-placeholder').innerHTML =
        '<header>LAW STUDENTS INTELLECTUAL FORUM</header>';
    });
}

function setupAuthUI() {
  const loginBtn  = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const authBtns  = document.getElementById('auth-buttons');
  const userInfo  = document.getElementById('user-info');

  if (!loginBtn || !logoutBtn || !authBtns || !userInfo) return;

  onAuthStateChanged(auth, user => {
    if (user) {
      authBtns.style.display = 'none';
      userInfo.style.display = 'flex';
      document.getElementById('user-name').textContent =
        user.displayName || user.email;
      if (user.photoURL) {
        document.getElementById('user-avatar').src = user.photoURL;
      }
    } else {
      authBtns.style.display = 'flex';
      userInfo.style.display = 'none';
    }
  });

  loginBtn.addEventListener('click', () =>
    document.getElementById('show-login')?.click()
  );
  logoutBtn.addEventListener('click', () => signOut(auth));
}

/* ───────────────── ARTICLE CARDS (placeholder) ─────────── */
function generateArticleCards() {
  const articles = [
    {
      title: 'Developing Effective Legal Writing',
      content: 'Strategies for improving precision and clarity in legal documents.',
      link: '#'
    },
    {
      title: 'Navigating Legal Research',
      content: 'Tips for efficiently finding and using legal sources.',
      link: '#'
    }
  ];

  const container = document.getElementById('article-container');
  if (!container) return;

  articles.forEach(a => {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
      <h3>${a.title}</h3>
      <p>${a.content}</p>
      <a href="${a.link}">READ MORE</a>
    `;
    container.appendChild(card);
  });
}

/* ───────────────── NEWSLETTER CAROUSEL ─────────────────── */
const newsletterCarousel = document.querySelector('.newsletter-carousel');
const newsletterLeft  = document.querySelector('.newsletter-left-arrow');
const newsletterRight = document.querySelector('.newsletter-right-arrow');

if (newsletterCarousel && newsletterLeft && newsletterRight) {
  newsletterLeft.addEventListener('click',  () =>
    newsletterCarousel.scrollBy({ left: -320, behavior: 'smooth' }));
  newsletterRight.addEventListener('click', () =>
    newsletterCarousel.scrollBy({ left:  320, behavior: 'smooth' }));
  setInterval(() =>
    newsletterCarousel.scrollBy({ left: 320, behavior: 'smooth' }), 7000);
}

/* ───────────────── ARTICLE CAROUSEL ─────────────────────── */
const articleCarousel   = document.querySelector('.article-carousel');
const articleLeftArrow  = document.querySelector('.left-arrow');
const articleRightArrow = document.querySelector('.right-arrow');

if (articleCarousel && articleLeftArrow && articleRightArrow) {
  articleLeftArrow.addEventListener('click', () =>
    articleCarousel.scrollBy({ left: -320, behavior: 'smooth' }));
  articleRightArrow.addEventListener('click', () =>
    articleCarousel.scrollBy({ left: 320, behavior: 'smooth' }));
  setInterval(() =>
    articleCarousel.scrollBy({ left: 320, behavior: 'smooth' }), 7000);
}
