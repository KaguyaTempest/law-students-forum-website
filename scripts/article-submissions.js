// scripts/article-submission.js
// Handles article submission form and Firebase storage

import { auth, db, storage } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

class ArticleSubmissionForm {
    constructor() {
        this.currentUser = null;
        this.selectedImage = null;
        this.topics = [];
        this.sectionCount = 0;

        this.init();
    }

    init() {
        // Check authentication state first before setting up the form
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            if (user) {
                // User is logged in, proceed to setup form functionality
                this.setupFormFunctionality();
            } else {
                // User is not logged in, alert and redirect (assuming this is a dedicated submission page)
                alert('You must be logged in to submit an article');
                window.location.href = '/law-students-forum-website/index.html';
            }
        });
    }

    setupFormFunctionality() {
        // Set up form elements
        this.setupImageUpload();
        this.setupTopicInput();
        this.setupSectionManagement();
        this.setupFormSubmission();

        // Add initial section
        if (document.getElementById('content-sections-container')) {
            this.addSection();
        }
    }

    // --- Image Upload Setup (No Changes Needed) ---

    setupImageUpload() {
        const uploadArea = document.getElementById('image-upload-area');
        const fileInput = document.getElementById('banner-image');
        const preview = document.getElementById('image-preview');
        
        if (!fileInput || !uploadArea || !preview) return; // Check if elements exist

        uploadArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image must be less than 5MB');
                    return;
                }

                this.selectedImage = file;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#1e3a8a';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#cbd5e1';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#cbd5e1';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                fileInput.files = e.dataTransfer.files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });
    }

    // --- Topic Management (No Changes Needed) ---

    setupTopicInput() {
        const topicInput = document.getElementById('topic-input');
        const addTopicBtn = document.getElementById('add-topic-btn');
        const topicsContainer = document.getElementById('topics-container');

        if (!topicInput || !addTopicBtn || !topicsContainer) return;

        const addTopic = () => {
            const topic = topicInput.value.trim();
            if (topic && !this.topics.includes(topic)) {
                this.topics.push(topic);
                this.renderTopics();
                topicInput.value = '';
            }
        };

        addTopicBtn.addEventListener('click', addTopic);
        
        topicInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTopic();
            }
        });
    }

    renderTopics() {
        const topicsContainer = document.getElementById('topics-container');
        if (!topicsContainer) return;

        topicsContainer.innerHTML = this.topics.map((topic, index) => `
            <div class="topic-tag">
                <span>${topic}</span>
                <span class="remove-topic" data-index="${index}">×</span>
            </div>
        `).join('');

        // Add remove listeners
        document.querySelectorAll('.remove-topic').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.topics.splice(index, 1);
                this.renderTopics();
            });
        });
    }

    // --- Section Management (No Changes Needed) ---

    setupSectionManagement() {
        const addSectionBtn = document.getElementById('add-section-btn');
        if (addSectionBtn) {
            addSectionBtn.addEventListener('click', () => this.addSection());
        }
    }

    addSection() {
        this.sectionCount++;
        const container = document.getElementById('content-sections-container');
        if (!container) return; // Prevent error if container is missing
        
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'content-section-item';
        sectionDiv.dataset.sectionId = this.sectionCount;
        
        sectionDiv.innerHTML = `
            <div class="content-section-header">
                <span class="section-number">Section ${this.sectionCount}</span>
                <button type="button" class="remove-section-btn" data-section="${this.sectionCount}">
                    Remove
                </button>
            </div>
            
            <div class="form-group">
                <label>Section Heading *</label>
                <input type="text" class="section-heading" required 
                       placeholder="Enter section heading">
            </div>
            
            <div class="form-group">
                <label>Section Content *</label>
                <textarea class="section-content" required rows="8"
                          placeholder="Write the content for this section..."></textarea>
                <small>Use clear paragraphs. Line breaks will be preserved.</small>
            </div>
        `;

        container.appendChild(sectionDiv);

        // Add remove listener
        sectionDiv.querySelector('.remove-section-btn').addEventListener('click', (e) => {
            const sectionId = e.target.dataset.section;
            this.removeSection(sectionId);
        });
    }

    removeSection(sectionId) {
        const section = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (section) {
            section.remove();
            this.renumberSections();
        }
    }

    renumberSections() {
        const sections = document.querySelectorAll('.content-section-item');
        sections.forEach((section, index) => {
            const number = index + 1;
            section.querySelector('.section-number').textContent = `Section ${number}`;
        });
    }

    setupFormSubmission() {
        const form = document.getElementById('article-submission-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    // --- Core Submission Logic (FIXED) ---

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.currentUser) {
            alert('Session expired. Please log in again.');
            return;
        }

        if (this.topics.length < 3) {
            alert('Please add at least 3 topics');
            return;
        }

        const sections = this.collectSections();
        if (sections.length === 0) {
            alert('Please add at least one main content section.');
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            // Collect form data, including image upload
            const articleData = await this.collectFormData();

            // Submit to Firebase
            await addDoc(collection(db, 'article-submissions'), articleData);

            // Show success message
            document.getElementById('success-message').style.display = 'block';
            document.getElementById('article-submission-form').style.display = 'none';
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Reset form after 3 seconds
            setTimeout(() => {
                window.location.reload();
            }, 3000);

        } catch (error) {
            console.error('Error submitting article:', error);
            alert('Failed to submit article: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async collectFormData() {
        const data = {
            // Basic info
            title: document.getElementById('article-title').value.trim(),
            subtitle: document.getElementById('article-subtitle').value.trim(),
            author: document.getElementById('article-author').value.trim(),
            
            // FIX: Add Category (must assume this element exists in your form HTML)
            category: document.getElementById('article-category')?.value.trim() || 'general',
            
            // FIX: Add Slug generation for SEO-friendly URLs
            slug: this.generateSlug(document.getElementById('article-title').value.trim()),
            
            // Introduction
            introLead: document.getElementById('intro-paragraph').value.trim(),
            introText: document.getElementById('intro-text').value.trim(),
            
            // Sections
            sections: this.collectSections(),
            
            // Conclusion
            conclusionHeading: document.getElementById('conclusion-heading')?.value.trim() || 'Conclusion',
            conclusionText: document.getElementById('conclusion-text').value.trim(),
            
            // References
            references: document.getElementById('references').value.trim(),
            
            // Topics
            topics: this.topics,
            
            // Metadata
            submittedBy: this.currentUser.uid,
            submittedByEmail: this.currentUser.email,
            submittedAt: serverTimestamp(),
            status: 'pending', // IMPORTANT: Always start as pending review
            readTime: this.calculateReadTime(),
            views: 0, // Initialize views
        };

        // Upload image if provided
        if (this.selectedImage) {
            data.bannerImage = await this.uploadImage();
        }

        return data;
    }

    collectSections() {
        const sections = [];
        const sectionElements = document.querySelectorAll('.content-section-item');
        
        sectionElements.forEach(element => {
            const heading = element.querySelector('.section-heading').value.trim();
            const content = element.querySelector('.section-content').value.trim();
            
            if (heading && content) {
                sections.push({ heading, content });
            }
        });

        return sections;
    }

    async uploadImage() {
        if (!this.selectedImage) return null;

        try {
            const timestamp = Date.now();
            const filename = `article-banners/${timestamp}-${this.selectedImage.name}`;
            const storageRef = ref(storage, filename);
            
            await uploadBytes(storageRef, this.selectedImage);
            const url = await getDownloadURL(storageRef);
            
            return url;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error('Failed to upload banner image');
        }
    }

    // --- Utility Functions (NEW: Slug Generation) ---

    generateSlug(title) {
        return title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars except space and hyphen
            .trim()
            .replace(/\s+/g, '-') // Replace spaces with hyphen
            .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    }

    // --- Utility Functions (Read Time) ---
    
    calculateReadTime() {
        let totalWords = 0;
        
        // Count intro words
        totalWords += this.countWords(document.getElementById('intro-paragraph').value);
        totalWords += this.countWords(document.getElementById('intro-text').value);
        
        // Count section words
        document.querySelectorAll('.section-content').forEach(textarea => {
            totalWords += this.countWords(textarea.value);
        });
        
        // Count conclusion words
        const conclusionEl = document.getElementById('conclusion-text');
        if (conclusionEl) {
             totalWords += this.countWords(conclusionEl.value);
        }
        
        // Average reading speed: 200 words per minute
        const minutes = Math.ceil(totalWords / 200);
        return `${minutes} min read`;
    }

    countWords(text) {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ArticleSubmissionForm();
    });
} else {
    new ArticleSubmissionForm();
}