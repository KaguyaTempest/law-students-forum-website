/* scripts/lecturer-grid.js */
import { db } from './firebase.js';
import {
  collection, getDocs, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const grid = document.getElementById('lecturer-grid');
const placeholderImg = 'assets/default-avatar.png';

const q = query(
  collection(db, 'lecturers'),
  orderBy('popularityScore', 'desc')
);

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

function renderCard(id, d) {
  const card = document.createElement('div');
  card.className = 'lecturer-card';

  const avg = d.avgRating ?? 0;
  const stars = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));

  const mods = d.modules?.join(', ') ?? 'No modules listed';

  card.innerHTML = `
    <img class="lecturer-photo"
         src="${d.photoURL || placeholderImg}"
         alt="${d.fullName}"
         onerror="this.src='${placeholderImg}'">

    <div class="lecturer-info">
      <div class="lecturer-name">${d.fullName}</div>
      <div class="lecturer-univ">${d.university}</div>
      <div class="lecturer-mods">${mods}</div>
      <div class="star-display">${stars}</div>
      <button class="rate-btn" data-id="${id}">Rate</button>
    </div>
  `;

  card.querySelector('.rate-btn')
      .addEventListener('click', () => openModal(id, d.fullName));

  grid.appendChild(card);
}

function openModal(id, name) {
  alert(`Coming soon → rating modal for ${name}`);
}
