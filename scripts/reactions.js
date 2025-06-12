// comment.js
import { getDatabase, ref, push, onValue, serverTimestamp, get, child, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const db = getDatabase();
const auth = getAuth();

let currentUser = null;
let isAdmin = false;

const params = new URLSearchParams(window.location.search);
const articleId = params.get("article");

const commentFormContainer = document.querySelector(".comment-form");
const commentsContainer = document.querySelector(".comments-container");

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    const adminSnap = await get(ref(db, `admins/${user.uid}`));
    isAdmin = adminSnap.exists();
  }
  renderCommentForm();
  loadComments();
});

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

  document.getElementById("comment-submit-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const textarea = e.target.querySelector("textarea");
    const commentText = textarea.value.trim();
    if (!commentText) return;

    const userSnap = await get(ref(db, `users/${currentUser.uid}`));
    const userData = userSnap.val();

    const commentRef = ref(db, `comments/${articleId}`);
    push(commentRef, {
      userId: currentUser.uid,
      username: userData.username || currentUser.email,
      role: userData.status || "spectator",
      university: userData.university || "",
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
    Object.entries(comments).forEach(([commentId, c]) => {
      const commentDiv = document.createElement("div");
      commentDiv.className = "forum-comment";

      const roleBadge = getRoleBadge(c.role, c.university);

      commentDiv.innerHTML = `
        <div class="comment-header">
          <span class="comment-user">${c.username}</span>
          ${roleBadge}
          <span class="comment-time">${new Date(c.timestamp || Date.now()).toLocaleString()}</span>
        </div>
        <div class="comment-text">${c.text}</div>
      `;

      if (isAdmin) {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-comment-btn";
        deleteBtn.addEventListener("click", () => deleteComment(commentId));
        commentDiv.appendChild(deleteBtn);
      }

      commentsContainer.appendChild(commentDiv);
    });
  });
}

function getRoleBadge(role, university) {
  let label = "";
  let roleClass = "";

  if (role === "law_student") {
    label = `Law Student (${university})`;
    roleClass = "role-student";
  } else if (role === "lawyer") {
    label = "Lawyer";
    roleClass = "role-lawyer";
  } else {
    label = "Observer";
    roleClass = "role-observer";
  }

  return `<span class="user-badge ${roleClass}">${label}</span>`;
}

function deleteComment(commentId) {
  const confirmDelete = confirm("Are you sure you want to delete this comment?");
  if (!confirmDelete) return;

  const commentRef = ref(db, `comments/${articleId}/${commentId}`);
  remove(commentRef);
}
