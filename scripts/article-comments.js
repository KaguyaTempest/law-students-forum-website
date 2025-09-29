// scripts/article-comments.js
// Real-time commenting system with Firebase integration
import { auth, db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc, 
  doc,
  updateDoc,
  increment,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getUserProfile } from './auth-service.js';

class ArticleComments {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.articleId = null;
    this.commentsContainer = null;
    this.commentForm = null;
    this.commentTextarea = null;
    this.commentAuthMessage = null;
    this.loginToCommentBtn = null;
    this.unsubscribeComments = null;

    this.init();
  }

  init() {
    // Get article ID from the page
    this.articleId = this.getArticleId();
    if (!this.articleId) {
      console.warn('No article ID found');
      return;
    }

    // Get DOM elements
    this.commentsContainer = document.getElementById('comments-list');
    this.commentForm = document.getElementById('comment-form');
    this.commentTextarea = document.getElementById('comment-text');
    this.commentAuthMessage = document.getElementById('comment-auth-message');
    this.loginToCommentBtn = document.getElementById('login-to-comment-btn');

    if (!this.commentsContainer) {
      console.warn('Comments container not found');
      return;
    }

    // Set up auth listener
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        this.userProfile = await getUserProfile(user.uid);
      } else {
        this.userProfile = null;
      }
      this.updateCommentForm();
    });

    // Set up comment form submission
    if (this.commentForm) {
      this.commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e));
    }

    // Set up login button
    if (this.loginToCommentBtn) {
      this.loginToCommentBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Trigger auth modal (assuming it exists globally)
        const event = new CustomEvent('show-auth-modal', { detail: { showLogin: true } });
        document.dispatchEvent(event);
      });
    }

    // Load comments
    this.loadComments();
  }

  getArticleId() {
    // Try to get from data attribute first
    const main = document.querySelector('main[data-article-id]');
    if (main) {
      return main.getAttribute('data-article-id');
    }

    // Fallback to URL path
    const path = window.location.pathname;
    const matches = path.match(/\/articles\/([^\/]+)\.html?$/);
    return matches ? matches[1] : null;
  }

  updateCommentForm() {
    if (!this.commentAuthMessage || !this.commentForm) return;

    if (this.currentUser && this.userProfile) {
      // User is logged in
      this.commentAuthMessage.style.display = 'none';
      this.commentForm.classList.remove('hidden');
    } else {
      // User is not logged in
      this.commentAuthMessage.style.display = 'block';
      this.commentForm.classList.add('hidden');
    }
  }

  async handleCommentSubmit(e) {
    e.preventDefault();
    
    if (!this.currentUser || !this.userProfile) {
      alert('Please log in to comment');
      return;
    }

    const text = this.commentTextarea.value.trim();
    if (!text) {
      alert('Please enter a comment');
      return;
    }

    const submitBtn = this.commentForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';

      // Add comment to Firestore
      await addDoc(collection(db, 'comments'), {
        articleId: this.articleId,
        userId: this.currentUser.uid,
        username: this.userProfile.username || 'Anonymous',
        userRole: this.userProfile.role || 'observer',
        userUniversity: this.userProfile.profileData?.university || this.userProfile.university || '',
        yearsExperience: this.userProfile.profileData?.yearsExperience || null,
        text: text,
        timestamp: serverTimestamp(),
        reactions: {
          likes: 0,
          hearts: 0,
          thumbsUp: 0
        }
      });

      // Clear the form
      this.commentTextarea.value = '';
      
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  loadComments() {
    if (!this.articleId) return;

    // Create query for comments on this article
    const commentsQuery = query(
      collection(db, 'comments'),
      orderBy('timestamp', 'desc')
    );

    // Listen for real-time updates
    this.unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const comments = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.articleId === this.articleId) {
          comments.push({
            id: doc.id,
            ...data
          });
        }
      });

      this.renderComments(comments);
    });
  }

  renderComments(comments) {
    if (!this.commentsContainer) return;

    if (comments.length === 0) {
      this.commentsContainer.innerHTML = `
        <p class="no-comments-message">No comments yet. Be the first to share your thoughts!</p>
      `;
      return;
    }

    this.commentsContainer.innerHTML = comments.map(comment => this.renderComment(comment)).join('');

    // Add event listeners for reaction buttons
    this.addReactionListeners();
  }

  renderComment(comment) {
    const timestamp = comment.timestamp?.toDate ? comment.timestamp.toDate() : new Date();
    const formattedTime = this.formatTimestamp(timestamp);
    const userBadge = this.getUserBadge(comment.userRole, comment.userUniversity, comment.yearsExperience);
    const universityBadge = this.getUniversityBadge(comment.userUniversity);
    const userAvatar = this.generateUserAvatar(comment.username);

    const reactions = comment.reactions || { likes: 0, hearts: 0, thumbsUp: 0 };

    return `
      <div class="forum-comment" data-comment-id="${comment.id}">
        <div class="comment-header">
          <div class="comment-user-avatar" style="background-color: ${userAvatar.color}">
            ${userAvatar.initials}
          </div>
          <div class="comment-user-info">
            <div class="comment-user">${this.escapeHtml(comment.username)}</div>
            <div class="comment-user-details">
              ${universityBadge}
              ${userBadge}
              <span class="comment-time">${formattedTime}</span>
            </div>
          </div>
        </div>
        <div class="comment-text">${this.escapeHtml(comment.text)}</div>
        <div class="reaction-bar">
          <button class="reaction-btn" data-reaction="likes" data-comment-id="${comment.id}">
            👍 <span class="reaction-count">${reactions.likes || 0}</span>
          </button>
          <button class="reaction-btn" data-reaction="hearts" data-comment-id="${comment.id}">
            ❤️ <span class="reaction-count">${reactions.hearts || 0}</span>
          </button>
          <button class="reaction-btn" data-reaction="thumbsUp" data-comment-id="${comment.id}">
            🎉 <span class="reaction-count">${reactions.thumbsUp || 0}</span>
          </button>
        </div>
        ${this.currentUser && (this.currentUser.uid === comment.userId || this.isAdmin()) ? 
          `<button class="delete-comment-btn" data-comment-id="${comment.id}">Delete</button>` : 
          ''}
      </div>
    `;
  }

  getUserBadge(role, university, yearsExperience) {
    switch (role) {
      case 'student':
        return `<span class="user-badge role-student">Law Student</span>`;
      case 'lawyer':
        const experienceText = yearsExperience ? `<span class="lawyer-experience">${yearsExperience}y</span>` : '';
        return `<span class="user-badge role-lawyer">Legal Practitioner${experienceText}</span>`;
      case 'observer':
        return `<span class="user-badge role-observer">Observer</span>`;
      default:
        return `<span class="user-badge role-observer">Member</span>`;
    }
  }

  getUniversityBadge(university) {
    const universityMap = {
      'UZ': { name: 'University of Zimbabwe', logo: '/law-students-forum-website/assets/university-logos/uz-logo.png', class: 'uz' },
      'MSU': { name: 'Midlands State University', logo: '/law-students-forum-website/assets/university-logos/msu-logo.png', class: 'msu' },
      'ZEGU': { name: 'Zimbabwe Ezekiel Guti University', logo: '/law-students-forum-website/assets/university-logos/zegu-logo.png', class: 'zegu' },
      'GZU': { name: 'Great Zimbabwe University', logo: '/law-students-forum-website/assets/university-logos/gzu-logo.png', class: 'gzu' },
    };

    if (university && universityMap[university]) {
      const uni = universityMap[university];
      return `
        <div class="university-badge ${uni.class}">
          <img src="${uni.logo}" alt="${uni.name}" class="university-logo" onerror="this.style.display='none'">
          <span>${university}</span>
        </div>
      `;
    }

    return `<div class="university-badge default"><span>University</span></div>`;
  }

  generateUserAvatar(username) {
    if (!username) return { initials: '??', color: '#6b7280' };

    const initials = username.split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);

    const colors = ['#1e3a8a', '#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];

    return { initials, color };
  }

  addReactionListeners() {
    // Reaction buttons
    document.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleReaction(e));
    });

    // Delete buttons
    document.querySelectorAll('.delete-comment-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleDeleteComment(e));
    });
  }

  async handleReaction(e) {
    e.preventDefault();
    
    if (!this.currentUser) {
      alert('Please log in to react to comments');
      return;
    }

    const btn = e.currentTarget;
    const commentId = btn.getAttribute('data-comment-id');
    const reactionType = btn.getAttribute('data-reaction');

    if (!commentId || !reactionType) return;

    try {
      // Update reaction count in Firestore
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        [`reactions.${reactionType}`]: increment(1)
      });

      // Update button UI immediately (optimistic update)
      const countSpan = btn.querySelector('.reaction-count');
      if (countSpan) {
        const currentCount = parseInt(countSpan.textContent) || 0;
        countSpan.textContent = currentCount + 1;
      }

      // Disable button temporarily to prevent spam
      btn.disabled = true;
      setTimeout(() => {
        btn.disabled = false;
      }, 2000);

    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }

  async handleDeleteComment(e) {
    e.preventDefault();
    
    const commentId = e.currentTarget.getAttribute('data-comment-id');
    if (!commentId) return;

    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  }

  formatTimestamp(date) {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  isAdmin() {
    // Check if current user is admin - you can implement this based on your user roles
    return this.userProfile && this.userProfile.role === 'admin';
  }

  destroy() {
    if (this.unsubscribeComments) {
      this.unsubscribeComments();
    }
  }
}

// Initialize comments system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize on article pages
  if (document.querySelector('.article-main') || document.querySelector('.comments-section')) {
    new ArticleComments();
  }
});

// Listen for auth modal show requests
document.addEventListener('show-auth-modal', (e) => {
  // This assumes your auth modal system can handle this event
  if (typeof showAuthModal === 'function') {
    showAuthModal(e.detail.showLogin ? 'login' : 'signup');
  }
});