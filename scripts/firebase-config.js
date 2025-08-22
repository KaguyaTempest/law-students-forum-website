// scripts/firebase.js

// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";


/* ── Firebase config ───────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyC0qWjJ8kt5jo1rOwNAd21RZ9QeK6pE7yU",
  authDomain: "lsif-cedb1.firebaseapp.com",
  databaseURL: "https://lsif-cedb1-default-rtdb.firebaseio.com", // This is fine; it's just a config value. 'db' is Firestore below.
  projectId: "lsif-cedb1",
  storageBucket: "lsif-cedb1.appspot.com",
  messagingSenderId: "761903090404",
  appId: "1:761903090404:web:0b7c914fa2c3599faebaf1",
  measurementId: "G-GGNJJSP3DJ"
};

/* ── Initialize & exports ───────────────── */
const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const auth = getAuth(app);
export const db = getFirestore(app); // This is correctly Firestore
export const functions = getFunctions(app, 'africa-south1'); // Match your region

export default app;