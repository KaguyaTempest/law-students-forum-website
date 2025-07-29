// scripts/Auth.js

// Imports from your local firebase.js file (now includes 'functions')
import { auth, db, functions } from './firebase.js';

// Imports for Firebase Authentication methods (keep these as they are)
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// --- NEW/UPDATED IMPORTS FOR FIRESTORE AND CLOUD FUNCTIONS ---
// Firestore methods (use these instead of Realtime DB methods)
import {
  doc,       // To reference a document
  setDoc,    // To set/update a document
  getDoc,    // To get a document
  serverTimestamp // To get a server-generated timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Cloud Functions client method (to call your deployed functions)
import {
  httpsCallable
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';


// --- NEW: References to your callable Cloud Functions ---
// These allow you to call your deployed backend functions from the frontend
const hashSensitiveIdCallable = httpsCallable(functions, 'hashSensitiveId');
const verifySensitiveIdCallable = httpsCallable(functions, 'verifySensitiveId');


document.addEventListener('DOMContentLoaded', () => {
  /* ── DOM refs (Keep as is) ──────────────────────────────── */
  const showSignupBtn = document.getElementById('show-signup');
  const showLoginBtn = document.getElementById('show-login');
  const signupFormContainer = document.getElementById('signup-form-container');
  const loginFormContainer = document.getElementById('login-form-container');

  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  const signupErr = document.getElementById('signup-error-message');
  const loginErr = document.getElementById('login-error-message');

  const userRoleSelect = document.getElementById('user-role');
  const studentFields = document.getElementById('student-fields');
  const lawyerFields = document.getElementById('lawyer-fields');

  const authModal = document.getElementById('auth-modal');
  const closeBtn = document.querySelector('.close-auth-modal');
  const openAuthBtns = document.querySelectorAll('.open-auth-modal');

  /* ── Helpers (Keep as is) ───────────────────────────────── */
  const clearMsgs = () => { signupErr.textContent = ''; loginErr.textContent = ''; };
  const hide = el => el?.classList.add('hidden');
  const show = el => el?.classList.remove('hidden');

  /* ── Role-specific field toggle (Keep as is) ─────────────── */
  userRoleSelect?.addEventListener('change', () => {
    const role = userRoleSelect.value;
    studentFields?.classList.toggle('hidden', role !== 'student');
    lawyerFields?.classList.toggle('hidden', role !== 'lawyer');
  });

  /* ─────────────────────────────
    Signup (UPDATED LOGIC)
  ───────────────────────────── */
  signupForm?.addEventListener('submit', async e => {
    e.preventDefault();
    clearMsgs();

    const email = signupForm['signup-email'].value.trim();
    const password = signupForm['signup-password'].value;
    const confirm = signupForm['signup-confirm-password'].value;
    const username = signupForm['signup-username'].value.trim();
    const role = userRoleSelect.value;

    // --- Sensitive IDs (to be sent to Cloud Function) ---
    let plainTextSensitiveId = '';
    let idType = '';

    if (role === 'student') {
      plainTextSensitiveId = signupForm['student-id'].value;
      idType = 'studentId';
    } else if (role === 'lawyer') {
      plainTextSensitiveId = signupForm['lawyer-number'].value; // Corrected ID field name for lawyer
      idType = 'lawyerNumber';
    }

    // --- Basic Client-Side Validations ---
    if (!username) return signupErr.textContent = 'Enter a username.';
    if (password !== confirm) return signupErr.textContent = 'Passwords do not match.';
    if (!role) return signupErr.textContent = 'Select your role.';
    if ((role === 'student' || role === 'lawyer') && !plainTextSensitiveId) {
      return signupErr.textContent = `Please enter your ${idType === 'studentId' ? 'student ID' : 'lawyer number'}.`;
    }

    try {
      // 1. Create user with Firebase Authentication
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Firebase Auth user created:", cred.user.uid);

      // 2. Prepare user profile data to be stored directly in Firestore (NON-SENSITIVE)
      const userProfileData = {
        username,
        email,
        role,
        status: role === 'student' ? 'law_student'
               : role === 'lawyer' ? 'lawyer'
               : 'spectator',
        createdAt: serverTimestamp() // Use Firestore's serverTimestamp
      };

      if (role === 'student') {
        userProfileData.university = signupForm['student-university'].value;
        userProfileData.yearOfStudy = signupForm['student-year-of-study'].value;
      }
      if (role === 'lawyer') {
        userProfileData.yearsExperience = signupForm['lawyer-years-experience'].value;
      }

      // 3. Store the non-sensitive profile data in Firestore
      // Use doc() and setDoc() for Firestore
      const userDocRef = doc(db, 'users', cred.user.uid);
      await setDoc(userDocRef, userProfileData, { merge: true }); // Use merge:true to ensure sensitiveIds added by function are kept

      // 4. Call the Cloud Function to hash and store the sensitive ID
      // This will add the 'sensitiveIds' map to the user's Firestore document
      if (idType && plainTextSensitiveId) {
        const hashResult = await hashSensitiveIdCallable({ idType, plainTextId: plainTextSensitiveId });
        console.log("Sensitive ID hashing result:", hashResult.data.message);
      }

      alert('Account created! Please log in.');
      signupForm.reset();
      showLoginBtn.click(); // Automatically switch to login form
    } catch (err) {
      console.error("Error during signup:", err); // Log full error for debugging
      signupErr.textContent = err.message;
    }
  });

  /* ─────────────────────────────
    Login (Keep as is, no changes needed for this)
  ───────────────────────────── */
  loginForm?.addEventListener('submit', async e => {
    e.preventDefault();
    clearMsgs();
    try {
      await signInWithEmailAndPassword(
        auth,
        loginForm['login-email'].value,
        loginForm['login-password'].value
      );
      authModal?.classList.add('hidden');
    } catch (err) {
      console.error("Error during login:", err); // Log full error for debugging
      loginErr.textContent = err.message;
    }
  });

  /* ─────────────────────────────
    Auth-state UI toggle (UPDATED LOGIC for Firestore)
  ───────────────────────────── */
  onAuthStateChanged(auth, async user => {
    const authBtns = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');

    if (!authBtns || !userInfo) return;

    if (user) {
      authBtns.classList.add('hidden');
      userInfo.classList.remove('hidden');

      // --- Pull custom data from Firestore ---
      const userDocRef = doc(db, 'users', user.uid); // Reference the Firestore document
      const snap = await getDoc(userDocRef);       // Get the document snapshot
      const data = snap.exists() ? snap.data() : {}; // Get data if document exists

      document.getElementById('user-name').textContent =
        data.username || user.email;

      document.getElementById('user-role-badge').textContent =
        data.university || data.status || ''; // Adjust based on your display preference
    } else {
      authBtns.classList.remove('hidden');
      userInfo.classList.add('hidden');
    }
  });

  /* ─────────────────────────────
    Modal open/close logic (Keep as is)
  ───────────────────────────── */
  openAuthBtns.forEach(btn =>
    btn.addEventListener('click', () => {
      clearMsgs();
      show(authModal);

      const openingSignup = btn.id === 'signup-btn';

      // toggle the inner forms
      if (openingSignup) {
        show(signupFormContainer);
        hide(loginFormContainer);
        showSignupBtn.classList.add('active');
        showLoginBtn.classList.remove('active');
      } else {
        show(loginFormContainer);
        hide(signupFormContainer);
        showLoginBtn.classList.add('active');
        showSignupBtn.classList.remove('active');
      }
    })
  );

  closeBtn?.addEventListener('click', () => hide(authModal));

  showSignupBtn?.addEventListener('click', () => {
    show(signupFormContainer); hide(loginFormContainer);
    showSignupBtn.classList.add('active');
    showLoginBtn.classList.remove('active');
    clearMsgs();
  });

  showLoginBtn?.addEventListener('click', () => {
    show(loginFormContainer); hide(signupFormContainer);
    showLoginBtn.classList.add('active');
    showSignupBtn.classList.remove('active');
    clearMsgs();
  });

  /* ─────────────────────────────
    Global logout button listener (Keep as is)
  ───────────────────────────── */
  document.addEventListener('click', e => {
    if (e.target.id === 'logout-btn') signOut(auth);
  });

  // --- Optional: Example of how to call verifySensitiveId from client-side ---
  // You would integrate this into your UI wherever verification is needed (e.g., admin panel)
  // async function checkSensitiveId() {
  //   try {
  //     const result = await verifySensitiveIdCallable({ idType: 'studentId', plainTextIdToVerify: '12345' });
  //     console.log('Verification result:', result.data); // result.data will be { verified: true/false, message: "..." }
  //   } catch (error) {
  //     console.error('Error verifying ID:', error);
  //   }
  // }
  // (You would call checkSensitiveId() from a button click or similar event)

}); // End of DOMContentLoaded