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

// Initialize Firebase (only if not already initialized)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();
}

// Global access
const auth = firebase.auth();
const database = firebase.database();
// Load Header Function
function loadHeader() {
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            document.getElementById('header-placeholder').innerHTML = html;
            // Initialize header-related scripts AFTER load
            setupAuthUI(); 
        })
        .catch(err => {
            console.error('Failed to load header:', err);
            // Fallback: Show basic header if fetch fails
            document.getElementById('header-placeholder').innerHTML = '<header>LAW STUDENTS INTELLECTUAL FORUM</header>';
        });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadHeader(); // Load header first
    
    // Your existing article generation code
    // ...
});

// This script dynamically generates article cards based on the provided data
document.addEventListener('DOMContentLoaded', function() {
    const BASE_URL = 'https://KaguyaTempest.github.io/law-students-forum-website\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\/data/';

    fetch(`${BASE_URL}articles.json`)
      .then(res => res.json())
      .then(filenames => {
        filenames.forEach(filename => {
          fetch(`${BASE_URL}${filename}`)
            .then(res => res.json())
            .then(data => {
              const card = document.createElement('div');
              card.className = 'article-card min-w-[300px] max-w-[300px] bg-white p-4 rounded shadow';
              card.innerHTML = `
                ${data.image ? `<img src="${data.image}" alt="${data.title}" class="mb-2 rounded w-full" />` : ''}
                <h3 class="font-semibold text-lg mb-1">${data.title}</h3>
                ${data.author ? `<p class="text-sm text-gray-500 mb-1">By ${data.author}</p>` : ''}
                <p class="text-sm mb-2">${data.description}</p>
                <a href="${data.url}" class="text-blue-600 font-bold">READ MORE</a>
              `;
              document.getElementById('student-articles-carousel').appendChild(card);
            });
        });
      });
});

function setupAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');

    if (!loginBtn || !logoutBtn) {
        console.warn('Auth buttons not found in header!');
        return;
    }

    // Show/hide based on login state
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            authButtons.style.display = 'none';
            userInfo.style.display = 'flex';
            document.getElementById('user-name').textContent = user.displayName || user.email;
            // Set avatar if available
            if (user.photoURL) {
                document.getElementById('user-avatar').src = user.photoURL;
            }
        } else {
            authButtons.style.display = 'flex';
            userInfo.style.display = 'none';
        }
    });

    // Button event listeners
    loginBtn.addEventListener('click', () => {
        document.getElementById('show-login').click(); // Simulate click on your auth modal's login tab
    });

    logoutBtn.addEventListener('click', () => firebase.auth().signOut());
}

let currentIndex = 0;
const carousel = document.getElementById('article-carousel');
const totalCards = carousel.children.length;

document.querySelector('.left-arrow').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    updateCarousel();
  }
});

document.querySelector('.right-arrow').addEventListener('click', () => {
  if (currentIndex < totalCards - 1) {
    currentIndex++;
    updateCarousel();
  }
});

function updateCarousel() {
  carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
}
