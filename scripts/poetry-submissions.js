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

// Setup submission form
function setupSubmissionForm() {
    if (!submissionForm) return;
    
    // Remove existing event listeners to prevent duplicates
    submissionForm.removeEventListener('submit', handleSubmission);
    submissionForm.addEventListener('submit', handleSubmission);
    
    // File input change handler
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
        
        console.log('Form data:', { title, type, content: content.substring(0, 50) + '...', isAnonymous });
        
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
            status: 'approved', // Change to 'approved' for immediate visibility
            likes: 0,
            views: 0
        };
        
        // Handle file upload or text content
        if (file && file.size > 0) {
            console.log('Uploading file:', file.name);
            // Upload file to Firebase Storage
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
        
        alert('Your work has been submitted successfully!');
        
        // Reload recent works
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
// Replace your loadRecentWorks function with this comprehensive debug version
async function loadRecentWorks() {
    console.log('=== COMPREHENSIVE DEBUG START ===');
    
    if (!worksContainer) {
        console.error('Works container not found');
        return;
    }
    
    try {
        // Test 1: Basic collection reference
        console.log('Test 1: Testing basic collection reference...');
        const collectionRef = collection(db, 'poetry-submissions');
        console.log('Collection reference created:', collectionRef);
        
        // Test 2: Simple getDocs without any query constraints
        console.log('Test 2: Simple getDocs without constraints...');
        const basicSnapshot = await getDocs(collectionRef);
        console.log('Basic snapshot size:', basicSnapshot.size);
        console.log('Basic snapshot empty:', basicSnapshot.empty);
        
        if (basicSnapshot.size > 0) {
            console.log('SUCCESS: Documents found with basic query!');
            
            // Log all document data
            basicSnapshot.forEach((doc, index) => {
                const data = doc.data();
                console.log(`Document ${index + 1} (ID: ${doc.id}):`, {
                    title: data.title,
                    type: data.type,
                    authorName: data.authorName,
                    timestamp: data.timestamp,
                    hasContent: !!data.content,
                    hasFile: data.hasFile,
                    status: data.status,
                    allFields: Object.keys(data)
                });
            });
            
            // Test 3: Try query with limit only (no ordering)
            console.log('Test 3: Query with limit only...');
            const limitQuery = query(collectionRef, limit(10));
            const limitSnapshot = await getDocs(limitQuery);
            console.log('Limit query snapshot size:', limitSnapshot.size);
            
            // Test 4: Try query with ordering (this might fail if timestamp field issues)
            console.log('Test 4: Query with ordering...');
            try {
                const orderedQuery = query(
                    collectionRef, 
                    orderBy('timestamp', 'desc'),
                    limit(10)
                );
                const orderedSnapshot = await getDocs(orderedQuery);
                console.log('Ordered query snapshot size:', orderedSnapshot.size);
                
                // Use the ordered results if available, otherwise use basic results
                const finalSnapshot = orderedSnapshot.size > 0 ? orderedSnapshot : basicSnapshot;
                displayWorks(finalSnapshot);
                
            } catch (orderError) {
                console.error('Ordering failed:', orderError);
                console.log('Using basic results without ordering');
                displayWorks(basicSnapshot);
            }
            
        } else {
            console.log('PROBLEM: No documents found with basic query');
            
            // Test 5: Check if collection exists by trying to create a test document
            console.log('Test 5: Collection might not exist or be empty');
            
            // List all collections to see what exists
            console.log('Available collections in your database:');
            // Note: We can't list collections from client-side, but we can check our specific one
            
            worksContainer.innerHTML = '<p class="loading-message">No poetry submissions found. The collection appears to be empty.</p>';
        }
        
    } catch (error) {
        console.error('=== ERROR DETAILS ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        if (error.code === 'permission-denied') {
            console.error('PERMISSION DENIED: Check your Firestore security rules');
            worksContainer.innerHTML = '<p class="loading-message">Permission denied. Security rules may be blocking access.</p>';
        } else if (error.code === 'unavailable') {
            console.error('FIRESTORE UNAVAILABLE: Network or service issue');
            worksContainer.innerHTML = '<p class="loading-message">Firestore service unavailable. Check your internet connection.</p>';
        } else {
            console.error('UNKNOWN ERROR: Check console for details');
            worksContainer.innerHTML = '<p class="loading-message">Unexpected error loading submissions. Check browser console.</p>';
        }
    }
    
    console.log('=== COMPREHENSIVE DEBUG END ===');
}

// Helper function to display works
function displayWorks(snapshot) {
    console.log('Displaying works...');
    worksContainer.innerHTML = '';
    
    if (snapshot.empty) {
        worksContainer.innerHTML = '<p class="loading-message">No submissions to display.</p>';
        return;
    }
    
    let displayCount = 0;
    snapshot.forEach((doc) => {
        const work = doc.data();
        try {
            const workCard = createWorkCard(work, doc.id);
            worksContainer.appendChild(workCard);
            displayCount++;
        } catch (cardError) {
            console.error('Error creating card for document:', doc.id, cardError);
        }
    });
    
    console.log(`Successfully displayed ${displayCount} works`);
}

// Also update your createWorkCard to handle missing data better
function createWorkCard(work, id) {
    const card = document.createElement('div');
    card.className = 'work-card';
    
    // Safely handle all the data fields
    const title = work.title || 'Untitled';
    const type = work.type || 'unknown';
    const authorName = work.authorName || 'Unknown Author';
    const content = work.content || '';
    const description = work.description || '';
    const hasFile = work.hasFile || false;
    const fileName = work.fileName || 'Unknown file';
    
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Recently';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (e) {
            console.error('Date formatting error:', e);
            return 'Recently';
        }
    };
    
    const preview = hasFile ? 
        `<p class="work-preview"><em>📄 File: ${fileName}</em></p>` :
        `<p class="work-preview">${content.substring(0, 150)}${content.length > 150 ? '...' : ''}</p>`;
    
    card.innerHTML = `
        <h3>${title}</h3>
        <div class="work-meta">
            <span class="work-type">${type.replace('-', ' ')}</span>
            <span>${formatDate(work.timestamp)}</span>
        </div>
        <p class="work-author">by ${authorName}</p>
        ${preview}
        ${description ? `<p class="work-description">${description}</p>` : ''}
    `;

    // Only add read more link if there's content to show
    if (content && !hasFile) {
        const readMoreLink = document.createElement('a');
        readMoreLink.href = '#';
        readMoreLink.className = 'read-more';
        readMoreLink.textContent = 'Read More';
        
        readMoreLink.addEventListener('click', (e) => {
            e.preventDefault();
            viewWork(work);
        });

        card.appendChild(readMoreLink);
    }
    
    return card;
}    
                const workCard = createWorkCard(work, doc.id);
            worksContainer.appendChild(workCard);
            displayedCount++;
        });
        
        console.log(`Displayed ${displayedCount} works`);
        
    } catch (error) {
        console.error('Error loading recent works:', error);
        console.error('Error details:', error.message, error.code);
        worksContainer.innerHTML = '<p class="loading-message">Error loading submissions. Please check the console for details.</p>';
    }
}

// Create work card element
function createWorkCard(work, id) {
    const card = document.createElement('div');
    card.className = 'work-card';
    
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Recently';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Recently';
        }
    };
    
    const preview = work.hasFile ? 
        `<p class="work-preview"><em>File: ${work.fileName}</em></p>` :
        `<p class="work-preview">${(work.content || '').substring(0, 150)}${(work.content || '').length > 150 ? '...' : ''}</p>`;
    
    // Add status indicator for debugging
    const statusIndicator = work.status ? `<span class="status-indicator" style="background: ${work.status === 'approved' ? 'green' : 'orange'}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${work.status}</span>` : '';
    
    card.innerHTML = `
        <h3>${work.title || 'Untitled'}</h3>
        <div class="work-meta">
            <span class="work-type">${(work.type || 'unknown').replace('-', ' ')}</span>
            <span>${formatDate(work.timestamp)}</span>
            ${statusIndicator}
        </div>
        <p class="work-author">by ${work.authorName || 'Unknown Author'}</p>
        ${preview}
        ${work.description ? `<p class="work-description">${work.description}</p>` : ''}
    `;

    if (work.content && !work.hasFile) {
        const readMoreLink = document.createElement('a');
        readMoreLink.href = '#';
        readMoreLink.className = 'read-more';
        readMoreLink.textContent = 'Read More';
        
        readMoreLink.addEventListener('click', (e) => {
            e.preventDefault();
            viewWork(work);
        });

        card.appendChild(readMoreLink);
    }
    
    return card;
}

// View full work in a modal
function viewWork(work) {
    const modal = document.getElementById('full-poem-modal');
    if (!modal) {
        console.error('Modal not found');
        return;
    }
    
    const modalTitle = document.getElementById('modal-title');
    const modalAuthor = document.getElementById('modal-author');
    const modalContent = document.getElementById('modal-content');
    
    if (modalTitle) modalTitle.textContent = work.title || 'Untitled';
    if (modalAuthor) modalAuthor.textContent = `by ${work.authorName || 'Unknown Author'}`;
    if (modalContent) modalContent.textContent = work.content || 'No content available';
    
    modal.style.display = 'flex';
    
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
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
