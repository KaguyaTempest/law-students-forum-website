/* scripts/lecturer-grid.js */
import { db } from './firebase.js';
import {
  collection, getDocs, query, orderBy,
  doc, setDoc, runTransaction
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getAuth, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const grid           = document.getElementById('lecturer-grid');
const placeholderImg = 'assets/default-avatar.png';

/* ─── Fetch & render cards ────────────────────────────────── */
const q = query(collection(db, 'lecturers'),
                orderBy('popularityScore', 'desc'));

getDocs(q).then(snap => {
  if (snap.empty) {
    grid.textContent = 'No lecturers yet. Check back soon!';
    return;
  }
  snap.forEach(doc => renderCard(doc.id, doc.data()));
}).catch(err => {
  console.error(err);
  grid.textContent = 'Failed to load lecturers.';
});

/* ─── Card template ───────────────────────────────────────── */
function renderCard(id, d) {
  const card = document.createElement('div');
  card.className = 'lecturer-card';
  const avg  = d.avgRating ?? 0;
  const stars = '★'.repeat(Math.round(avg)) + '☆'.repeat(5-Math.round(avg));
  const mods  = d.modules?.join(', ') ?? 'No modules listed';

  card.innerHTML = `
    <img class="lecturer-photo"
         src="${d.photoURL || placeholderImg}"
         alt="${d.fullName}"
         onerror="this.src='${placeholderImg}'">
    <div class="lecturer-info">
      <div class="lecturer-name">${d.fullName}</div>
      <div class="lecturer-univ">${d.university}</div>
      <div class="lecturer-mods">${mods}</div>
      <div class="star-display" data-stars>${stars}</div>
      <button class="rate-btn" data-id="${id}">Rate</button>
    </div>
  `;
  card.querySelector('.rate-btn')
      .addEventListener('click', () => openModal(id, d.fullName, card));
  grid.appendChild(card);
}

/* ─── Modal logic ─────────────────────────────────────────── */
const modal        = document.getElementById('rating-modal');
const titleEl      = document.getElementById('modal-title');
const closeBtn     = document.getElementById('modal-close');
const starPicker   = document.getElementById('star-picker');
const commentInput = document.getElementById('rating-comment');
const submitBtn    = document.getElementById('submit-rating');

let currentId   = null;
let currentCard = null;
let pickedStars = 0;

closeBtn.addEventListener('click', hideModal);
modal.addEventListener('click', e => { if (e.target === modal) hideModal(); });

[...starPicker.children].forEach(span => {
  span.addEventListener('click', () => {
    pickedStars = Number(span.dataset.value);
    updateStarPicker();
    submitBtn.disabled = false;
    submitBtn.classList.add('enabled');
  });
});

submitBtn.addEventListener('click', async () => {
  submitBtn.disabled = true;
  try {
    await saveRating(currentId, pickedStars, commentInput.value.trim());
    await updateCardStars(currentCard, currentId);
    hideModal();
    alert('Thank you for your rating!');
  } catch (err) {
    console.error(err);
    alert('Failed to submit rating.');
  } finally {
    submitBtn.disabled = false;
  }
});

function openModal(id, name, card) {
  currentId   = id;
  currentCard = card;
  pickedStars = 0;
  commentInput.value = '';
  submitBtn.disabled = true;
  submitBtn.classList.remove('enabled');
  updateStarPicker();
  titleEl.textContent = `Rate ${name}`;
  modal.classList.remove('hidden');
}

function hideModal() {
  modal.classList.add('hidden');
}

function updateStarPicker() {
  [...starPicker.children].forEach(span => {
    span.textContent = span.dataset.value <= pickedStars ? '★' : '☆';
    span.classList.toggle('selected', span.dataset.value <= pickedStars);
  });
}

/* ─── Firestore save & aggregate update ───────────────────── */
async function saveRating(lecturerId, stars, comment) {
  const auth = getAuth();
  await new Promise(resolve => onAuthStateChanged(auth, resolve));

  const uid = auth.currentUser ? auth.currentUser.uid
                               : `anon-${Date.now()}`;

  // 1. Write / overwrite user's rating subdoc
  await setDoc(
    doc(db, 'lecturers', lecturerId, 'ratings', uid),
    { stars, comment, uid, createdAt: Date.now() },
    { merge: true }
  );

  // 2. Transactionally update aggregates on lecturer document
  await runTransaction(db, async (t) => {
    const ref  = doc(db, 'lecturers', lecturerId);
    const snap = await t.get(ref);
    const d    = snap.data() || {};
    const total = (d.totalScore ?? 0) + stars;
    const count = (d.ratingCount ?? 0) + 1;
    const avg   = +(total / count).toFixed(2);
    t.update(ref, {
      totalScore: total,
      ratingCount: count,
      avgRating: avg,
      popularityScore: avg * count
    });
  });
}

/* ─── Reflect new average on the card ─────────────────────── */
async function updateCardStars(card, lecturerId) {
  const ref  = doc(db, 'lecturers', lecturerId);
  const snap = await getDocs(query(collection(db, 'lecturers'), orderBy('popularityScore','desc'))); // quick re-fetch
  const docSnap = snap.docs.find(d => d.id === lecturerId);
  const avg = docSnap ? docSnap.data().avgRating : 0;
  const stars = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
  card.querySelector('[data-stars]').textContent = stars;
}