// Firebase config - OUTSIDE DOMContentLoaded is fine
const firebaseConfig = {
  apiKey: "AIzaSyC0qWjJ8kt5jo1rOwNAd21RZ9QeK6pE7yU",
  authDomain: "lsif-cedb1.firebaseapp.com",
  databaseURL: "https://lsif-cedb1-default-rtdb.firebaseio.com",
  projectId: "lsif-cedb1",
  storageBucket: "lsif-cedb1.appspot.com",
  messagingSenderId: "761903090404",
  appId: "1:761903090404:web:0b7c914fa2c3599faebaf1",
  measurementId: "G-GGNJJSP3DJ",
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();
const auth = firebase.auth();
const database = firebase.database();

document.addEventListener("DOMContentLoaded", async () => {
  const carousel = document.getElementById('student-articles-carousel');
  const leftArrow = document.getElementById('leftArrow');
  const rightArrow = document.getElementById('rightArrow');

  let currentIndex = 0;
  let autoSlideInterval;

  // === LOAD FIREBASE STORAGE MODULE ===
  const { getStorage, ref, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js");
  const storage = getStorage();

  // === LOAD ARTICLES ===
  async function loadArticles() {
    const articleList = ['article1.json', 'article2.json', 'ai-copyright-analysis.json'];
    for (const file of articleList) {
      try {
        const url = await getDownloadURL(ref(storage, `articles/${file}`));
        const response = await fetch(url);
        const data = await response.json();

        const card = document.createElement('div');
        card.className = 'article-card flex-shrink-0 w-full max-w-full box-border p-4';
        card.innerHTML = `
          ${data.image ? `<img src="${data.image}" alt="${data.title}" class="mb-2 rounded w-full" />` : ''}
          <h3 class="font-semibold text-lg mb-1">${data.title}</h3>
          ${data.author ? `<p class="text-sm text-gray-500 mb-1">By ${data.author}</p>` : ''}
          <p class="text-sm mb-2">${data.description}</p>
          <a href="${data.url}" class="text-blue-600 font-bold">READ MORE</a>
        `;
        carousel.appendChild(card);
      } catch (err) {
        console.error(`Error loading ${file}:`, err);
      }
    }

    // Start carousel after loading
    updateCarousel();
    startAutoSlide();
  }

  // === CAROUSEL FUNCTIONS ===
  function updateCarousel() {
    const offset = -currentIndex * 100;
    carousel.style.transform = `translateX(${offset}%)`;
  }

  function goToSlide(index) {
    const totalSlides = carousel.children.length;
    currentIndex = (index + totalSlides) % totalSlides;
    updateCarousel();
  }

  function startAutoSlide() {
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 7000);
  }

  // === ARROWS ===
  leftArrow.addEventListener('click', () => {
    goToSlide(currentIndex - 1);
    startAutoSlide();
  });

  rightArrow.addEventListener('click', () => {
    goToSlide(currentIndex + 1);
    startAutoSlide();
  });

  // === SWIPE SUPPORT ===
  let touchStartX = 0;
  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  });
  carousel.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 50) goToSlide(currentIndex - 1);
    else if (deltaX < -50) goToSlide(currentIndex + 1);
    startAutoSlide();
  });

  // === START ===
  loadArticles();
});
