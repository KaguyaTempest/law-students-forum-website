// scripts/student-articles.js
import { db } from './firebase-config.js'; 
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// -----------------------------------------------------------------
// 1. GLOBAL STATE & PAGINATION CONFIG
// -----------------------------------------------------------------
const ARTICLES_PER_PAGE = 9; // Display 9 articles per page
let currentPage = 1;
let allArticles = []; // Stores all published articles from Firebase
let filteredArticles = []; // Articles currently displayed after filter
let currentFilter = 'all';

// DOM Elements
const articlesListEl = document.getElementById('articles-list');
const paginationEl = document.getElementById('pagination');
const currentPageEl = document.getElementById('current-page');
const totalPagesEl = document.getElementById('total-pages');
const prevPageBtn = document.querySelector('.prev-page');
const nextPageBtn = document.querySelector('.next-page');


// -----------------------------------------------------------------
// 2. ARTICLE CARD CREATION (FIXED LINKING)
// -----------------------------------------------------------------

/**
 * Creates the HTML element for an article card.
 * @param {Object} article - The article data object from Firebase.
 * @returns {HTMLElement} The article card element.
 */
function createArticleCard(article) {
    const card = document.createElement('article');
    // We can use the category for filtering data attribute
    card.className = 'article-card';
    // NEW: Safely uses 'general' if the category field is missing
    card.setAttribute('data-category', (article.category || 'general').toLowerCase());
    // FIX: All articles are now dynamic and point to article.html
    // The ID ensures the dynamic-article-loader.js can fetch the content.
    const articleLink = `article.html?id=${article.id}`; 

    // Default banner image if none is provided
    const defaultImage = '../assets/default-article-banner.png'; 
    const thumbnailSrc = article.bannerImage || article.thumbnail || defaultImage;

    card.innerHTML = `
        <a href="${articleLink}" class="article-link-wrapper">
            <img src="${thumbnailSrc}"
                alt="${article.title}"
                class="article-thumbnail w-full h-48 object-cover rounded mb-3" />
        </a>

        <h3 class="text-xl font-semibold mb-1">
             <a href="${articleLink}">
                ${article.title}
            </a>
        </h3>
        <p class="article-excerpt mb-3">
            ${article.excerpt || article.introLead || (article.content ? article.content.substring(0, 150) + '...' : 'Click to read more...')}
        </p>

        <p class="article-meta">By ${article.authorName || 'Student Author'} | ${article.category || 'General'}</p>

        <a href="${articleLink}"
            class="read-more-btn text-indigo-600 hover:underline font-semibold">
            Read More →
        </a>
    `;

    return card;
}


// -----------------------------------------------------------------
// 3. CORE LOADING FUNCTION (Simplified)
// -----------------------------------------------------------------

async function loadArticles() {
    console.log('Fetching published articles from Firebase...');
    articlesListEl.innerHTML = '<p class="text-center col-span-full">Loading articles...</p>';
    
    try {
        // Fetch Dynamic Articles (Published only)
        // Assuming your published articles are in 'article-submissions' and have status: 'published'
        const q = query(
            collection(db, 'article-submissions'), 
            where('status', '==', 'published'),
            orderBy('submittedAt', 'desc') // Sort by most recent
        );
        const snapshot = await getDocs(q);
        
        const dynamicArticles = snapshot.docs.map(doc => ({ 
            id: doc.id, // CRUCIAL for dynamic linking
            ...doc.data(),
        }));

        allArticles = dynamicArticles;
        filteredArticles = allArticles;

        console.log(`Loaded ${allArticles.length} published articles.`);

        // Initialize View
        setupPagination();
        displayPage(currentPage);

    } catch (error) {
        console.error('Error loading articles:', error);
        articlesListEl.innerHTML = '<p class="text-center col-span-full text-red-600">Failed to load articles. Please ensure Firebase is configured and running.</p>';
    }
}

// -----------------------------------------------------------------
// 4. PAGINATION AND DISPLAY LOGIC
// -----------------------------------------------------------------

function setupPagination() {
    const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
    
    totalPagesEl.textContent = totalPages;

    if (totalPages > 1) {
        paginationEl.classList.remove('hidden');
    } else {
        paginationEl.classList.add('hidden');
    }
}

function displayPage(page) {
    const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);

    // Clamp page number
    currentPage = Math.max(1, Math.min(page, totalPages || 1));
    
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    
    const articlesToDisplay = filteredArticles.slice(startIndex, endIndex);

    // Clear and display
    articlesListEl.innerHTML = '';
    
    if (articlesToDisplay.length === 0) {
        articlesListEl.innerHTML = `<p class="text-center col-span-full">No articles found for the filter "${currentFilter}".</p>`;
        return;
    }

    articlesToDisplay.forEach(article => {
        const card = createArticleCard(article);
        articlesListEl.appendChild(card);
    });

    // Update pagination controls
    currentPageEl.textContent = currentPage;
    prevPageBtn.disabled = (currentPage === 1);
    nextPageBtn.disabled = (currentPage === totalPages);
}

// -----------------------------------------------------------------
// 5. EVENT LISTENERS (Filters and Pagination Buttons)
// -----------------------------------------------------------------

/**
 * Handles filtering the articles when a category link is clicked.
 * @param {string} filterValue - The data-filter value (e.g., 'human-rights-law').
 */
function handleFilter(filterValue) {
    // Update active class
    document.querySelectorAll('.filter-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-filter') === filterValue) {
            link.classList.add('active');
        }
    });

    currentFilter = filterValue;
    
    if (filterValue === 'all') {
        filteredArticles = allArticles;
    } else {
        // FILTER FIX: Filter based on the 'category' property
        filteredArticles = allArticles.filter(article => 
            article.category && article.category.toLowerCase() === filterValue
        );
    }
    
    // Reset to the first page and re-display
    currentPage = 1;
    setupPagination();
    displayPage(currentPage);
}

// Attach listeners to filter links
document.querySelectorAll('.filter-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const filter = e.target.getAttribute('data-filter');
        handleFilter(filter);
    });
});

// Attach listeners to pagination buttons
if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        displayPage(currentPage - 1);
    });
}
if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        displayPage(currentPage + 1);
    });
}


// -----------------------------------------------------------------
// 6. INITIALIZATION
// -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
});