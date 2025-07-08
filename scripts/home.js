/* ── scripts/home.js — handles carousels & auth hookup ─────────────────── */
import { auth } from '/scripts/firebase.js';          // adjust if path differs
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';


/* Splash screen disappears once every asset is in */
window.addEventListener('load', () =>
  document.getElementById('splash')?.classList.add('hidden'));

/* Wait for shared header to load, then wire auth UI */
window.addEventListener('DOMContentLoaded', setupAuthUI);

/* ─── Auth UI logic ────────────────────────────────────────────────────── */
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
      if (user.photoURL)
        document.getElementById('user-avatar').src = user.photoURL;
    } else {
      authBtns.style.display = 'flex';
      userInfo.style.display = 'none';
    }
  });

  loginBtn .addEventListener('click', () =>
    document.getElementById('show-login')?.click());
  logoutBtn.addEventListener('click', () => signOut(auth));
}

/* ─── Newsletter carousel ─────────────────────────────────────────────── */
const newsletterCarousel = document.querySelector('.newsletter-carousel');
const nlLeft  = document.querySelector('.newsletter-left-arrow');
const nlRight = document.querySelector('.newsletter-right-arrow');

if (newsletterCarousel && nlLeft && nlRight) {
  const cardWidth = () =>
    newsletterCarousel.firstElementChild.offsetWidth +
    parseFloat(getComputedStyle(newsletterCarousel).gap || 0);

  nlLeft .addEventListener('click', () =>
    newsletterCarousel.scrollBy({ left: -cardWidth(), behavior: 'smooth' }));
  nlRight.addEventListener('click', () =>
    newsletterCarousel.scrollBy({ left:  cardWidth(), behavior: 'smooth' }));

  setInterval(() =>
    newsletterCarousel.scrollBy({ left: cardWidth(), behavior: 'smooth' }), 7000);
}

/* ─── Student‑articles carousel ───────────────────────────────────────── */
const articleCarousel = document.querySelector('.article-carousel');
const artLeft  = document.querySelector('.left-arrow');
const artRight = document.querySelector('.right-arrow');

if (articleCarousel && artLeft && artRight) {
  const cardWidth = () =>
    articleCarousel.firstElementChild.offsetWidth +
    parseFloat(getComputedStyle(articleCarousel).gap || 0);

  artLeft .addEventListener('click', () =>
    articleCarousel.scrollBy({ left: -cardWidth(), behavior: 'smooth' }));
  artRight.addEventListener('click', () =>
    articleCarousel.scrollBy({ left:  cardWidth(), behavior: 'smooth' }));

  setInterval(() =>
    articleCarousel.scrollBy({ left: cardWidth(), behavior: 'smooth' }), 7000);
}
