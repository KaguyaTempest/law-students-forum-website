// scripts/art-submissions.js
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
    getDoc,
    where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

let currentUser = null;
let allArtworks = [];

// DOM elements
const authRequired = document.getElementById('auth-required');
const submissionForm = document.getElementById('art-submission-form');
const galleryContainer = document.getElementById('gallery-container');
const filterButtons = document.querySelectorAll('.filter-btn');

// Auth state listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateUI();
    if (user) {
        loadGallery();
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
}

// Handle form submission
async function handleSubmission(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Please log in to submit your artwork.');
        return;
    }
    
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Uploading...';
    submitBtn.disabled = true;
    
    try {
        const formData = new FormData(e.target);
        const title = formData.get('title').trim();
        const medium = formData.get('medium');
        const dimensions = formData.get('dimensions').trim();
        const description = formData.get('description').trim();
        const year = formData.get('year');
        const isAnonymous = formData.get('anonymous') === 'on';
        const file = formData.get('file');
        
        // Validation
        if (!title || !medium) {
            throw new Error('Please fill in all required fields.');
        }
        
        if (!file || file.size === 0) {
            throw new Error('Please upload an image of your artwork.');
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('File size must be less than 10MB.');
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Please upload a valid image file (JPG, PNG, GIF) or PDF.');
        }
        
        // Get user profile for author info
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        // Upload file to Firebase Storage
        const fileRef = ref(storage, `art-submissions/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(fileRef, file);
        const imageURL = await getDownloadURL(uploadResult.ref);
        
        // Prepare submission data
        const submissionData = {
            title,
            medium,
            dimensions: dimensions || '',
            description,
            year: year ? parseInt(year) : new Date().getFullYear(),
            authorId: currentUser.uid,
            authorName: isAnonymous ? 'Anonymous' : (userData.username || currentUser.email),
            authorUniversity: isAnonymous ? '' : (userData.university || ''),
            isAnonymous,
            imageURL,
            fileName: file.name,
            fileType: file.type,
            timestamp: serverTimestamp(),
            status: 'pending', // pending, approved, rejected
            likes: 0,
            views: 0
        };
        
        // Add to Firestore
        await addDoc(collection(db, 'art-submissions'), submissionData);
        
        // Reset form
        e.target.reset();
        
        alert('Your artwork has been submitted successfully! It will be reviewed before being published.');
        
        // Reload gallery
        loadGallery();
        
    } catch (error) {
        console.error('Error submitting artwork:', error);
        alert(`Error: ${error.message}`);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Load and display gallery
async function loadGallery(filterMedium = 'all') {
    try {
        let q = query(
            collection(db, 'art-submissions'),
            orderBy('timestamp', 'desc'),
            limit(20)
        );
        
        // Apply filter if not 'all'
        if (filterMedium !== 'all') {
            q = query(
                collection(db, 'art-submissions'),
                where('medium', '==', filterMedium),
                orderBy('timestamp', 'desc'),
                limit(20)
            );
        }
        
        const querySnapshot = await getDocs(q);
        
        allArtworks = [];
        querySnapshot.forEach((doc) => {
            allArtworks.push({ id: doc.id, ...doc.data() });
        });
        
        displayArtworks(allArtworks);
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        galleryContainer.innerHTML = '<p class="loading-message">Error loading gallery. Please try again later.</p>';
    }
}

// Display artworks in gallery
function displayArtworks(artworks) {
    if (artworks.length === 0) {
        galleryContainer.innerHTML = '<p class="loading-message">No artworks found. Be the first to share your creative work!</p>';
        return;
    }
    
    galleryContainer.innerHTML = '';
    
    artworks.forEach((artwork) => {
        const artworkCard = createArtworkCard(artwork);
        galleryContainer.appendChild(artworkCard);
    });
}

// Create artwork card element
function createArtworkCard(artwork) {
    const card = document.createElement('div');
    card.className = 'artwork-card';
    card.dataset.medium = artwork.medium;
    
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Recent';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.getFullYear();
    };
    
    card.innerHTML = `
        <img src="${artwork.imageURL}" alt="${artwork.title}" class="artwork-image" loading="lazy">
        <div class="artwork-info">
            <h3 class="artwork-title">${artwork.title}</h3>
            <div class="artwork-meta">
                <span class="artwork-medium">${artwork.medium.replace('-', ' ')}</span>
                <span class="artwork-date">${artwork.year || formatDate(artwork.timestamp)}</span>
            </div>
            <p class="artwork-artist">by ${artwork.authorName}</p>
            ${artwork.dimensions ? `<p class="artwork-dimensions">${artwork.dimensions}</p>` : ''}
            ${artwork.description ? `<p class="artwork-description">${artwork.description}</p>` : ''}
        </div>
    `;
    
    // Add click handler for modal view
    card.addEventListener('click', () => openArtworkModal(artwork));
    
    return card;
}

// Open artwork in modal
function openArtworkModal(artwork) {
    // Create or get modal
    let modal = document.getElementById('artwork-modal');
    if (!modal) {
        modal = createArtworkModal();
        document.body.appendChild(modal);
    }
    
    // Update modal content
    const modalImage = modal.querySelector('.modal-image');
    const modalInfo = modal.querySelector('.modal-info');
    
    modalImage.src = artwork.imageURL;
    modalImage.alt = artwork.title;
    
    modalInfo.innerHTML = `
        <h3>${artwork.title}</h3>
        <p><strong>Medium:</strong> ${artwork.medium.replace('-', ' ')}</p>
        <p><strong>Artist:</strong> ${artwork.authorName}</p>
        ${artwork.dimensions ? `<p><strong>Dimensions:</strong> ${artwork.dimensions}</p>` : ''}
        ${artwork.year ? `<p><strong>Year Created:</strong> ${artwork.year}</p>` : ''}
        ${artwork.description ? `<p><strong>Artist Statement:</strong> ${artwork.description}</p>` : ''}
    `;
    
    // Display modal
    modal.style.display = 'flex';
    
    // Add event listener to close modal
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Helper function to create the modal structure
function createArtworkModal() {
    const modal = document.createElement('div');
    modal.id = 'artwork-modal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <img class="modal-image" src="" alt="Artwork">
            <div class="modal-info"></div>
        </div>
    `;
    
    return modal;
}

// Filter button event listeners
filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        e.target.classList.add('active');
        
        const filterMedium = e.target.dataset.medium;
        loadGallery(filterMedium);
    });
});

// Initial gallery load
document.addEventListener('DOMContentLoaded', () => {
    // Check auth state to determine if gallery should load
    if (auth.currentUser) {
        loadGallery();
    }
});