// student-articles.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// Initialize Firebase (replace this with your real config)
const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-PROJECT.firebaseapp.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-BUCKET.appspot.com",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const storageRef = ref(storage, "articles/articles.json");

// Fetch articles.json from Firebase Storage
getDownloadURL(storageRef)
  .then((url) => fetch(url))
  .then((response) => response.json())
  .then((data) => {
    renderArticles(data);
    setupFilters(data);
  })
  .catch((err) => {
    console.error("Error loading articles.json:", err);
    document.querySelector(".articles-list").innerHTML = "<p>Failed to load articles.</p>";
  });

function renderArticles(data) {
  const container = document.querySelector(".articles-list");
  container.innerHTML = "";

  Object.entries(data).forEach(([filename, article]) => {
    const topicsAttr = article.topics.map(topic => topic.toLowerCase().replace(/\s+/g, '-')).join(" ");

    const card = document.createElement("div");
    card.className = "article-card";
    card.dataset.topics = topicsAttr;

    card.innerHTML = `
      <img src="assets/${article.thumbnail}" alt="${article.title}" class="article-thumbnail">
      <h3>${article.title}</h3>
      <p class="article-excerpt">${article.excerpt}</p>
      <div class="article-meta">
        <span class="article-date">Published: ${article.date}</span>
        <span class="article-author">Author: ${article.author}</span>
      </div>
      <a href="article.html?article=${filename.replace('.json','')}" class="read-more-btn">Read More</a>
      <div class="article-topics">
        ${article.topics.map(t => `<span>${t}</span>`).join(" ")}
      </div>
    `;

    container.appendChild(card);
  });
}

function setupFilters(data) {
  const filterLinks = document.querySelectorAll('.filter-link');
  const articleCards = document.querySelectorAll('.article-card');

  filterLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      const filterValue = this.getAttribute('data-filter');

      filterLinks.forEach(fl => fl.classList.remove('active'));
      this.classList.add('active');

      articleCards.forEach(card => {
        const topics = card.dataset.topics.split(' ');
        if (filterValue === 'all' || topics.includes(filterValue)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}
