// scripts/poetry-submissions.js - Merged Version
import { createUniversityBadge, getUniversityTheme } from './university-themes.js';
import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { 
    collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp,
    doc, getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

let currentUser = null;

// DOM elements
const authRequired = document.getElementById('auth-required');
const submissionForm = document.getElementById('poetry-submission-form');
const worksContainer = document.getElementById('works-container');

// Debug log
console.log('Poetry submissions script loaded');
console.log('DOM elements found:', {
    authRequired: !!authRequired,
    submissionForm: !!submissionForm,
    worksContainer: !!worksContainer
});

// Auth state listener
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? 'User logged in' : 'No user');
    currentUser = user;
    updateUI();
    loadRecentWorks(); // Always show works regardless of auth
});

// Update UI based on auth state
function updateUI() {
    if (currentUser) {
        if (authRequired) authRequired.style.display = 'none';
        if (submissionForm) submissionForm.style.display = 'block';
        setupSubmissionForm();
    } else {
        if (authRequired) authRequired.style.display = 'block';
        if (submissionForm) submissionForm.style.display = 'none';
    }
}

// Setup submission form
function setupSubmissionForm() {
    if (!submissionForm) return;

    // Avoid duplicate listeners
    submissionForm.removeEventListener('submit', handleSubmission);
    submissionForm.addEventListener('submit', handleSubmission);

    // File input handler
    const fileInput = document.getElementById('work-file');
    const contentTextarea = document.getElementById('work-content');

    if (fileInput && contentTextarea) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                contentTextarea.placeholder = 'File selected. Content will be extracted from your file.';
                contentTextarea.disabled = true;
            } else {
                contentTextarea.placeholder = 'Paste your work here, or upload a file below...';
                contentTextarea.disabled = false;
            }
        });
    }
}

// Handle form submission
async function handleSubmission(e) {
    e.preventDefault();
    console.log('Form submission started');

    if (!currentUser) {
        alert('Please log in to submit your work.');
        return;
    }

    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData(e.target);
        const title = formData.get('title').trim();
        const type = formData.get('type');
        const content = formData.get('content').trim();
        const description = formData.get('description').trim();
        const isAnonymous = formData.get('anonymous') === 'on';
        const file = formData.get('file');

        console.log('Form data:', { title, type, contentPreview: content.substring(0, 50), isAnonymous });

        // Validation
        if (!title || !type) throw new Error('Please fill in all required fields.');
        if (!content && (!file || file.size === 0)) throw new Error('Please provide content or upload a file.');
        if (file && file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB.');

        // User profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Submission data
        const submissionData = {
            title,
            type,
            description,
            authorId: currentUser.uid,
            authorName: isAnonymous ? 'Anonymous' : (userData.username || currentUser.email),
            authorUniversity: isAnonymous ? '' : (userData.university || ''),
            isAnonymous,
            timestamp: serverTimestamp(),
            status: 'approved', // auto-approve for now
            likes: 0,
            views: 0
        };

        // File or text
        if (file && file.size > 0) {
            console.log('Uploading file:', file.name);
            const fileRef = ref(storage, `poetry-submissions/${Date.now()}_${file.name}`);
            const uploadResult = await uploadBytes(fileRef, file);
            const fileURL = await getDownloadURL(uploadResult.ref);

            submissionData.fileURL = fileURL;
            submissionData.fileName = file.name;
            submissionData.fileType = file.type;
            submissionData.hasFile = true;
        } else {
            submissionData.content = content;
            submissionData.hasFile = false;
        }

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'poetry-submissions'), submissionData);
        console.log('Document written with ID: ', docRef.id);

        // Reset form
        e.target.reset();
        const contentTextarea = document.getElementById('work-content');
        if (contentTextarea) {
            contentTextarea.disabled = false;
            contentTextarea.placeholder = 'Paste your work here, or upload a file below...';
        }

        showConfirmationMessage('Your work has been submitted successfully!');

        await loadRecentWorks();

    } catch (error) {
        console.error('Error submitting work:', error);
        alert(`Error: ${error.message}`);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Load and display recent works
async function loadRecentWorks() {
    if (!worksContainer) return;

    worksContainer.innerHTML = '<p class="loading-message">Loading poetry submissions...</p>';

    try {
        const q = query(
            collection(db, 'poetry-submissions'),
            orderBy('timestamp', 'desc'),
            limit(6)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            worksContainer.innerHTML = '<p class="loading-message">No submissions yet. Be the first!</p>';
            return;
        }

        worksContainer.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const work = docSnap.data();
            const workCard = createWorkCard(work, docSnap.id);
            worksContainer.appendChild(workCard);
        });
    } catch (error) {
        console.error('Error loading submissions:', error);

        let errorMessage = 'Error loading submissions.';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please check Firebase security rules.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Firebase service unavailable. Please try again later.';
        }

        worksContainer.innerHTML = `
            <div class="error-state">
                <p>${errorMessage}</p>
                <button onclick="loadRecentWorks()" class="retry-btn">Try Again</button>
            </div>
        `;
    }
}

// Helper function to display works
function displayWorks(snapshot) {
    console.log('Displaying works...');
    worksContainer.innerHTML = '';

    if (snapshot.empty) {
        worksContainer.innerHTML = `
            <div class="empty-message">
                <p>No poetry submissions yet.</p>
                <p>Be the first to share your creative work!</p>
            </div>
        `;
        return;
    }

    const worksGrid = document.createElement('div');
    worksGrid.className = 'works-grid';

    let displayCount = 0;
    snapshot.forEach((doc) => {
        const work = doc.data();
        try {
            const workCard = createWorkCard(work, doc.id);
            worksGrid.appendChild(workCard);
            displayCount++;
        } catch (cardError) {
            console.error('Error creating card for document:', doc.id, cardError);
        }
    });

    if (displayCount === 0) {
        worksContainer.innerHTML = '<p class="loading-message">No valid submissions found.</p>';
    } else {
        worksContainer.appendChild(worksGrid);
        console.log(`Successfully displayed ${displayCount} works`);
    }
}

// Create work card
function createWorkCard(work, id) {
    const card = document.createElement('div');
    card.className = 'work-card';
    
    // Safely handle all the data fields
    const title = work.title || 'Untitled';
    const type = work.type || 'other';
    const authorName = work.authorName || 'Unknown Author';
    const content = work.content || '';
    const description = work.description || '';
    const hasFile = work.hasFile || false;
    const fileName = work.fileName || 'Unknown file';
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Recently';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const preview = work.hasFile
        ? `<p class="work-preview"><em>File: ${work.fileName}</em></p>`
        : `<p class="work-preview">${work.content?.substring(0, 150) || ''}${work.content?.length > 150 ? '...' : ''}</p>`;

    card.innerHTML = `
        <h3>${work.title}</h3>
        <div class="work-meta">
            <span class="work-type">${work.type.replace('-', ' ')}</span>

            <span>${formatDate(work.timestamp)}</span>
        </div>
        <p class="work-author">by ${work.authorName}</p>
        ${preview}
        ${work.description ? `<p class="work-description">${work.description}</p>` : ''}
        <a href="#" class="read-more" onclick="viewWork('${id}')">Read More</a>
    `;

    return card;
}

// View full work placeholder
window.viewWork = function(workId) {
    alert('Full work viewing will be implemented in the next phase.');
};


// Simple confirmation message (temporary)
function showConfirmationMessage(msg) {
    alert(msg);
}

// Show confirmation message
function showConfirmationMessage(message) {
    // Remove existing message if any
    const existingMessage = document.querySelector('.confirmation-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new confirmation message
    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'confirmation-message';
    confirmationDiv.style.cssText = `
        background: #d4edda;
        color: #155724;
        padding: 1rem;
        border: 1px solid #c3e6cb;
        border-radius: 8px;
        margin-top: 1rem;
        text-align: center;
        font-weight: 600;
    `;
    confirmationDiv.textContent = message;
    
    // Insert after the form
    const form = document.getElementById('poetry-submission-form');
    if (form) {
        form.parentNode.insertBefore(confirmationDiv, form.nextSibling);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            if (confirmationDiv.parentNode) {
                confirmationDiv.remove();
            }
        }, 5000);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    const authLinks = document.querySelectorAll('.open-auth-modal');
    authLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.style.display = 'flex';
        });
    });

    if (currentUser) loadRecentWorks();
});
