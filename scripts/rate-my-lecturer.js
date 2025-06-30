/* ------------------------------------------------------------------
   RateMyLecturer.js  –  Law Students Intellectual Forum (LSIF)
   ------------------------------------------------------------------
   ▸ Initialises Firebase (modular SDK)
   ▸ Fetches lecturer docs from Firestore and renders responsive cards
   ▸ Dynamically fills the Module <select> with unique module names
   ▸ Real‑time filtering (search, university, module)
   ▸ Opens a modal for 5‑star rating + text review
   ▸ Uploads each review to a /reviews sub‑collection
   ▸ Atomically recalculates and updates avgRating & numRatings
   ------------------------------------------------------------------ */

/* === 1. Firebase imports & config ==================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, query, addDoc,
  runTransaction, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// TODO ➜ Replace with your project creds --------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "1234567890",
  appId: "YOUR_APP_ID"
};

/* === 2. DOM short‑cuts =============================================== */
const $ = (id) => document.getElementById(id);
const searchBar      = $("searchBar");
const uniFilter      = $("universityFilter");
const moduleFilter   = $("moduleFilter");
const listContainer  = $("lecturerList");
const modal          = $("ratingFormContainer");
const form          = $("ratingForm");
const starsWrapper   = $("starRating");
const reviewBox      = $("reviewText");
const lecNameLabel   = $("lecturerName");
const lecMetaLabel   = $("lecturerMeta");

/* === 3. App‑level state ============================================== */
let db, auth, user;
let lecturers = [];          // Cached lecturer docs
let currentLecturer = null;  // Object the user is rating now
let selectedRating  = 0;     // Int 1‑5

/* === 4. Bootstrap ===================================================== */
(async function init() {
  // 4.1 → Firebase
  const app = initializeApp(firebaseConfig);
  db   = getFirestore(app);
  auth = getAuth(app);

  // 4.2 → User (optional – ratings may still be anonymous)
  onAuthStateChanged(auth, (u) => (user = u));

  // 4.3 → Load lecturers + bind listeners
  await fetchLecturers();
  wireUI();
})();

/* === 5. Firestore fetch & live updates =============================== */
async function fetchLecturers() {
  const snap = await getDocs(collection(db, "lecturers"));
  lecturers  = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  populateModuleSelect();
  renderList(lecturers);

  // Optional: live updates so averages refresh instantly
  onSnapshot(collection(db, "lecturers"), (s) => {
    lecturers = s.docs.map(d => ({ id: d.id, ...d.data() }));
    populateModuleSelect();
    filterAndRender();
  });
}

function populateModuleSelect() {
  const modules = [...new Set(lecturers.map(l => l.module))].sort();
  moduleFilter.innerHTML = '<option value="">All Modules</option>';
  modules.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    moduleFilter.appendChild(opt);
  });
}

/* === 6. UI Wiring ===================================================== */
function wireUI() {
  // Filters
  searchBar.addEventListener("input", filterAndRender);
  uniFilter.addEventListener("change", filterAndRender);
  moduleFilter.addEventListener("change", filterAndRender);

  // Rating form
  form.addEventListener("submit", handleSubmit);
}

function filterAndRender() {
  const term   = searchBar.value.toLowerCase();
  const uni    = uniFilter.value;
  const module = moduleFilter.value;

  const filtered = lecturers.filter(l =>
    (!term   || l.name.toLowerCase().includes(term)) &&
    (!uni    || l.university === uni) &&
    (!module || l.module === module)
  );

  renderList(filtered);
}

/* === 7. Render list =================================================== */
function renderList(data) {
  listContainer.innerHTML = "";
  if (!data.length) {
    listContainer.textContent = "No lecturers match your criteria.";
    return;
  }

  data.forEach(lec => {
    const card = document.createElement("article");
    card.className = "lecturer-card";
    card.innerHTML = `
      <h3>${lec.name}</h3>
      <p class="small"><strong>${lec.university}</strong> — ${lec.module}</p>
      <div class="rating-summary">
        ${starRowHTML(Math.round(lec.avgRating || 0))}
        <span>${(lec.avgRating || 0).toFixed(1)} / 5</span>
        <span>(${lec.numRatings || 0})</span>
      </div>
      <button data-id="${lec.id}">Rate</button>
    `;
    card.querySelector("button").addEventListener("click", () => openModal(lec));
    listContainer.appendChild(card);
  });
}

function starRowHTML(full) {
  return Array.from({ length: 5 }, (_, i) => `<span class="star">${i < full ? "★" : "☆"}</span>`).join("");
}

/* === 8. Modal controls =============================================== */
function openModal(lec) {
  currentLecturer = lec;
  lecNameLabel.textContent = lec.name;
  lecMetaLabel.textContent = `— ${lec.university}, ${lec.module}`;
  reviewBox.value = "";
  selectedRating  = 0;
  buildStarWidget();
  modal.classList.remove("hidden");
}
window.closeForm = () => modal.classList.add("hidden");  // Expose for inline onclick

function buildStarWidget() {
  starsWrapper.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.className = "star-icon";
    star.textContent = "☆";
    star.addEventListener("mouseover", () => highlight(i));
    star.addEventListener("focus",   () => highlight(i));
    star.addEventListener("click",   () => setRating(i));
    starsWrapper.appendChild(star);
  }
  highlight(0);
}

function highlight(count) {
  [...starsWrapper.children].forEach((s, idx) => {
    s.textContent = idx < count ? "★" : "☆";
    s.classList.toggle("hovered", idx < count);
  });
}

function setRating(val) {
  selectedRating = val;
  [...starsWrapper.children].forEach((s, idx) => {
    s.textContent = idx < val ? "★" : "☆";
    s.classList.toggle("active", idx < val);
  });
}

/* === 9. Submit review ================================================ */
async function handleSubmit(e) {
  e.preventDefault();
  if (!selectedRating) return alert("Please select a star rating first.");

  const review = {
    rating: selectedRating,
    text:   reviewBox.value.trim(),
    userId: user ? user.uid : "anon",
    timestamp: new Date()
  };

  try {
    // 9.1 → Add review
    const revCol = collection(db, "lecturers", currentLecturer.id, "reviews");
    await addDoc(revCol, review);

    // 9.2 → Update aggregates atomically
    const lecRef = doc(db, "lecturers", currentLecturer.id);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(lecRef);
      const d    = snap.data();
      const n    = (d.numRatings || 0) + 1;
      const avg  = ((d.avgRating || 0) * (d.numRatings || 0) + selectedRating) / n;
      tx.update(lecRef, { numRatings: n, avgRating: avg });
    });

    alert("Thank you for your review!");
    closeForm();
  } catch (err) {
    console.error(err);
    alert("Sorry, something went wrong. Please try again.");
  }
}
