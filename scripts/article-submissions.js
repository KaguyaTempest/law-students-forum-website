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
    // Check authentication
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (!user) {
        alert('Please log in to submit an article');
        window.location.href = '/law-students-forum-website/index.html';
      }
    });

    // Set up form elements
    this.setupImageUpload();
    this.setupTopicInput();
    this.setupSectionManagement();
    this.setupFormSubmission();

    // Add initial section
    this.addSection();
  }

  setupImageUpload() {
    const uploadArea = document.getElementById('image-upload-area');
    const fileInput = document.getElementById('banner-image');
    const preview = document.getElementById('image-preview');

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

  setupTopicInput() {
    const topicInput = document.getElementById('topic-input');
    const addTopicBtn = document.getElementById('add-topic-btn');
    const topicsContainer = document.getElementById('topics-container');

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

  setupSectionManagement() {
    const addSectionBtn = document.getElementById('add-section-btn');
    addSectionBtn.addEventListener('click', () => this.addSection());
  }

  addSection() {
    this.sectionCount++;
    const container = document.getElementById('content-sections-container');
    
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
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.currentUser) {
      alert('Please log in to submit an article');
      return;
    }

    if (this.topics.length < 3) {
      alert('Please add at least 3 topics');
      return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      // Collect form data
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
      submitBtn.textContent = 'Submit Article for Review';
    }
  }

  async collectFormData() {
    const data = {
      // Basic info
      title: document.getElementById('article-title').value.trim(),
      subtitle: document.getElementById('article-subtitle').value.trim(),
      author: document.getElementById('article-author').value.trim(),
      
      // Introduction
      introLead: document.getElementById('intro-paragraph').value.trim(),
      introText: document.getElementById('intro-text').value.trim(),
      
      // Sections
      sections: this.collectSections(),
      
      // Conclusion
      conclusionHeading: document.getElementById('conclusion-heading').value.trim() || 'Conclusion',
      conclusionText: document.getElementById('conclusion-text').value.trim(),
      
      // References
      references: document.getElementById('references').value.trim(),
      
      // Topics
      topics: this.topics,
      
      // Metadata
      submittedBy: this.currentUser.uid,
      submittedByEmail: this.currentUser.email,
      submittedAt: serverTimestamp(),
      status: 'pending',
      readTime: this.calculateReadTime()
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
    totalWords += this.countWords(document.getElementById('conclusion-text').value);
    
    // Average reading speed: 200 words per minute
    const minutes = Math.ceil(totalWords / 200);
    return `${minutes} min read`;
  }

  countWords(text) {
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