// comment.js
import { getDatabase, ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const db = getDatabase();
const auth = getAuth();

let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  renderCommentForm();
});

const commentFormContainer = document.querySelector(".comment-form");
const commentsContainer = document.querySelector(".comments-container");

const params = new URLSearchParams(window.location.search);
const articleId = params.get("article");

function renderCommentForm() {
  if (!commentFormContainer) return;

  if (!currentUser) {
    commentFormContainer.innerHTML = `<p class="comment-login-prompt">Please <a href="#" class="open-auth-modal">log in</a> to leave a comment.</p>`;
    return;
  }

  commentFormContainer.innerHTML = `
    <form id="comment-submit-form">
      <textarea placeholder="Your comment..." rows="4" required></textarea>
      <button type="submit">Post Comment</button>
    </form>
  `;

  document.getElementById("comment-submit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const textarea = e.target.querySelector("textarea");
    const commentText = textarea.value.trim();
    if (!commentText) return;

    const commentRef = ref(db, `comments/${articleId}`);
    push(commentRef, {
      userId: currentUser.uid,
      username: currentUser.displayName || currentUser.email,
      text: commentText,
      timestamp: serverTimestamp(),
    }).then(() => {
      textarea.value = "";
    });
  });
}

function loadComments() {
  const commentRef = ref(db, `comments/${articleId}`);
  onValue(commentRef, (snapshot) => {
    commentsContainer.innerHTML = "";
    if (!snapshot.exists()) {
      commentsContainer.innerHTML = `<p class="no-comments">No comments yet.</p>`;
      return;
    }
    const comments = snapshot.val();
    Object.values(comments).forEach((c) => {
      const commentDiv = document.createElement("div");
      commentDiv.className = "forum-comment";
      commentDiv.innerHTML = `
        <div class="comment-header">
          <span class="comment-user">${c.username}</span>
          <span class="comment-time">${new Date(c.timestamp || Date.now()).toLocaleString()}</span>
        </div>
        <div class="comment-text">${c.text}</div>
      `;
      commentsContainer.appendChild(commentDiv);
    });
  });
}

loadComments();
