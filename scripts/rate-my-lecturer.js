/* ------------------------------------------------------------------
   Rate‑My‑Lecturer (integrated static + Firestore)
   ------------------------------------------------------------------
   ▸ Works offline with 4 hard‑coded lecturers (sprites & modules array)
   ▸ Seamlessly upgrades to Firestore data when docs exist
   ▸ Real‑time filters, 5‑star modal, aggregate rating updates
   ------------------------------------------------------------------ */

/* === 0. Static fallback dataset ==================================== */
const staticLecturers = [
  {
    id: "lovemore-madhuku",
    name: "Professor Lovemore Madhuku",
    university: "UZ",
    modules: [
      "Introduction to Zimbabwean Law",
      "Constitutional Law",
      "Jurisprudence"
    ],
    sprite: "images/sprites/madhuku.png",
    avgRating: 0,
    numRatings: 0
  },
  {
    id: "munyaradzi-gwisai",
    name: "Doc Munyaradzi Gwisai",
    university: "UZ",
    modules: ["Foundations of Zimbabwean Law"],
    sprite: "images/sprites/gwisai.png",
    avgRating: 0,
    numRatings: 0
  },
  {
    id: "fadzai-mahere",
    name: "Fadzai Mahere",
    university: "UZ",
    modules: ["Family Law"],
    sprite: "images/sprites/mahere.png",
    avgRating: 0,
    numRatings: 0
  },
  {
    id: "sheillah-kanyangarara",
    name: "Sheillah Kanyangarara",
    university: "UZ",
    modules: ["Criminal Procedure"],
    sprite: "images/sprites/kanyangarara.png",
    avgRating: 0,
    numRatings: 0
  }
];

/* === 1. Firebase imports & config =================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, query, addDoc,
  runTransaction, onSnapshot, setDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// 🔐 Replace with your own credentials
const firebaseConfig = {
  apiKey: "AIzaSyC0qWjJ8kt5jo1rOwNAd21RZ9QeK6pE7yU",
  authDomain: "lsif-cedb1.firebaseapp.com",
  databaseURL: "https://lsif-cedb1-default-rtdb.firebaseio.com",
  projectId: "lsif-cedb1",
  storageBucket: "lsif-cedb1.firebasestorage.app",
  messagingSenderId: "761903090404",
  appId: "1:761903090404:web:0b7c914fa2c3599faebaf1",
  measurementId: "G-GGNJJSP3DJ"
};

/* === 2. DOM helpers ================================================== */
const $ = (id) => document.getElementById(id);
const searchBar    = $("searchBar");
const uniFilter    = $("universityFilter");
const moduleFilter = $("moduleFilter");
const listEl       = $("lecturerList");
const modal        = $("ratingFormContainer");
const form         = $("ratingForm");
const starsWrap    = $("starRating");
const reviewBox    = $("reviewText");
const lecNameLbl   = $("lecturerName");
const lecMetaLbl   = $("lecturerMeta");

/* === 3. App state ==================================================== */
let db, auth, user;
let lecturers = [];
let currentLecturer = null;
let selectedRating  = 0;

/* === 4. Bootstrap ==================================================== */
(async function init() {
  // 4.1 – Firebase
  const app = initializeApp(firebaseConfig);
  db   = getFirestore(app);
  auth = getAuth(app);

  // 4.2 – Auth (optional)
  onAuthStateChanged(auth, (u) => (user = u));

  // 4.3 – Data
  await loadLecturers();
  bindUI();
})();

/* === 5. Data loader ================================================== */
async function loadLecturers() {
  try {
    const snap = await getDocs(collection(db, "lecturers"));
    if (!snap.empty) {
      // Use Firestore docs (upgrade path)
      lecturers = snap.docs.map((d) => normalise(d.id, d.data()));

      // Live updates
      onSnapshot(collection(db, "lecturers"), (s) => {
        lecturers = s.docs.map((d) => normalise(d.id, d.data()));
        refreshFiltersAndList();
      });
    } else {
      // No docs yet → fall back to static seed
      lecturers = [...staticLecturers];
    }
  } catch (err) {
    console.warn("Firestore unreachable – using static lecturers", err);
    lecturers = [...staticLecturers];
  }

  refreshFiltersAndList();
}

function normalise(id, data) {
  // Guarantee common shape
  return {
    id,
    name: data.name,
    university: data.university || "UZ",
    modules: data.modules || (data.module ? [data.module] : []),
    sprite: data.sprite || "images/sprites/placeholder.png",
    avgRating: data.avgRating || 0,
    numRatings: data.numRatings || 0
  };
}

/* === 6. UI helpers =================================================== */
function bindUI() {
  searchBar.addEventListener("input", filterAndRender);
  uniFilter.addEventListener("change", filterAndRender);
  moduleFilter.addEventListener("change", filterAndRender);
  form.addEventListener("submit", handleSubmit);
}

function refreshFiltersAndList() {
  populateModuleFilter();
  filterAndRender();
}

function populateModuleFilter() {
  const modules = new Set();
  lecturers.forEach((l) => l.modules.forEach((m) => modules.add(m)));
  moduleFilter.innerHTML = '<option value="">All Modules</option>';
  [...modules].sort().forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    moduleFilter.appendChild(opt);
  });
}

function filterAndRender() {
  const term   = searchBar.value.toLowerCase();
  const uni    = uniFilter.value;
  const module = moduleFilter.value;

  const filtered = lecturers.filter((l) =>
    (!term   || l.name.toLowerCase().includes(term)) &&
    (!uni    || l.university === uni) &&
    (!module || l.modules.includes(module))
  );

  renderList(filtered);
}

/* === 7. Render ======================================================= */
function renderList(data) {
  listEl.innerHTML = "";
  if (!data.length) {
    listEl.textContent = "No lecturers match your criteria.";
    return;
  }

  data.forEach((lec) => {
    const card = document.createElement("article");
    card.className = "lecturer-card";
    card.innerHTML = `
      <img src="${lec.sprite}" alt="${lec.name}" class="lecturer-sprite">
      <h3>${lec.name}</h3>
      <p class="small"><strong>${lec.university}</strong> — ${lec.modules.join(", ")}</p>
      <div class="rating-summary">
        ${starRowHTML(Math.round(lec.avgRating))}
        <span>${lec.avgRating.toFixed(1)} / 5</span>
        <span>(${lec.numRatings})</span>
      </div>
      <button data-id="${lec.id}">Rate</button>
    `;
    card.querySelector("button").addEventListener("click", () => openModal(lec));
    listEl.appendChild(card);
  });
}

function starRowHTML(full) {
  return Array.from({ length: 5 }, (_, i) => `<span class="star">${i < full ? "★" : "☆"}</span>`).join("");
}

/* === 8. Modal logic ================================================== */
function openModal(lec) {
  currentLecturer = lec;
  lecNameLbl.textContent = lec.name;
  lecMetaLbl.textContent = `— ${lec.university}, ${lec.modules.join(", ")}`;
  reviewBox.value = "";
  selectedRating  = 0;
  buildStarWidget();
  modal.classList.remove("hidden");
}
window.closeForm = () => modal.classList.add("hidden");

function buildStarWidget() {
  starsWrap.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.className = "star-icon";
    star.textContent = "☆";
    star.tabIndex = 0;
    star.addEventListener("mouseover", () => highlightStars(i));
    star.addEventListener("focus",   () => highlightStars(i));
    star.addEventListener("click",   () => setRating(i));
    starsWrap.appendChild(star);
  }
  highlightStars(0);
}

function highlightStars(n) {
  [...starsWrap.children].forEach((s, idx) => {
    s.textContent = idx < n ? "★" : "☆";
    s.classList.toggle("hovered", idx < n);
  });
}

function setRating(val) {
  selectedRating = val;
  [...starsWrap.children].forEach((s, idx) => {
    s.textContent = idx < val ? "★" : "☆";
    s.classList.toggle("active", idx < val);
  });
}

/* === 9. Submit review =============================================== */
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
    // 9.1 – Ensure lecturer doc exists (for static seed)
    const lecRef = doc(db, "lecturers", currentLecturer.id);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(lecRef);
      if (!snap.exists()) {
        // Seed new doc with basic fields
        tx.set(lecRef, {
          name: currentLecturer.name,
          university: currentLecturer.university,
          modules: currentLecturer.modules,
          avgRating: 0,
          numRatings: 0,
          sprite: currentLecturer.sprite
        });
      }
    });

    // 9.2 – Add review sub‑doc
    const revCol = collection(db, "lecturers", currentLecturer.id, "reviews");
    await addDoc(revCol, review);

    // 9.3 – Update aggregates atomically
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
    alert("Sorry, could not save your review right now.");
  }
}
