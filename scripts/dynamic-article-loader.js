// scripts/dynamic-article-loader.js
// Loads and displays articles from Firebase in the ai-the-new-oracle style

import { db } from './firebase-config.js';
import { 
  collection, 
  doc,
  getDoc,
  query, 
  where,
  getDocs,
  orderBy 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

class DynamicArticleLoader {
  constructor() {
    this.articleId = null;
    this.articleData = null;
    
    this.init();
  }

  init() {
    // Get article ID from URL parameters
    const params = new URLSearchParams(window.location.search);
    this.articleId = params.get('id');

    if (!this.articleId) {
      this.showError('No article ID provided');
      return;
    }

    this.loadArticle();
  }

  async loadArticle() {
    try {
      // Show loading state
      document.body.style.opacity = '0.5';

      // Fetch article from Firebase
      const articleRef = doc(db, 'article-submissions', this.articleId);
      const articleSnap = await getDoc(articleRef);

      if (!articleSnap.exists()) {
        this.showError('Article not found');
        return;
      }

      this.articleData = articleSnap.data();

      // Check if article is published
      if (this.articleData.status !== 'published') {
        this.showError('This article is not yet published');
        return;
      }

      // Render the article
      this.renderArticle();

      // Hide loading state
      document.body.style.opacity = '1';

    } catch (error) {
      console.error('Error loading article:', error);
      this.showError('Failed to load article');
    }
  }

  renderArticle() {
    const data = this.articleData;

    // Set page title
    document.title = `${data.title} | LSIF`;

    // Render hero section
    this.renderHero(data);

    // Render introduction
    this.renderIntroduction(data);

    // Render sections
    this.renderSections(data);

    // Render conclusion
    this.renderConclusion(data);

    // Render references
    if (data.references) {
      this.renderReferences(data);
    }

    // Render topics
    this.renderTopics(data);
  }

  renderHero(data) {
    const heroHTML = `
      <header class="article-hero">
        ${data.bannerImage ? `
          <img src="${data.bannerImage}" 
               alt="${data.title}" 
               class="article-hero-banner" />
        ` : ''}
        
        <div class="article-hero-content">
          <h1 class="article-title">${this.escapeHtml(data.title)}</h1>
          ${data.subtitle ? `
            <p class="article-subtitle">
              ${this.escapeHtml(data.subtitle)}
            </p>
          ` : ''}
          <div class="article-meta">
            <span><strong>Author:</strong> ${this.escapeHtml(data.author)}</span>
            <span><strong>Published:</strong> ${this.formatDate(data.publishedAt || data.submittedAt)}</span>
            <span><strong>Reading Time:</strong> ${data.readTime || '5 min read'}</span>
          </div>
        </div>
      </header>
    `;

    const articleContent = document.querySelector('.article-content');
    articleContent.insertAdjacentHTML('afterbegin', heroHTML);
  }

  renderIntroduction(data) {
    const introHTML = `
      <section class="article-intro">
        <p class="lead-paragraph drop-cap">
          ${this.formatParagraphs(data.introLead)[0]}
        </p>
        
        ${data.introText ? `
          <p class="intro-text">
            ${this.formatParagraphs(data.introText).join('</p><p class="intro-text">')}
          </p>
        ` : ''}
      </section>
    `;

    document.querySelector('.article-body').insertAdjacentHTML('beforeend', introHTML);
  }

  renderSections(data) {
    if (!data.sections || data.sections.length === 0) return;

    data.sections.forEach(section => {
      const sectionHTML = `
        <section class="article-section">
          <h2 class="section-heading">${this.escapeHtml(section.heading)}</h2>
          ${this.formatParagraphs(section.content).map(p => 
            `<p>${p}</p>`
          ).join('')}
        </section>
      `;

      document.querySelector('.article-body').insertAdjacentHTML('beforeend', sectionHTML);
    });
  }

  renderConclusion(data) {
    const conclusionHTML = `
      <section class="article-conclusion">
        <h2 class="conclusion-heading">${this.escapeHtml(data.conclusionHeading)}</h2>
        ${this.formatParagraphs(data.conclusionText).map(p => 
          `<p class="conclusion-text">${p}</p>`
        ).join('')}
      </section>
    `;

    document.querySelector('.article-body').insertAdjacentHTML('beforeend', conclusionHTML);
  }

  renderReferences(data) {
    const references = data.references.split('\n').filter(ref => ref.trim());
    
    if (references.length === 0) return;

    const referencesHTML = `
      <section class="article-references">
        <h2 class="references-heading">References & Further Reading</h2>
        <div class="references-grid">
          ${references.map((ref, index) => `
            <div class="reference-item">
              <span class="ref-number">[${index + 1}]</span>
              <p>${this.escapeHtml(ref.trim())}</p>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    document.querySelector('.article-body').insertAdjacentHTML('beforeend', referencesHTML);
  }

  renderTopics(data) {
    if (!data.topics || data.topics.length === 0) return;

    const topicsHTML = `
      <div class="article-topics">
        <span class="topics-label">Topics:</span>
        ${data.topics.map(topic => 
          `<span class="topic-tag">${this.escapeHtml(topic)}</span>`
        ).join('')}
      </div>
    `;

    document.querySelector('.article-body').insertAdjacentHTML('beforeend', topicsHTML);
  }

  formatParagraphs(text) {
    if (!text) return [];
    return text.split('\n\n')
               .map(p => p.trim())
               .filter(p => p.length > 0)
               .map(p => this.escapeHtml(p));
  }

  formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    const articleContent = document.querySelector('.article-content');
    if (articleContent) {
      articleContent.innerHTML = `
        <div style="text-align: center; padding: 4rem 2rem;">
          <h2 style="color: #dc2626; margin-bottom: 1rem;">Error</h2>
          <p style="color: #6b7280; font-size: 1.1rem;">${message}</p>
          <a href="/law-students-forum-website/pages/student-articles.html" 
             style="display: inline-block; margin-top: 2rem; padding: 0.75rem 1.5rem; 
                    background: #1e3a8a; color: white; text-decoration: none; 
                    border-radius: 0.5rem; font-weight: 600;">
            ← Back to Articles
          </a>
        </div>
      `;
    }
    document.body.style.opacity = '1';
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DynamicArticleLoader();
  });
} else {
  new DynamicArticleLoader();
}

export default DynamicArticleLoader;