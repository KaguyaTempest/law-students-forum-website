// script.js
// This script dynamically generates article cards based on the provided data
document.addEventListener('DOMContentLoaded', function () {
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
    // Load header.html into the placeholder
    const headerPlaceholder = document.getElementById("header-placeholder");
    if (headerPlaceholder) {
        fetch("header.html")
            .then(response => response.text())
            .then(html => {
                headerPlaceholder.innerHTML = html;
                // If needed, run Firebase or button scripts here
            })
            .catch(err => console.error("Failed to load header:", err));
    }

    // Show modal
    document.getElementById('login-btn').onclick = function() {
        document.getElementById('auth-modal').classList.remove('hidden');
        document.getElementById('login-form').classList.add('active');
        document.getElementById('signup-form').classList.remove('active');
    };
    document.getElementById('signup-btn').onclick = function() {
        document.getElementById('auth-modal').classList.remove('hidden');
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('signup-form').classList.add('active');
    };
    // Toggle forms
    document.getElementById('show-login').onclick = function() {
        document.getElementById('login-form').classList.add('active');
        document.getElementById('signup-form').classList.remove('active');
        this.classList.add('active');
        document.getElementById('show-signup').classList.remove('active');
    };
    document.getElementById('show-signup').onclick = function() {
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('signup-form').classList.add('active');
        this.classList.add('active');
        document.getElementById('show-login').classList.remove('active');
    };
    // Optional: Hide modal when clicking outside the card
    document.getElementById('auth-modal').onclick = function(e) {
        if (e.target === this) this.classList.add('hidden');
    };
});
