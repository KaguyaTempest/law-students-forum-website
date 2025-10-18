// scripts/student-articles.js
// Handles article loading, filtering, pagination, and modal submission

import { auth, db } from './firebase-config.js';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    addDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ============================================================
// GLOBAL STATE & CONFIGURATION
// ============================================================

const ARTICLES_PER_PAGE = 9;
let currentPage = 1;
let allArticles = [];
let filteredArticles = [];
let currentFilter = 'all';
let currentUser = null;

// DOM Elements
const articlesGrid = document.getElementById('articles-list');
const paginationEl = document.getElementById('pagination');
const currentPageEl = document.getElementById('current-page');
const totalPagesEl = document.getElementById('total-pages');
const prevPageBtn = document.querySelector('.prev-page');
const nextPageBtn = document.querySelector('.next-page');

// Modal Elements
const modal = document.getElementById('article-submission-modal');
const openModalBtn = document.getElementById('open-submit-article-modal');
const closeModalBtn = document.querySelector('.close-btn');
const submissionForm = document.getElementById('article-submission-form');
const submitBtn = document.getElementById('submit-article-btn');
const submissionMessage = document.getElementById('submission-message');

// ============================================================
// AUTHENTICATION STATE
// ============================================================

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    console.log('Auth state changed:', user ? user.email : 'No user');
});

// ============================================================
// MODAL FUNCTIONALITY
// ============================================================

/**
 * Opens the article submission modal
 */
function openModal() {
    if (!currentUser) {
        alert('You must be logged in to submit an article');
        // Trigger auth modal if you have one
        const event = new CustomEvent('show-auth-modal', { detail: { showLogin: true } });
        document.dispatchEvent(event);
        return;
    }
    modal.classList.add('show');
    submissionForm.reset();
    clearMessage();
}

/**
 * Closes the article submission modal
 */
function closeModal() {
    modal.classList.remove('show');
    submissionForm.reset();
    clearMessage();
}

/**
 * Shows a message in the modal
 */
function showMessage(text, type) {
    submissionMessage.textContent = text;
    submissionMessage.className = `submission-message ${type}`;
}

/**
 * Clears the message from the modal
 */
function clearMessage() {
    submissionMessage.className = 'submission-message hidden';
    submissionMessage.textContent = '';
}

// Modal event listeners
if (openModalBtn) {
    openModalBtn.addEventListener('click', openModal);
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
}

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeModal();
    }
});

// ============================================================
// FORM SUBMISSION
// ============================================================

/**
 * Handles article submission form
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate user is logged in
    if (!currentUser) {
        showMessage('You must be logged in to submit an article', 'error');
        return;
    }

    // Get form values
    const title = document.getElementById('submit-title').value.trim();
    const category = document.getElementById('submit-category').value.trim();
    const content = document.getElementById('submit-content').value.trim();

    // Validate form
    if (!title || !category || !content) {
        showMessage('❌ Please fill in all required fields', 'error');
        return;
    }

    if (content.length < 500) {
        showMessage('❌ Article content must be at least 500 characters', 'error');
        return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';

    try {
        // Calculate read time
        const wordCount = content.split(/\s+/).length;
        const readTime = Math.ceil(wordCount / 200);

        // Generate excerpt
        const excerpt = content.substring(0, 150) + '...';

        // Create article data object
        const articleData = {
            title,
            category,
            content,
            excerpt,
            author: currentUser.email,
            authorName: currentUser.displayName || currentUser.email.split('@')[0],
            submittedBy: currentUser.uid,
            submittedAt: serverTimestamp(),
            status: 'pending', // Requires admin approval
            views: 0,
            readTime: `${readTime} min read`,
            timestamp: new Date().getTime() // For sorting
        };

        console.log('Submitting article:', articleData);

        // Add to Firestore
        const docRef = await addDoc(collection(db, 'article-submissions'), articleData);

        console.log('Article submitted with ID:', docRef.id);

        // Show success message
        showMessage('✅ Article submitted successfully! It will be reviewed and published soon.', 'success');

        // Reset form
        submissionForm.reset();

        // Close modal after 2 seconds
        setTimeout(() => {
            closeModal();
        }, 2000);

    } catch (error) {
        console.error('Error submitting article:', error);
        showMessage(`❌ Failed to submit article: ${error.message}`, 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Attach form submission handler
if (submissionForm) {
    submissionForm.addEventListener('submit', handleFormSubmit);
}

// ============================================================
// ARTICLE LOADING & FILTERING
// ============================================================

/**
 * Creates an article card HTML element
 */
function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-category', (article.category || 'general').toLowerCase());

    // Article link
    const articleLink = `article.html?id=${article.id}`;
    
    // Default image
    const defaultImage = '../assets/default-article-banner.png';
    const thumbnailSrc = article.bannerImage || article.thumbnail || defaultImage;

    // Build card HTML
    card.innerHTML = `
        <a href="${articleLink}" class="article-link-wrapper">
            <img 
                src="${thumbnailSrc}"
                alt="${article.title}"
                class="article-thumbnail"
                loading="lazy"
            />
        </a>

        <div class="article-card-content">
            <h3>
                <a href="${articleLink}">
                    ${escapeHtml(article.title)}
                </a>
            </h3>
            
            <p class="article-excerpt">
                ${escapeHtml(article.excerpt || article.content?.substring(0, 150) + '...' || 'Click to read more...')}
            </p>

            <p class="article-meta">
                By ${escapeHtml(article.authorName || 'Student Author')} 
                ${article.category ? `| ${escapeHtml(article.category.replace('-', ' '))}` : ''}
            </p>

            <a href="${articleLink}" class="read-more-btn">
                Read More →
            </a>
        </div>
    `;

    return card;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Loads all published articles from Firebase
 */
async function loadArticles() {
    try {
        if (!articlesGrid) {
            console.warn('Articles grid not found');
            return;
        }

        articlesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #6b7280;">Loading articles...</div>';

        console.log('Fetching published articles...');

        // Query for published articles
        const q = query(
            collection(db, 'article-submissions'),
            where('status', '==', 'published'),
            orderBy('submittedAt', 'desc')
        );

        const snapshot = await getDocs(q);

        const articles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`Loaded ${articles.length} published articles`);

        allArticles = articles;
        filteredArticles = allArticles;

        // Initialize pagination and display
        setupPagination();
        displayPage(1);

        // If no articles, show empty state
        if (articles.length === 0) {
            articlesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #6b7280;"><p style="font-size: 1.1rem;">No articles published yet. Be the first to submit one!</p></div>';
        }

    } catch (error) {
        console.error('Error loading articles:', error);
        articlesGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #dc2626;">
            <p>Failed to load articles. Please try again later.</p>
            <p style="font-size: 0.9rem; color: #6b7280;">${error.message}</p>
        </div>`;
    }
}

// ============================================================
// PAGINATION
// ============================================================

/**
 * Sets up pagination controls
 */
function setupPagination() {
    const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
    totalPagesEl.textContent = totalPages;

    if (totalPages > 1) {
        paginationEl.classList.remove('hidden');
    } else {
        paginationEl.classList.add('hidden');
    }
}

/**
 * Displays a specific page of articles
 */
function displayPage(page) {
    const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);

    // Clamp page number
    currentPage = Math.max(1, Math.min(page, totalPages || 1));

    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;

    const articlesToDisplay = filteredArticles.slice(startIndex, endIndex);

    // Clear grid
    articlesGrid.innerHTML = '';

    // Display articles or empty state
    if (articlesToDisplay.length === 0) {
        articlesGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #6b7280;">
            <p style="font-size: 1.1rem;">No articles found for this filter.</p>
            <p style="font-size: 0.9rem;">Try selecting a different category or browse all articles.</p>
        </div>`;
        return;
    }

    // Add article cards to grid
    articlesToDisplay.forEach(article => {
        const card = createArticleCard(article);
        articlesGrid.appendChild(card);
    });

    // Update pagination
    currentPageEl.textContent = currentPage;
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;

    // Scroll to top of articles
    window.scrollTo({ top: articlesGrid.offsetTop - 100, behavior: 'smooth' });
}

// ============================================================
// FILTERING
// ============================================================

/**
 * Filters articles by category
 */
function filterArticles(filterValue) {
    // Update active filter link
    document.querySelectorAll('.filter-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-filter') === filterValue) {
            link.classList.add('active');
        }
    });

    currentFilter = filterValue;

    // Apply filter
    if (filterValue === 'all') {
        filteredArticles = allArticles;
    } else {
        filteredArticles = allArticles.filter(article =>
            article.category && article.category.toLowerCase() === filterValue.toLowerCase()
        );
    }

    // Reset to page 1 and redisplay
    currentPage = 1;
    setupPagination();
    displayPage(1);
}

// Attach filter listeners
document.querySelectorAll('.filter-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const filter = e.target.getAttribute('data-filter');
        filterArticles(filter);
    });
});

// ============================================================
// PAGINATION EVENT LISTENERS
// ============================================================

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

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing student articles page...');
    loadArticles();
});