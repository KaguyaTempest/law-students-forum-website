// scripts/admin-articles.js
// Admin dashboard for managing article submissions

import { auth, db } from './firebase-config.js';
import { 
  collection, 
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getUserProfile } from './auth-service.js';

class AdminArticlesManager {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.articles = [];
    this.filteredArticles = [];
    this.currentFilter = 'all';
    this.unsubscribe = null;

    this.init();
  }

  async init() {
    // Check authentication and admin status
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (!user) {
        alert('Please log in to access the admin dashboard');
        window.location.href = '/law-students-forum-website/index.html';
        return;
      }

      try {
        this.userProfile = await getUserProfile(user.uid);
        
        // Check if user is admin (you may need to implement this check)
        if (!this.isAdmin()) {
          alert('Access denied. Admin privileges required.');
          window.location.href = '/law-students-forum-website/index.html';
          return;
        }

        // Load articles
        this.loadArticles();
        this.setupFilterTabs();

      } catch (error) {
        console.error('Error loading user profile:', error);
        alert('Error verifying admin status');
      }
    });
  }

  isAdmin() {
    // Implement your admin check logic here
    // For now, checking if user role is 'admin' or email matches admin list
    return this.userProfile?.role === 'admin' || 
           this.userProfile?.isAdmin === true ||
           this.currentUser?.email === 'admin@lsif.com'; // Replace with your admin email
  }

  loadArticles() {
    const articlesQuery = query(
      collection(db, 'article-submissions'),
      orderBy('submittedAt', 'desc')
    );

    this.unsubscribe = onSnapshot(articlesQuery, (snapshot) => {
      this.articles = [];
      
      snapshot.forEach((doc) => {
        this.articles.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.updateStatistics();
      this.applyFilter(this.currentFilter);
    });
  }

  updateStatistics() {
    const stats = {
      pending: 0,
      published: 0,
      rejected: 0,
      total: this.articles.length
    };

    this.articles.forEach(article => {
      if (article.status === 'pending') stats.pending++;
      else if (article.status === 'published') stats.published++;
      else if (article.status === 'rejected') stats.rejected++;
    });

    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-published').textContent = stats.published;
    document.getElementById('stat-rejected').textContent = stats.rejected;
    document.getElementById('stat-total').textContent = stats.total;
  }

  setupFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const status = tab.dataset.status;
        this.applyFilter(status);
      });
    });
  }

  applyFilter(status) {
    this.currentFilter = status;
    
    if (status === 'all') {
      this.filteredArticles = this.articles;
    } else {
      this.filteredArticles = this.articles.filter(article => 
        article.status === status
      );
    }

    this.renderArticles();
  }

  renderArticles() {
    const tbody = document.getElementById('articles-tbody');
    
    if (this.filteredArticles.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="no-articles">
            No articles found for this filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.filteredArticles.map(article => `
      <tr>
        <td>
          <div style="font-weight: 600; margin-bottom: 0.25rem;">
            ${this.escapeHtml(article.title)}
          </div>
          <div style="font-size: 0.875rem; color: #6b7280;">
            ${article.readTime || '5 min read'}
          </div>
        </td>
        <td>
          <div>${this.escapeHtml(article.author)}</div>
          <div style="font-size: 0.875rem; color: #6b7280;">
            ${this.escapeHtml(article.submittedByEmail)}
          </div>
        </td>
        <td>
          ${this.formatDate(article.submittedAt)}
        </td>
        <td>
          <span class="status-badge status-${article.status}">
            ${article.status}
          </span>
        </td>
        <td>
          <button class="action-btn btn-view" onclick="window.adminManager.viewArticle('${article.id}')">
            View
          </button>
          ${article.status === 'pending' ? `
            <button class="action-btn btn-publish" onclick="window.adminManager.publishArticle('${article.id}')">
              Publish
            </button>
            <button class="action-btn btn-reject" onclick="window.adminManager.rejectArticle('${article.id}')">
              Reject
            </button>
          ` : ''}
          ${article.status === 'published' ? `
            <button class="action-btn btn-reject" onclick="window.adminManager.unpublishArticle('${article.id}')">
              Unpublish
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  }

  viewArticle(articleId) {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) return;

    const modal = document.getElementById('preview-modal');
    const title = document.getElementById('preview-title');
    const body = document.getElementById('preview-body');

    title.textContent = article.title;
    
    body.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <h3 style="color: #1e3a8a; margin-bottom: 0.5rem;">Article Details</h3>
        <p><strong>Author:</strong> ${this.escapeHtml(article.author)}</p>
        <p><strong>Submitted by:</strong> ${this.escapeHtml(article.submittedByEmail)}</p>
        <p><strong>Submitted on:</strong> ${this.formatDate(article.submittedAt)}</p>
        <p><strong>Reading Time:</strong> ${article.readTime}</p>
        <p><strong>Topics:</strong> ${article.topics.join(', ')}</p>
      </div>

      ${article.bannerImage ? `
        <div style="margin-bottom: 2rem;">
          <h3 style="color: #1e3a8a; margin-bottom: 0.5rem;">Banner Image</h3>
          <img src="${article.bannerImage}" style="max-width: 100%; border-radius: 0.5rem;" />
        </div>
      ` : ''}

      <div style="margin-bottom: 2rem;">
        <h3 style="color: #1e3a8a; margin-bottom: 0.5rem;">Introduction</h3>
        <p style="line-height: 1.7;">${this.escapeHtml(article.introLead)}</p>
        ${article.introText ? `<p style="line-height: 1.7; margin-top: 1rem;">${this.escapeHtml(article.introText)}</p>` : ''}
      </div>

      ${article.sections ? article.sections.map(section => `
        <div style="margin-bottom: 2rem;">
          <h3 style="color: #1e3a8a; margin-bottom: 0.5rem;">${this.escapeHtml(section.heading)}</h3>
          <p style="line-height: 1.7; white-space: pre-wrap;">${this.escapeHtml(section.content)}</p>
        </div>
      `).join('') : ''}

      <div style="margin-bottom: 2rem;">
        <h3 style="color: #1e3a8a; margin-bottom: 0.5rem;">${article.conclusionHeading || 'Conclusion'}</h3>
        <p style="line-height: 1.7; white-space: pre-wrap;">${this.escapeHtml(article.conclusionText)}</p>
      </div>

      ${article.references ? `
        <div style="margin-bottom: 2rem;">
          <h3 style="color: #1e3a8a; margin-bottom: 0.5rem;">References</h3>
          <p style="line-height: 1.7; white-space: pre-wrap; font-size: 0.9rem;">${this.escapeHtml(article.references)}</p>
        </div>
      ` : ''}
    `;

    modal.style.display = 'block';
  }

  async publishArticle(articleId) {
    if (!confirm('Publish this article? It will be visible to all users.')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'article-submissions', articleId), {
        status: 'published',
        publishedAt: serverTimestamp(),
        publishedBy: this.currentUser.uid
      });

      alert('Article published successfully!');
    } catch (error) {
      console.error('Error publishing article:', error);
      alert('Failed to publish article');
    }
  }

  async rejectArticle(articleId) {
    const reason = prompt('Enter rejection reason (optional):');
    
    if (reason === null) return; // User cancelled

    try {
      await updateDoc(doc(db, 'article-submissions', articleId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: this.currentUser.uid,
        rejectionReason: reason || 'No reason provided'
      });

      alert('Article rejected');
    } catch (error) {
      console.error('Error rejecting article:', error);
      alert('Failed to reject article');
    }
  }

  async unpublishArticle(articleId) {
    if (!confirm('Unpublish this article? It will no longer be visible to users.')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'article-submissions', articleId), {
        status: 'pending',
        unpublishedAt: serverTimestamp(),
        unpublishedBy: this.currentUser.uid
      });

      alert('Article unpublished');
    } catch (error) {
      console.error('Error unpublishing article:', error);
      alert('Failed to unpublish article');
    }
  }

  formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Global function to close preview modal
window.closePreview = function() {
  document.getElementById('preview-modal').style.display = 'none';
};

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  const modal = document.getElementById('preview-modal');
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// Initialize and expose globally for onclick handlers
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminArticlesManager();
  });
} else {
  window.adminManager = new AdminArticlesManager();
}

export default AdminArticlesManager;