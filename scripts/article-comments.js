// scripts/article-comments.js
// Fixed real-time commenting system with Firebase integration
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
  increment
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
    // Get article ID from the page URL
    this.articleId = this.getArticleId();
    
    console.log('Article ID detected:', this.articleId); // Debug log
    
    if (!this.articleId) {
      console.warn('No article ID found - comments disabled');
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
        try {
          this.userProfile = await getUserProfile(user.uid);
          console.log('User profile loaded:', this.userProfile); // Debug log
        } catch (error) {
          console.error('Error loading user profile:', error);
          this.userProfile = {
            username: user.email || 'Anonymous',
            role: 'observer',
            university: ''
          };
        }
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
        const event = new CustomEvent('show-auth-modal', { detail: { showLogin: true } });
        document.dispatchEvent(event);
      });
    }

    // Load comments
    this.loadComments();
  }

  getArticleId() {
    // Extract article ID from URL path
    const path = window.location.pathname;
    
    // Pattern: /articles/article-name.html
    const match = path.match(/\/articles\/([^\/]+)\.html$/);
    
    if (match && match[1]) {
      return match[1];
    }
    
    // Fallback: try data attribute
    const main = document.querySelector('main[data-article-id]');
    if (main) {
      return main.getAttribute('data-article-id');
    }
    
    return null;
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

      console.log('Posting comment for article:', this.articleId); // Debug log

      // Add comment to Firestore
      const commentData = {
        articleId: this.articleId,
        userId: this.currentUser.uid,
        username: this.userProfile.username || this.currentUser.email || 'Anonymous',
        userRole: this.userProfile.role || 'observer',
        userUniversity: this.userProfile.university || '',
        yearsExperience: this.userProfile.yearsExperience || null,
        text: text,
        timestamp: serverTimestamp(),
        reactions: {
          likes: 0,
          hearts: 0,
          celebrations: 0
        }
      };

      console.log('Comment data:', commentData); // Debug log

      await addDoc(collection(db, 'comments'), commentData);

      // Clear the form
      this.commentTextarea.value = '';
      
      console.log('Comment posted successfully!'); // Debug log
      
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  loadComments() {
    if (!this.articleId) return;

    console.log('Loading comments for article:', this.articleId); // Debug log

    // Create query for all comments
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

      console.log('Loaded comments:', comments.length); // Debug log
      this.renderComments(comments);
    }, (error) => {
      console.error('Error loading comments:', error);
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
    const userBadge = this.getUserBadge(comment.userRole, comment.yearsExperience);
    const universityBadge = this.getUniversityBadge(comment.userUniversity);
    const userAvatar = this.generateUserAvatar(comment.username);

    const reactions = comment.reactions || { likes: 0, hearts: 0, celebrations: 0 };

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
          <button class="reaction-btn" data-reaction="celebrations" data-comment-id="${comment.id}">
            🎉 <span class="reaction-count">${reactions.celebrations || 0}</span>
          </button>
        </div>
        ${this.canDeleteComment(comment) ? 
          `<button class="delete-comment-btn" data-comment-id="${comment.id}">Delete</button>` : 
          ''}
      </div>
    `;
  }

  getUserBadge(role, yearsExperience) {
    switch (role) {
      case 'student':
        return `<span class="user-badge role-student">Law Student</span>`;
      case 'lawyer':
        const experienceText = yearsExperience ? `<span class="lawyer-experience">${yearsExperience}y</span>` : '';
        return `<span class="user-badge role-lawyer">Legal Practitioner ${experienceText}</span>`;
      case 'observer':
        return `<span class="user-badge role-observer">Observer</span>`;
      default:
        return `<span class="user-badge role-observer">Member</span>`;
    }
  }

  getUniversityBadge(university) {
    const universityMap = {
      'UZ': { name: 'University of Zimbabwe', class: 'uz' },
      'MSU': { name: 'Midlands State University', class: 'msu' },
      'ZEGU': { name: 'Zimbabwe Ezekiel Guti University', class: 'zegu' },
      'GZU': { name: 'Great Zimbabwe University', class: 'gzu' },
    };

    if (university && universityMap[university]) {
      const uni = universityMap[university];
      return `
        <div class="university-badge ${uni.class}">
          <span>${university}</span>
        </div>
      `;
    }

    return '';
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

      // Disable button temporarily to prevent spam
      btn.disabled = true;
      setTimeout(() => {
        btn.disabled = false;
      }, 2000);

    } catch (error) {
      console.error('Error adding reaction:', error);
      alert('Failed to add reaction');
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
      console.log('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  }

  canDeleteComment(comment) {
    if (!this.currentUser) return false;
    
    // User can delete their own comments
    if (this.currentUser.uid === comment.userId) return true;
    
    // Admin can delete any comment (if you implement admin check)
    // return this.userProfile?.isAdmin;
    
    return false;
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
      return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    if (this.unsubscribeComments) {
      this.unsubscribeComments();
    }
  }
}

// Initialize comments system when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('comments')) {
      new ArticleComments();
    }
  });
} else {
  // DOM already loaded
  if (document.getElementById('comments')) {
    new ArticleComments();
  }
}

export default ArticleComments;