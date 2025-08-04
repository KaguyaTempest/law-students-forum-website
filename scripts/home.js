/* ── scripts/home.js — handles carousels ─────────────────── */
// FIX: Removed all authentication-related imports, as this logic is now handled in auth-modal.js.
// import { auth } from '/scripts/firebase.js';
// import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';


/* Splash screen disappears once every asset is in */
window.addEventListener('load', () =>
    document.getElementById('splash')?.classList.add('hidden'));

// FIX: Removed the setupAuthUI() function and its listener, as this was causing a timing error.
// The authentication UI is now handled solely by auth-modal.js, which runs after header.html is loaded.
// function setupAuthUI() { /* ... removed ... */ }
// window.addEventListener('DOMContentLoaded', setupAuthUI);


/* ─── Newsletter carousel ─────────────────────────────────────────────── */
const newsletterCarousel = document.querySelector('.newsletter-carousel');
const nlLeft = document.querySelector('.newsletter-left-arrow');
const nlRight = document.querySelector('.newsletter-right-arrow');

if (newsletterCarousel && nlLeft && nlRight) {
    const cardWidth = () =>
        newsletterCarousel.firstElementChild.offsetWidth +
        parseFloat(getComputedStyle(newsletterCarousel).gap || 0);

    nlLeft.addEventListener('click', () =>
        newsletterCarousel.scrollBy({ left: -cardWidth(), behavior: 'smooth' }));
    nlRight.addEventListener('click', () =>
        newsletterCarousel.scrollBy({ left: cardWidth(), behavior: 'smooth' }));

    setInterval(() =>
        newsletterCarousel.scrollBy({ left: cardWidth(), behavior: 'smooth' }), 7000);
}

/* ─── Student-articles carousel ───────────────────────────────────────── */
const articleCarousel = document.querySelector('.article-carousel');
const artLeft = document.querySelector('.left-arrow');
const artRight = document.querySelector('.right-arrow');

if (articleCarousel && artLeft && artRight) {
    const cardWidth = () =>
        articleCarousel.firstElementChild.offsetWidth +
        parseFloat(getComputedStyle(articleCarousel).gap || 0);

    artLeft.addEventListener('click', () =>
        articleCarousel.scrollBy({ left: -cardWidth(), behavior: 'smooth' }));
    artRight.addEventListener('click', () =>
        articleCarousel.scrollBy({ left: cardWidth(), behavior: 'smooth' }));

    setInterval(() =>
        articleCarousel.scrollBy({ left: cardWidth(), behavior: 'smooth' }), 7000);
}