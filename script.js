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
});
   