// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0qWjJ8kt5jo1rOwNAd21RZ9QeK6pE7yU",
  authDomain: "lsif-cedb1.firebaseapp.com",
  databaseURL: "https://lsif-cedb1-default-rtdb.firebaseio.com",
  projectId: "lsif-cedb1",
  storageBucket: "lsif-cedb1.firebasestorage.app",
  messagingSenderId: "761903090404",
  appId: "1:761903090404:web:0b7c914fa2c3599faebaf1",
  measurementId: "G-GGNJJSP3DJ"
};

// ✅ Initialize Firebase (safely once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ✅ Initialize services
const auth = firebase.auth(); // << MUST come BEFORE setupAuthUI
const database = firebase.database();

// ✅ Setup DOM after everything is ready
document.addEventListener('DOMContentLoaded', () => {
  loadHeader();         // Will call setupAuthUI after header is loaded
  generateArticleCards();
});

// ✅ Load shared header then trigger auth UI setup
function loadHeader() {
  fetch('header.html')
    .then(res => {
      if (!res.ok) throw new Error("Header load failed");
      return res.text();
    })
    .then(html => {
      document.getElementById('header-placeholder').innerHTML = html;
      setupAuthUI(); // ✅ only call this after DOM contains header elements
    })
    .catch(err => {
      console.error('Header error:', err);
      document.getElementById('header-placeholder').innerHTML = '<header>LAW STUDENTS INTELLECTUAL FORUM</header>';
    });
}

// Handle Login/Logout UI
function setupAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const authButtons = document.getElementById('auth-buttons');
  const userInfo = document.getElementById('user-info');

  if (!loginBtn || !logoutBtn || !authButtons || !userInfo) {
    console.warn('Auth elements not found.');
    return;
  }

  auth.onAuthStateChanged(user => {
    if (user) {
      authButtons.style.display = 'none';
      userInfo.style.display = 'flex';
      document.getElementById('user-name').textContent = user.displayName || user.email;
      if (user.photoURL) {
        document.getElementById('user-avatar').src = user.photoURL;
      }
    } else {
      authButtons.style.display = 'flex';
      userInfo.style.display = 'none';
    }
  });

  loginBtn.addEventListener('click', () => {
    const loginTab = document.getElementById('show-login');
    if (loginTab) loginTab.click();
  });

  logoutBtn.addEventListener('click', () => auth.signOut());
}

// Generate article cards
function generateArticleCards() {
  const articles = [
    {
      title: "Developing Effective Legal Writing",
      content: "Strategies for improving precision and clarity in legal documents.",
      link: "#"
    },
    {
      title: "Navigating Legal Research",
      content: "Tips for efficiently finding and using legal sources.",
      link: "#"
    }
  ];

  const articleContainer = document.getElementById('article-container');
  if (!articleContainer) return;

  articles.forEach(article => {
    const card = document.createElement('div');
    card.classList.add('article-card');
    card.innerHTML = `
      <h3>${article.title}</h3>
      <p>${article.content}</p>
      <a href="${article.link}">READ MORE</a>
    `;
    articleContainer.appendChild(card);
  });
}

const newsletterCarousel = document.querySelector('.newsletter-carousel');
  const leftArrow = document.querySelector('.newsletter-left-arrow');
  const rightArrow = document.querySelector('.newsletter-right-arrow');

  if (leftArrow && rightArrow && newsletterCarousel) {
  leftArrow.addEventListener('click', () => {
    newsletterCarousel.scrollBy({ left: -320, behavior: 'smooth' });
  });

  rightArrow.addEventListener('click', () => {
    newsletterCarousel.scrollBy({ left: 320, behavior: 'smooth' });
  });

  // Auto-scroll every 7 seconds
  setInterval(() => {
    newsletterCarousel.scrollBy({ left: 320, behavior: 'smooth' });
  }, 7000);
}
const articleCarousel = document.querySelector('.article-carousel');
  const articleLeftArrow = document.querySelector('.left-arrow');
  const articleRightArrow = document.querySelector('.right-arrow');

  if (articleCarousel && articleLeftArrow && articleRightArrow) {
    articleLeftArrow.addEventListener('click', () => {
      articleCarousel.scrollBy({ left: -320, behavior: 'smooth' });
    });

    articleRightArrow.addEventListener('click', () => {
      articleCarousel.scrollBy({ left: 320, behavior: 'smooth' });
    });
// Auto-scroll every 7 seconds
  setInterval(() => {
    newsletterCarousel.scrollBy({ left: 320, behavior: 'smooth' });
  }, 7000);
}
