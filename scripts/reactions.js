/* ─────────  reactions.js  (full-feature, modular)  ─────────
   • Comment posting with role badges
   • Admin delete
   • Reactions (👍  💡  🎉) – one per user per emoji
   • Live counts / ready for “most-liked” queries
──────────────────────────────────────────────────────────── */

import { auth, db } from './firebase.js';

import {
  ref, push, onValue, serverTimestamp, get,
  remove, child, set, update
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

import { onAuthStateChanged } from
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ── Global state ───────────────────────── */
let currentUser = null;
let isAdmin     = false;

const params            = new URLSearchParams(window.location.search);
const articleId         = params.get('article');
const commentFormWrap   = document.querySelector('.comment-form');
const commentsContainer = document.querySelector('.comments-container');

/* ── Auth listener ──────────────────────── */
onAuthStateChanged(auth, async user => {
  currentUser = user;

  if (user) {
    const snap = await get(child(ref(db), `admins/${user.uid}`));
    isAdmin = snap.exists();
  }

  renderCommentForm();
  loadComments();
});

/* ── Render form or login prompt ────────── */
function renderCommentForm() {
  if (!commentFormWrap) return;

  if (!currentUser) {
    commentFormWrap.innerHTML =
      `<p class="comment-login-prompt">
        Please <a href="#" class="open-auth-modal">log in</a> to leave a comment.
       </p>`;
    return;
  }

  commentFormWrap.innerHTML = `
    <form id="comment-submit-form">
      <textarea placeholder="Your comment..." rows="4" required></textarea>
      <button type="submit">Post Comment</button>
    </form>
  `;

  document.getElementById('comment-submit-form')
    .addEventListener('submit', async e => {
      e.preventDefault();
      const textarea = e.target.querySelector('textarea');
      const text     = textarea.value.trim();
      if (!text) return;

      const userSnap = await get(child(ref(db), `users/${currentUser.uid}`));
      const u        = userSnap.exists() ? userSnap.val() : {};

      await push(ref(db, `comments/${articleId}`), {
        userId:     currentUser.uid,
        username:   u.username   || currentUser.email,
        role:       u.status     || 'spectator',
        university: u.university || '',
        text,
        timestamp:  serverTimestamp()
      });

      textarea.value = '';
    });
}

/* ── Load & render comment stream ───────── */
function loadComments() {
  const commentRef = ref(db, `comments/${articleId}`);
  onValue(commentRef, snap => {
    commentsContainer.innerHTML = '';

    if (!snap.exists()) {
      commentsContainer.innerHTML =
        '<p class="no-comments">No comments yet.</p>';
      return;
    }

    Object.entries(snap.val()).forEach(([cid, c]) => {
      const div = document.createElement('div');
      div.className = 'forum-comment';

      /* comment body */
      div.innerHTML = `
        <div class="comment-header">
          <span class="comment-user">${c.username}</span>
          ${roleBadge(c.role, c.university)}
          <span class="comment-time">
            ${new Date(c.timestamp || Date.now()).toLocaleString()}
          </span>
        </div>
        <div class="comment-text">${c.text}</div>
      `;

      /* reaction bar */
      const bar = document.createElement('div');
      bar.className = 'reaction-bar';

      ['👍','💡','🎉'].forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'reaction-btn';
        btn.dataset.emoji = emoji;
        btn.textContent  = emoji;
        btn.addEventListener('click', () => toggleReaction(cid, emoji));
        bar.appendChild(btn);
      });
      div.appendChild(bar);

      /* admin delete */
      if (isAdmin) {
        const del = document.createElement('button');
        del.textContent = 'Delete';
        del.className   = 'delete-comment-btn';
        del.addEventListener('click', () => deleteComment(cid));
        div.appendChild(del);
      }

      commentsContainer.appendChild(div);
      renderReactionCounts(cid, bar);   // live counts
    });
  });
}

/* ── Reaction toggle ───────────────────── */
async function toggleReaction(commentId, emoji) {
  if (!currentUser) {
    alert('Please log in to react.');
    return;
  }
  const path = `comments/${articleId}/${commentId}/reactions/${emoji}/${currentUser.uid}`;
  const snap = await get(ref(db, path));

  if (snap.exists()) {
    remove(ref(db, path));            // un-react
  } else {
    set(ref(db, path), true);         // add reaction
  }
}

/* ── Live count renderer ────────────────── */
function renderReactionCounts(commentId, barEl) {
  const reactRef = ref(db, `comments/${articleId}/${commentId}/reactions`);
  onValue(reactRef, snap => {
    const counts = { '👍':0, '💡':0, '🎉':0 };
    if (snap.exists()) {
      Object.entries(snap.val()).forEach(([emoji, users]) => {
        counts[emoji] = users ? Object.keys(users).length : 0;
      });
    }
    barEl.querySelectorAll('.reaction-btn').forEach(btn => {
      const emo = btn.dataset.emoji;
      btn.innerHTML = `${emo} <span>${counts[emo]}</span>`;
    });
  });
}

/* ── Helpers ───────────────────────────── */
function roleBadge(role, uni) {
  if (role === 'law_student')
    return `<span class="user-badge role-student">Law Student (${uni})</span>`;
  if (role === 'lawyer')
    return `<span class="user-badge role-lawyer">Lawyer</span>`;
  return `<span class="user-badge role-observer">Observer</span>`;
}

function deleteComment(id) {
  if (!confirm('Delete this comment?')) return;
  remove(ref(db, `comments/${articleId}/${id}`));
}

/* ── (Optional) Minimal CSS to drop in style.css ───────────
.reaction-bar{margin-top:.5rem;display:flex;gap:.5rem}
.reaction-btn{background:#f3f3f3;border:1px solid #ccc;border-radius:6px;
              padding:.2rem .5rem;cursor:pointer;font-size:.9rem}
.reaction-btn span{margin-left:2px;font-weight:600}
──────────────────────────────────────────────────────────── */
