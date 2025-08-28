// scripts/poetry-submissions.js
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

// Auth state listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateUI();
    if (user) {
        loadRecentWorks();
    }
});

// Update UI based on auth state
function updateUI() {
    if (currentUser) {
        authRequired.style.display = 'none';
        submissionForm.style.display = 'block';
        setupSubmissionForm();
    } else {
        authRequired.style.display = 'block';
        submissionForm.style.display = 'none';
    }
}

// Setup submission form
function setupSubmissionForm() {
    submissionForm.addEventListener('submit', handleSubmission);
    
    // File input change handler
    const fileInput = document.getElementById('work-file');
    const contentTextarea = document.getElementById('work-content');
    
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

// Handle form submission
async function handleSubmission(e) {
    e.preventDefault();
    
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
            status: 'pending', // pending, approved, rejected
            likes: 0,
            views: 0
        };
        
        // Handle file upload or text content
        if (file && file.size > 0) {
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
        
        // Add to Firestore
        await addDoc(collection(db, 'poetry-submissions'), submissionData);
        
        // Reset form
        e.target.reset();
        document.getElementById('work-content').disabled = false;
        document.getElementById('work-content').placeholder = 'Paste your work here, or upload a file below...';
        
        alert('Your work has been submitted successfully! It will be reviewed before being published.');
        
        // Reload recent works
        loadRecentWorks();
        
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
    try {
        const q = query(
            collection(db, 'poetry-submissions'),
            orderBy('timestamp', 'desc'),
            limit(6)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            worksContainer.innerHTML = '<p class="loading-message">No submissions yet. Be the first to share your creative work!</p>';
            return;
        }
        
        worksContainer.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const work = doc.data();
            const workCard = createWorkCard(work, doc.id);
            worksContainer.appendChild(workCard);
        });
        
    } catch (error) {
        console.error('Error loading recent works:', error);
        worksContainer.innerHTML = '<p class="loading-message">Error loading submissions. Please try again later.</p>';
    }
}

// Create work card element
function createWorkCard(work, id) {
    const card = document.createElement('div');
    card.className = 'work-card';
    
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Recently';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };
    
    const preview = work.hasFile ? 
        `<p class="work-preview"><em>File: ${work.fileName}</em></p>` :
        `<p class="work-preview">${work.content.substring(0, 150)}${work.content.length > 150 ? '...' : ''}</p>`;
    
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

// View full work (placeholder for modal or separate page)
window.viewWork = function(workId) {
    // For now, just show an alert. Later, implement a modal or navigate to full view
    alert('Full work viewing will be implemented in the next phase.');
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Set up auth modal triggers
    const authLinks = document.querySelectorAll('.open-auth-modal');
    authLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Trigger auth modal - this should be handled by your existing auth modal script
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.style.display = 'flex';
            }
        });
    });
    
    // If user is already logged in, load works
    if (currentUser) {
        loadRecentWorks();
    }
});