
// scripts/newsletter-magazine.js
import { auth, db } from './firebase-config.js';
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs,
    where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// DOM elements
const featuredPoemsContainer = document.getElementById('featured-poems');

// Load featured poems from Firebase
async function loadFeaturedPoems() {
    try {
        // Query to get approved poems, ordered by timestamp, limited to 3
        const q = query(
            collection(db, 'poetry-submissions'),
            where('status', '==', 'approved'),
            orderBy('timestamp', 'desc'),
            limit(3)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            featuredPoemsContainer.innerHTML = `
                <div class="no-poems">
                    <p>No featured poems available yet.</p>
                    <p><a href="../pages/poets-guild.html">Visit the Poets Guild to submit your work!</a></p>
                </div>
            `;
            return;
        }
        
        featuredPoemsContainer.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const poem = doc.data();
            const poemPreview = createPoemPreview(poem);
            featuredPoemsContainer.appendChild(poemPreview);
        });
        
    } catch (error) {
        console.error('Error loading featured poems:', error);
        featuredPoemsContainer.innerHTML = `
            <div class="error-message">
                <p>Unable to load poems at this time.</p>
                <p><a href="../pages/poets-guild.html">Visit the Poets Guild</a></p>
            </div>
        `;
    }
}

// Create poem preview element
function createPoemPreview(poem) {
    const preview = document.createElement('div');
    preview.className = 'poem-preview';
    
    // Get excerpt from content (first 100 characters)
    const excerpt = poem.hasFile ? 
        `File: ${poem.fileName}` : 
        poem.content.substring(0, 100) + (poem.content.length > 100 ? '...' : '');
    
    // Format date
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Recently';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    };
    
    preview.innerHTML = `
        <h6>${poem.title}</h6>
        <div class="poem-excerpt">${excerpt}</div>
        <div class="poem-author">— ${poem.authorName}, ${formatDate(poem.timestamp)}</div>
    `;
    
    // Add click event to view full poem
    preview.addEventListener('click', () => {
        window.location.href = '../pages/poets-guild.html';
    });
    
    preview.style.cursor = 'pointer';
    
    return preview;
}

// Add styles for no-poems and error messages
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .no-poems, .error-message {
            text-align: center;
            padding: 2rem;
            color: var(--text-color-light);
            font-style: italic;
        }
        
        .no-poems p, .error-message p {
            margin: 0.5rem 0;
        }
        
        .no-poems a, .error-message a {
            color: #8a0026;
            text-decoration: none;
            font-weight: bold;
        }
        
        .no-poems a:hover, .error-message a:hover {
            color: #b8002e;
            text-decoration: underline;
        }
        
        .poem-preview:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    addDynamicStyles();
    loadFeaturedPoems();
});

// Setup submit voice button functionality
document.addEventListener('DOMContentLoaded', () => {
    const submitVoiceBtn = document.querySelector('.submit-voice-btn');
    if (submitVoiceBtn) {
        submitVoiceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // You can implement a modal or redirect to a submission form
            alert('Student Voice submission feature coming soon! For now, please email us at info@lsif.uz.ac.zw');
        });
    }
});
