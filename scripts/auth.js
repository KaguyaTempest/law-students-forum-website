/* ──────────────────────────────────────────────────────────────
   auth.js   – modular Firebase version
   Imports:  auth (Firebase Auth), db (Realtime DB) from firebase.js
─────────────────────────────────────────────────────────────── */

import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
  ref,
  set,
  get,
  child,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

document.addEventListener('DOMContentLoaded', () => {
  /* ── DOM refs ────────────────────────────────────────────── */
  const showSignupBtn        = document.getElementById('show-signup');
  const showLoginBtn         = document.getElementById('show-login');
  const signupFormContainer  = document.getElementById('signup-form-container');
  const loginFormContainer   = document.getElementById('login-form-container');

  const signupForm           = document.getElementById('signup-form');
  const loginForm            = document.getElementById('login-form');

  const signupErr            = document.getElementById('signup-error-message');
  const loginErr             = document.getElementById('login-error-message');

  const userRoleSelect       = document.getElementById('user-role');
  const studentFields        = document.getElementById('student-fields');
  const lawyerFields         = document.getElementById('lawyer-fields');

  const authModal            = document.getElementById('auth-modal');
  const closeBtn             = document.querySelector('.close-auth-modal');
  const openAuthBtns         = document.querySelectorAll('.open-auth-modal');

  /* ── Helpers ─────────────────────────────────────────────── */
  const clearMsgs = () => { signupErr.textContent = ''; loginErr.textContent = ''; };
  const hide      = el => el?.classList.add('hidden');
  const show      = el => el?.classList.remove('hidden');

  /* ── Role-specific field toggle ──────────────────────────── */
  userRoleSelect?.addEventListener('change', () => {
    const role = userRoleSelect.value;
    studentFields?.classList.toggle('hidden', role !== 'student');
    lawyerFields?.classList.toggle('hidden',  role !== 'lawyer');
  });

  /* ─────────────────────────────
     Signup
  ───────────────────────────── */
  signupForm?.addEventListener('submit', async e => {
    e.preventDefault();
    clearMsgs();

    const email    = signupForm['signup-email'].value.trim();
    const password = signupForm['signup-password'].value;
    const confirm  = signupForm['signup-confirm-password'].value;
    const username = signupForm['signup-username'].value.trim();
    const role     = userRoleSelect.value;

    if (!username)          return signupErr.textContent = 'Enter a username.';
    if (password !== confirm) return signupErr.textContent = 'Passwords do not match.';
    if (!role)              return signupErr.textContent = 'Select your role.';

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      /* build user profile object */
      const profile = {
        username,
        email,
        role,
        status: role === 'student' ? 'law_student'
               : role === 'lawyer' ? 'lawyer'
               : 'spectator',
        createdAt: Date.now()
      };

      if (role === 'student') {
        profile.studentId      = signupForm['student-id'].value;
        profile.university     = signupForm['student-university'].value;
        profile.yearOfStudy    = signupForm['student-year-of-study'].value;
      }
      if (role === 'lawyer') {
        profile.yearsExperience = signupForm['lawyer-years-experience'].value;
      }

      await set(ref(db, `users/${cred.user.uid}`), profile);

      alert('Account created! Please log in.');
      signupForm.reset();
      showLoginBtn.click();
    } catch (err) {
      signupErr.textContent = err.message;
    }
  });

  /* ─────────────────────────────
     Login
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
    } catch (err) { loginErr.textContent = err.message; }
  });

  /* ─────────────────────────────
     Auth-state UI toggle
  ───────────────────────────── */
  onAuthStateChanged(auth, async user => {
    const authBtns = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');

    if (!authBtns || !userInfo) return;

    if (user) {
      authBtns.classList.add('hidden');
      userInfo.classList.remove('hidden');

      // pull custom data
      const snap = await get(child(ref(db), `users/${user.uid}`));
      const data = snap.exists() ? snap.val() : {};

      document.getElementById('user-name').textContent =
        data.username || user.email;

      document.getElementById('user-role-badge').textContent =
        data.university || data.status || '';
    } else {
      authBtns.classList.remove('hidden');
      userInfo.classList.add('hidden');
    }
  });

  /* ─────────────────────────────
     Modal open/close logic
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
    show(loginFormContainer);  hide(signupFormContainer);
    showLoginBtn.classList.add('active');
    showSignupBtn.classList.remove('active');
    clearMsgs();
  });

  /* ─────────────────────────────
     Global logout button listener
  ───────────────────────────── */
  document.addEventListener('click', e => {
    if (e.target.id === 'logout-btn') signOut(auth);
  });
});
