// scripts/dynamic-article-loader.js
// Dynamically loads and renders individual article content from Firebase

import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

class DynamicArticleLoader {
  constructor() {
    this.articleId = null;
    this.articleData = null;
    this.articleBody = null;

    this.init();
  }

  init() {
    // Get article ID from URL query parameters
    this.articleId = this.getArticleId();
    
    console.log('Article ID from URL:', this.articleId);

    if (!this.articleId) {
      this.showError('No article found');
      return;
    }

    // Get DOM elements
    this.articleBody = document.querySelector('.article-body');

    if (!this.articleBody) {
      console.warn('Article body container not found');
      return;
    }

    // Load and render the article
    this.loadArticle();
  }

  getArticleId() {
    // Extract article ID from URL query parameters
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  async loadArticle() {
    try {
      // Show loading state
      this.articleBody.innerHTML = '<div class="loading">Loading article...</div>';

      // Fetch article from Firestore
      const articleRef = doc(db, 'article-submissions', this.articleId);
      const articleSnap = await getDoc(articleRef);

      if (!articleSnap.exists()) {
        this.showError('Article not found');
        return;
      }

      this.articleData = {
        id: articleSnap.id,
        ...articleSnap.data()
      };

      console.log('Article loaded:', this.articleData);

      // Render the article
      this.renderArticle();

    } catch (error) {
      console.error('Error loading article:', error);
      this.showError('Failed to load article: ' + error.message);
    }
  }

  renderArticle() {
    if (!this.articleData) return;

    const {
      title,
      subtitle,
      author,
      bannerImage,
      introLead,
      introText,
      sections = [],
      conclusionHeading,
      conclusionText,
      references,
      topics = [],
      submittedAt,
      readTime,
      views = 0
    } = this.articleData;

    // Format date
    const date = submittedAt?.toDate ? submittedAt.toDate() : new Date();
    const formattedDate = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Build article HTML
    let html = '';

    // Banner image if exists
    if (bannerImage) {
      html += `<img src="${bannerImage}" alt="${title}" class="article-banner">`;
    }

    // Article header
    html += `
      <div class="article-header">
        <h1 class="article-title">${this.escapeHtml(title)}</h1>
        ${subtitle ? `<p class="article-subtitle">${this.escapeHtml(subtitle)}</p>` : ''}
        <div class="article-meta">
          <span><strong>By</strong> ${this.escapeHtml(author)}</span>
          <span>${formattedDate}</span>
          ${readTime ? `<span class="article-read-time">📖 ${readTime}</span>` : ''}
          <span>👁️ ${views} views</span>
        </div>
      </div>
    `;

    // Topics/tags
    if (topics.length > 0) {
      html += `
        <div class="article-topics">
          <span><strong>Topics:</strong></span>
          ${topics.map(topic => `<span>${this.escapeHtml(topic)}</span>`).join('')}
        </div>
      `;
    }

    // Intro section
    if (introLead) {
      html += `
        <div class="article-intro">
          <p class="drop-cap">${this.escapeHtml(introLead)}</p>
          ${introText ? `<p>${this.escapeHtml(introText)}</p>` : ''}
        </div>
      `;
    }

    // Main content sections
    if (sections.length > 0) {
      sections.forEach(section => {
        html += `
          <section>
            <h2>${this.escapeHtml(section.heading)}</h2>
            <p>${this.escapeHtml(section.content)}</p>
          </section>
        `;
      });
    }

    // Conclusion
    if (conclusionText) {
      html += `
        <div class="article-conclusion">
          <h2>${this.escapeHtml(conclusionHeading || 'Conclusion')}</h2>
          <p>${this.escapeHtml(conclusionText)}</p>
        </div>
      `;
    }

    // References
    if (references) {
      html += `
        <div class="article-references">
          <h3>References</h3>
          <div class="references-list">
            ${references
              .split('\n')
              .filter(ref => ref.trim())
              .map(ref => `<div class="reference">${this.escapeHtml(ref.trim())}</div>`)
              .join('')
            }
          </div>
        </div>
      `;
    }

    // Render to DOM
    this.articleBody.innerHTML = html;

    // Update page title
    document.title = `${title} | LSIF`;
  }

  showError(message) {
    if (this.articleBody) {
      this.articleBody.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #dc2626;">
          <h2>${message}</h2>
          <p><a href="/law-students-forum-website/pages/student-articles.html">← Back to Articles</a></p>
        </div>
      `;
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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