// scripts/student-articles.js
import { db } from './firebase-config.js'; // Assuming db is exported here
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
let allArticles = []; // Stores all articles (static + dynamic)
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
// 2. ARTICLE CARD CREATION (Handling Static vs. Dynamic Routing)
// -----------------------------------------------------------------

/**
 * Creates the HTML element for an article card.
 * @param {Object} article - The article data object.
 * @returns {HTMLElement} The article card element.
 */
function createArticleCard(article) {
    const card = document.createElement('article');
    card.className = 'article-card';
    card.setAttribute('data-topics', article.topics.join(' ').toLowerCase());

    // Determine the correct link based on the article source
    const articleLink = article.isDynamic 
        ? `articles/view-article.html?id=${article.id}` // Dynamic link
        : article.link; // Static link from HTML parsing

    // Default banner image if none is provided
    const defaultImage = '../assets/default-article-banner.png'; 
    const thumbnailSrc = article.bannerImage || article.thumbnail || defaultImage;

    card.innerHTML = `
        <img src="${thumbnailSrc}"
            alt="${article.title}"
            class="article-thumbnail w-full h-48 object-cover rounded mb-3" />

        <h3 class="text-xl font-semibold mb-1">
            ${article.title}
        </h3>
        <p class="article-excerpt mb-3">
            ${article.excerpt || article.introLead || 'Click to read more...'}
        </p>

        <a href="${articleLink}"
            class="read-more-btn text-indigo-600 hover:underline font-semibold">
            Read More →
        </a>
    `;

    return card;
}

// -----------------------------------------------------------------
// 3. STATIC ARTICLE PARSING
// -----------------------------------------------------------------

/**
 * Extracts hardcoded articles from the initial HTML structure.
 * This function runs only once during initialization.
 * @returns {Array} List of static article objects.
 */
function getStaticArticles() {
    const staticCards = Array.from(articlesListEl.querySelectorAll('.article-card'));
    const articles = staticCards.map(card => {
        // Extract data directly from the HTML elements
        const title = card.querySelector('h3')?.textContent.trim() || 'Untitled Static Article';
        const excerpt = card.querySelector('.article-excerpt')?.textContent.trim() || '';
        const link = card.querySelector('.read-more-btn')?.getAttribute('href') || '#';
        const thumbnail = card.querySelector('.article-thumbnail')?.getAttribute('src') || '';
        const topics = card.getAttribute('data-topics')?.split(/\s+/) || [];

        return {
            title,
            excerpt,
            link,
            thumbnail,
            topics,
            isDynamic: false, // Flag this as a static/local article
            submittedAt: { seconds: Date.now() / 1000 } // Give it a synthetic timestamp for sorting
        };
    });

    // Remove static cards from the DOM before dynamic loading
    staticCards.forEach(card => card.remove());
    return articles;
}


// -----------------------------------------------------------------
// 4. CORE LOADING FUNCTION
// -----------------------------------------------------------------

async function loadArticles() {
    console.log('Fetching articles: Combining static and dynamic sources...');
    articlesListEl.innerHTML = '<p class="text-center col-span-full">Loading articles...</p>';
    
    try {
        // A. Get Static Articles
        const staticArticles = getStaticArticles();

        // B. Get Dynamic Articles (Published only)
        const q = query(
            collection(db, 'article-submissions'), 
            where('status', '==', 'published'),
            orderBy('submittedAt', 'desc') // Sort by most recent
        );
        const snapshot = await getDocs(q);
        
        const dynamicArticles = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            isDynamic: true 
        }));

        // C. Combine All Articles
        allArticles = [...dynamicArticles, ...staticArticles]
            // Final sort (Dynamic articles with real timestamps will naturally appear first)
            .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));

        // Initialize filtered list with all data
        filteredArticles = allArticles;

        console.log(`Loaded ${allArticles.length} total articles (${staticArticles.length} static, ${dynamicArticles.length} dynamic).`);

        // D. Initialize View
        setupPagination();
        displayPage(currentPage);

    } catch (error) {
        console.error('Error loading articles:', error);
        articlesListEl.innerHTML = '<p class="text-center col-span-full text-red-600">Failed to load articles. Please check console for errors.</p>';
    }
}

// -----------------------------------------------------------------
// 5. PAGINATION AND DISPLAY LOGIC
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
    
    // Get the slice of articles for the current page
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
// 6. EVENT LISTENERS (Filters and Pagination Buttons)
// -----------------------------------------------------------------

/**
 * Handles filtering the articles when a category link is clicked.
 * @param {string} filterValue - The data-filter value.
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
        filteredArticles = allArticles.filter(article => 
            article.topics.map(t => t.toLowerCase()).includes(filterValue)
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
// 7. INITIALIZATION
// -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
});