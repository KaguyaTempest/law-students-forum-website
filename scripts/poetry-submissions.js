// scripts/poetry-submissions.js - Debug Version
import { auth, db, storage } from './firebase-config.js';
import { 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    serverTimestamp,
    doc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

let currentUser = null;

// DOM elements
const authRequired = document.getElementById('auth-required');
const submissionForm = document.getElementById('poetry-submission-form');
const worksContainer = document.getElementById('works-container');

// Add debug logging
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
    // Load recent works regardless of auth state
    loadRecentWorks();
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

// Setup submission form (replaces previous implementation)
function setupSubmissionForm() {
    if (!submissionForm) return;

    // Remove existing event listeners to prevent duplicates
    submissionForm.removeEventListener('submit', handleSubmission);
    submissionForm.addEventListener('submit', handleSubmission);

    // Existing file input and content textarea handling
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

    // NEW: background image preview handling
    const bgInput = document.getElementById('background-image');
    const bgPreview = document.getElementById('background-preview');
    const bgPreviewImg = document.getElementById('background-preview-img');
    const removeBgBtn = document.getElementById('remove-background-preview');

    if (bgInput && bgPreview && bgPreviewImg && removeBgBtn) {
        bgInput.addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (f && f.size > 0) {
                // limit ~3MB for background images
                if (f.size > 3 * 1024 * 1024) {
                    alert('Background image must be less than 3MB.');
                    bgInput.value = '';
                    bgPreview.style.display = 'none';
                    bgPreviewImg.src = '';
                    return;
                }
                const objectURL = URL.createObjectURL(f);
                bgPreviewImg.src = objectURL;
                bgPreview.style.display = 'block';
            } else {
                bgPreview.style.display = 'none';
                bgPreviewImg.src = '';
            }
        });

        removeBgBtn.addEventListener('click', () => {
            bgInput.value = '';
            bgPreviewImg.src = '';
            bgPreview.style.display = 'none';
        });
    }
}

// Handle form submission (replaces previous implementation)
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
        const title = (formData.get('title') || '').trim();
        const type = formData.get('type');
        const content = (formData.get('content') || '').trim();
        const description = (formData.get('description') || '').trim();
        const isAnonymous = formData.get('anonymous') === 'on';
        const file = formData.get('file');
        const themeColor = formData.get('themeColor') || '';
        const backgroundFile = formData.get('backgroundImage');

        console.log('Form data:', { title, type, content: content.substring(0, 50) + '...', isAnonymous, themeColor, hasBg: !!backgroundFile?.name });

        // Validation
        if (!title || !type) {
            throw new Error('Please fill in all required fields.');
        }

        if (!content && (!file || file.size === 0)) {
            throw new Error('Please provide content either by typing or uploading a file.');
        }

        if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
            throw new Error('File size must be less than 5MB.');
        }

        // Get user profile for author info
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Prepare submission data
        const submissionData = {
            title,
            type,
            description,
            authorId: currentUser.uid,
            authorName: isAnonymous ? 'Anonymous' : (userData.username || currentUser.email),
            authorUniversity: isAnonymous ? '' : (userData.university || ''),
            isAnonymous,
            timestamp: serverTimestamp(),
            status: 'approved',
            likes: 0,
            views: 0,
            themeColor: themeColor || '',
            backgroundImageURL: '' // will populate if upload occurs
        };

        // Handle file upload or text content
        if (file && file.size > 0) {
            console.log('Uploading content file:', file.name);
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

        // Handle background image upload (if provided)
        if (backgroundFile && backgroundFile.size > 0) {
            console.log('Uploading background image:', backgroundFile.name);
            const bgRef = ref(storage, `poetry-backgrounds/${Date.now()}_${backgroundFile.name}`);
            const bgUpload = await uploadBytes(bgRef, backgroundFile);
            const bgURL = await getDownloadURL(bgUpload.ref);
            submissionData.backgroundImageURL = bgURL;
            // If a background image is provided, prefer it over theme color
            if (themeColor) {
                submissionData.themeColor = ''; // clear theme to avoid confusion (image takes precedence)
            }
        }

        console.log('Submitting data to Firestore:', submissionData);

        // Add to Firestore
        const docRef = await addDoc(collection(db, 'poetry-submissions'), submissionData);
        console.log('Document written with ID: ', docRef.id);

        // Reset form
        e.target.reset();
        const contentTextarea = document.getElementById('work-content');
        if (contentTextarea) {
            contentTextarea.disabled = false;
            contentTextarea.placeholder = 'Paste your work here, or upload a file below...';
        }

        // Hide preview if present
        const bgPreview = document.getElementById('background-preview');
        if (bgPreview) {
            bgPreview.style.display = 'none';
            const bgImg = document.getElementById('background-preview-img');
            if (bgImg) bgImg.src = '';
        }

        // Show confirmation message
        showConfirmationMessage('Your work has been submitted successfully!');

        // Reload recent works
        await loadRecentWorks();

    } catch (error) {
        console.error('Error submitting work:', error);
        alert(`Error: ${error.message || error}`);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Load and display recent works
async function loadRecentWorks() {
    console.log('Loading recent works...');

    if (!worksContainer) {
        console.error('Works container not found');
        return;
    }

    worksContainer.innerHTML = '<p class="loading-message">Loading poetry submissions...</p>';

    try {
        const collectionRef = collection(db, 'poetry-submissions');
        console.log('Collection reference created');

        let snapshot;

        try {
            // First try with ordering by timestamp
            console.log('Attempting ordered query...');
            const orderedQuery = query(
                collectionRef, 
                orderBy('timestamp', 'desc'),
                limit(20)
            );
            snapshot = await getDocs(orderedQuery);
            console.log('Ordered query successful, found:', snapshot.size, 'documents');
        } catch (orderError) {
            console.log('Ordered query failed, trying basic query...', orderError.message);
            // Fallback to basic query without ordering
            const basicQuery = query(collectionRef, limit(20));
            snapshot = await getDocs(basicQuery);
            console.log('Basic query successful, found:', snapshot.size, 'documents');
        }

        if (snapshot.empty) {
            console.log('No documents found in collection');
            worksContainer.innerHTML = `
                <div class="no-submissions">
                    <p>No poetry submissions yet.</p>
                    <p>Be the first to share your creative work!</p>
                </div>
            `;
            return;
        }

        // Log what we found
        console.log(`Found ${snapshot.size} documents:`);
        snapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`${index + 1}. ${data.title} by ${data.authorName}`);
        });

        displayWorks(snapshot);

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


// Helper function to display individual work cards (replaces previous implementation)

function createWorkCard(work, id) {
    const card = document.createElement('div');
    card.className = 'work-card';

    // Container for readable text above overlays
    const contentWrap = document.createElement('div');
    contentWrap.className = 'card-content';

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
        // FIX: Check if the timestamp object has the .toDate() method,
        // which ensures it's a valid Firestore Timestamp object, not a pending one.
        if (typeof timestamp !== 'object' || !timestamp.toDate) {
             return 'Pending...'; // Or 'Recently' if you prefer
        }
        
        try {
            const date = timestamp.toDate();
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            console.error('Date formatting error:', e);
            return 'Recently';
        }
    };

    const previewHTML = hasFile ?
        `<p class="work-preview"><em>📄 File: ${fileName}</em></p>` :
        `<p class="work-preview">${content.substring(0, 150)}${content.length > 150 ? '...' : ''}</p>`;

    // Build the inner HTML inside contentWrap
    contentWrap.innerHTML = `
        <h3>${title}</h3>
        <div class="work-meta">
            <span class="work-type ${type.toLowerCase().replace('-', '-')}">${type.replace('-', ' ')}</span>
            <span>${formatDate(work.timestamp)}</span>
        </div>
        <p class="work-author">by ${authorName}</p>
        ${previewHTML}
        ${description ? `<p class="work-description">${description}</p>` : ''}
    `;

    // Append readable content
    card.appendChild(contentWrap);

    // If themeColor exists, apply that class
    if (work.themeColor) {
        card.classList.add(work.themeColor);
    }

    // If background image exists, apply inline background and add overlay class
    if (work.backgroundImageURL) {
        card.style.backgroundImage = `url(${work.backgroundImageURL})`;
        card.classList.add('bg-image');
        // add a semi-transparent overlay for legibility
        const overlay = document.createElement('div');
        overlay.className = 'card-overlay';
        card.appendChild(overlay);
    }

    // Add read more link for content or file viewing
    if ((content && !hasFile) || hasFile) {
        const readMoreLink = document.createElement('a');
        readMoreLink.href = '#';
        readMoreLink.className = 'read-more';
        readMoreLink.textContent = hasFile ? 'View File' : 'Read More';

        readMoreLink.addEventListener('click', (e) => {
            e.preventDefault();
            viewWork(work);
        });

        contentWrap.appendChild(readMoreLink);
    }

    return card;
}

// Function to view work in modal (replaces previous implementation)
function viewWork(work) {
    const modal = document.getElementById('work-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    const modalTitleEl = document.getElementById('modal-title');
    const modalAuthorEl = document.getElementById('modal-author');
    const typeBadge = document.getElementById('modal-type');
    const modalBody = document.getElementById('modal-body');

    // Reset classes / inline styles
    modalContent.className = 'modal-content';
    modalContent.style.background = '';
    modalContent.style.backgroundImage = '';
    modalContent.style.color = '';

    // Title & author
    modalTitleEl.textContent = work.title || 'Untitled';
    modalAuthorEl.textContent = `by ${work.authorName || 'Unknown'}`;

    // Type badge
    typeBadge.textContent = work.type || 'Other';
    typeBadge.className = `work-type ${work.type?.toLowerCase().replace(' ', '-').replace('-', '-') || 'other'}`;

    // If background image present, show image as modal background and place content above it
    if (work.backgroundImageURL) {
        modalContent.classList.add('bg-image');
        modalContent.style.backgroundImage = `url(${work.backgroundImageURL})`;
        // ensure text is readable
        modalBody.style.color = '#fff';
        // If content is a file, link it
        if (work.hasFile) {
            modalBody.innerHTML = `<em>📄 File: ${work.fileName || 'Unknown file'}</em><br><br>This is a file submission. <a href="${work.fileURL}" target="_blank">Click here to open the file</a>.`;
        } else {
            modalBody.innerHTML = work.content || '<em>No content available</em>';
        }
    } else if (work.themeColor) {
        // Apply theme class to modal content for consistent style
        modalContent.classList.add(work.themeColor);
        modalBody.style.color = ''; // theme controls color
        if (work.hasFile) {
            modalBody.innerHTML = `<em>📄 File: ${work.fileName || 'Unknown file'}</em><br><br>This is a file submission. <a href="${work.fileURL}" target="_blank">Click here to open the file</a>.`;
        } else {
            modalBody.innerHTML = work.content || '<em>No content available</em>';
        }
    } else {
        // Default behavior (no theme, no bg)
        modalBody.innerHTML = work.hasFile
            ? `<em>📄 File: ${work.fileName || 'Unknown file'}</em><br><br>This is a file submission. <a href="${work.fileURL}" target="_blank">Click here to open the file</a>.`
            : (work.content || '<em>No content available</em>');
    }

    // show modal
    modal.style.display = 'flex';

    // Close modal handlers
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => modal.style.display = 'none';

    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
}    

// Make loadRecentWorks globally accessible for retry button
window.loadRecentWorks = loadRecentWorks;

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
    console.log('DOM Content Loaded');
    
    // Set up auth modal triggers
    const authLinks = document.querySelectorAll('.open-auth-modal');
    authLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.style.display = 'flex';
            }
        });
    });
    
    // Load recent works when the page loads
    setTimeout(() => {
        console.log('Loading works after timeout');
        loadRecentWorks();
    }, 1000);
});

// Test Firebase connection
console.log('Testing Firebase connection...');
console.log('Auth:', auth);
console.log('DB:', db);
console.log('Storage:', storage);