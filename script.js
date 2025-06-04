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
    const articles = [...];
    // ...
});

// This script dynamically generates article cards based on the provided data
document.addEventListener('DOMContentLoaded', function() {
    //  Replace this with your actual data fetching/processing
    const articles = [
        { title: "Developing Effective Legal Writing", content: "Strategies for improving precision and clarity in legal documents.", link: "#" },
        { title: "Navigating Legal Research", content: "Tips for efficiently finding and using legal sources.", link: "#" }
        // ... more articles
    ];

    const articleContainer = document.getElementById('article-container');

    articles.forEach(article => {
        const articleCard = document.createElement('div');
        articleCard.classList.add('article-card');

        articleCard.innerHTML = `
            <h3>${article.title}</h3>
            <p>${article.content}</p>
            <a href="${article.link}">READ MORE</a>
        `;

        articleContainer.appendChild(articleCard);
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
