// scripts/auth-modal.js
// Event-driven auth modal wiring (works with load-header.js events)
// Uses auth-service module for real registration/login
import { registerUser, loginUser, onAuthChange, logoutUser } from './auth-service.js';

/*
  Overview for a 12th-grader:
  - load-header.js injects header.html and auth-modal.html later.
  - We wait for those injections by listening to header:loaded and authModal:loaded events.
  - When header loads, we attach navbar button listeners (#login-btn, #signup-btn).
  - When modal loads, we attach modal internals (forms, tabs).
  - If the user clicks navbar before modal is loaded, we remember their intent and open modal when ready.
*/

let modalReady = false;
let headerReady = false;
let pendingShow = null; // null | true (login) | false (signup)

// DOM refs (populated when authModal:loaded fires)
let authModal, loginContainer, signupContainer, loginForm, signupForm;
let switchToSignupBtn, switchToLoginBtn, closeModalBtn;
let userRoleSelect, studentFields, lawyerFields;
let loginError, signupError;

// ---------- Utility helpers ----------
function clearErrors() {
  if (loginError) loginError.textContent = "";
  if (signupError) signupError.textContent = "";
}

function hideRoleSpecificFields() {
  studentFields?.classList.add("hidden");
  lawyerFields?.classList.add("hidden");
  studentFields?.querySelectorAll("input, select")?.forEach(i => i.removeAttribute("required"));
  lawyerFields?.querySelectorAll("input, select")?.forEach(i => i.removeAttribute("required"));
}

function showRoleSpecificFields(role) {
  hideRoleSpecificFields();
  if (role === "student") {
    studentFields?.classList.remove("hidden");
    studentFields?.querySelectorAll("input, select")?.forEach(i => i.setAttribute("required", ""));
  } else if (role === "lawyer") {
    lawyerFields?.classList.remove("hidden");
    lawyerFields?.querySelectorAll("input, select")?.forEach(i => i.setAttribute("required", ""));
  }
}

// Show/hide modal. If modal not ready yet, queue the request.
function showModal(showLogin = true) {
  if (!modalReady) {
    pendingShow = Boolean(showLogin);
    return;
  }

  clearErrors();
  authModal?.classList.remove("hidden");
  authModal?.classList.add("show");
  document.body.classList.add("no-scroll");

  if (showLogin) {
    loginContainer?.classList.remove("hidden");
    signupContainer?.classList.add("hidden");
    switchToLoginBtn?.classList.add("active");
    switchToSignupBtn?.classList.remove("active");
  } else {
    signupContainer?.classList.remove("hidden");
    loginContainer?.classList.add("hidden");
    switchToSignupBtn?.classList.add("active");
    switchToLoginBtn?.classList.remove("active");
  }
}

function hideModal() {
  if (!authModal) return;
  authModal.classList.remove("show");
  document.body.classList.remove("no-scroll");

  // reset forms & UI
  loginForm?.reset();
  signupForm?.reset();
  clearErrors();
  hideRoleSpecificFields();

  setTimeout(() => {
    authModal.classList.add("hidden");
  }, 300);
}

// map Firebase error codes to friendly messages
function getFirebaseErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use': return 'This email is already registered. Please use a different email or try logging in.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/weak-password': return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-not-found': return 'No account found with this email. Please check your email or sign up.';
    case 'auth/wrong-password': return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests': return 'Too many failed attempts. Please try again later.';
    default: return 'An error occurred. Please try again.';
  }
}

// ---------- Bind header navbar buttons ----------
function bindHeaderButtons() {
  const openLoginBtn = document.getElementById("login-btn");
  const openSignupBtn = document.getElementById("signup-btn");

  // remove any existing handlers to avoid double-bind when UI is re-rendered
  openLoginBtn?.replaceWith(openLoginBtn?.cloneNode(true));
  openSignupBtn?.replaceWith(openSignupBtn?.cloneNode(true));

  const refreshedLoginBtn = document.getElementById("login-btn");
  const refreshedSignupBtn = document.getElementById("signup-btn");

  refreshedLoginBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (modalReady) showModal(true);
    else pendingShow = true;
  });

  refreshedSignupBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (modalReady) showModal(false);
    else pendingShow = false;
  });
}

// Listen for header injection (load-header.js dispatches 'header:loaded')
document.addEventListener("header:loaded", () => {
  headerReady = true;
  bindHeaderButtons();
  // If modal already loaded and we had a pending action, perform it
  if (modalReady && pendingShow !== null) {
    showModal(Boolean(pendingShow));
    pendingShow = null;
  }
});

// ---------- When modal HTML is injected ----------
document.addEventListener("authModal:loaded", () => {
  modalReady = true;

  // grab modal elements now that modal exists
  authModal = document.getElementById("auth-modal");
  loginContainer = document.getElementById("login-form-container");
  signupContainer = document.getElementById("signup-form-container");
  loginForm = document.getElementById("login-form");
  signupForm = document.getElementById("signup-form");
  switchToSignupBtn = document.getElementById("show-signup");
  switchToLoginBtn = document.getElementById("show-login");
  closeModalBtn = document.querySelector(".close-auth-modal");
  userRoleSelect = document.getElementById("user-role");
  studentFields = document.getElementById("student-fields");
  lawyerFields = document.getElementById("lawyer-fields");
  loginError = document.getElementById("login-error-message");
  signupError = document.getElementById("signup-error-message");

  // safety logs (useful if something's missing)
  if (!authModal) console.warn("[auth-modal] auth-modal element missing after authModal:loaded");
  if (!loginForm || !signupForm) console.warn("[auth-modal] login/signup forms missing");

  // Internal tab button behavior (swap forms; do not re-open modal)
  switchToSignupBtn?.addEventListener("click", () => {
    loginContainer?.classList.add("hidden");
    signupContainer?.classList.remove("hidden");
    switchToSignupBtn?.classList.add("active");
    switchToLoginBtn?.classList.remove("active");
  });

  switchToLoginBtn?.addEventListener("click", () => {
    signupContainer?.classList.add("hidden");
    loginContainer?.classList.remove("hidden");
    switchToLoginBtn?.classList.add("active");
    switchToSignupBtn?.classList.remove("active");
  });

  // close modal
  closeModalBtn?.addEventListener("click", hideModal);

  // clicking outside modal content closes
  authModal?.addEventListener("click", (e) => {
    if (e.target === authModal) hideModal();
  });

  // role select
  userRoleSelect?.addEventListener("change", (e) => showRoleSpecificFields(e.target.value));

  // --------- Form submission handlers using auth-service ----------
  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const formData = new FormData(signupForm);
    const email = formData.get("signup-email");
    const password = formData.get("signup-password");
    const confirmPassword = formData.get("signup-confirm-password");
    const username = formData.get("signup-username");
    const role = formData.get("user-role");

    // Basic validation (keeps it simple)
    if (password !== confirmPassword) {
      signupError.textContent = "Passwords don't match!";
      return;
    }
    if (password.length < 6) {
      signupError.textContent = "Password must be at least 6 characters!";
      return;
    }
    if (!role) {
      signupError.textContent = "Please select your role!";
      return;
    }

    // build userData object and role-specific checks
    const userData = { username, role, profileData: {} };

    if (role === "student") {
      const studentId = formData.get("student-id");
      const university = formData.get("student-university");
      const yearOfStudy = formData.get("student-year-of-study");
      if (!studentId || !university || !yearOfStudy) {
        signupError.textContent = "Please fill in all student fields!";
        return;
      }
      userData.idType = "student_id";
      userData.plainTextSensitiveId = studentId;
      userData.profileData = { university, yearOfStudy: parseInt(yearOfStudy, 10) };
    } else if (role === "lawyer") {
      const lawyerNumber = formData.get("lawyer-number");
      const yearsExperience = formData.get("lawyer-years-experience");
      if (!lawyerNumber || !yearsExperience) {
        signupError.textContent = "Please fill in all lawyer fields!";
        return;
      }
      userData.idType = "lawyer_id";
      userData.plainTextSensitiveId = lawyerNumber;
      userData.profileData = { yearsExperience: parseInt(yearsExperience, 10) };
    }

    try {
      await registerUser(email, password, userData);
      hideModal();
      // logged in state will be handled by onAuthChange below
    } catch (err) {
      console.error("Registration error:", err);
      signupError.textContent = getFirebaseErrorMessage(err?.code);
    }
  });

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const formData = new FormData(loginForm);
    const email = formData.get("login-email");
    const password = formData.get("login-password");

    if (!email || !password) {
      loginError.textContent = "Please fill in all fields";
      return;
    }

    try {
      await loginUser(email, password);
      hideModal();
      // logged-in UI update handled by onAuthChange
    } catch (err) {
      console.error("Login error:", err);
      loginError.textContent = getFirebaseErrorMessage(err?.code);
    }
  });

  // If header already loaded and user clicked earlier, open modal now
  if (headerReady && pendingShow !== null) {
    showModal(Boolean(pendingShow));
    pendingShow = null;
  }
});

// allow ESC to close if modal exists
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && authModal && !authModal.classList.contains("hidden")) {
    hideModal();
  }
});

// ---------- Auth state handling (updates header controls) ----------
onAuthChange((user) => {
  const authControls = document.getElementById("auth-controls");
  if (!authControls) return;

  if (user) {
    // show logged-in UI
    authControls.innerHTML = `
      <span class="user-greeting">Welcome, ${user.email}</span>
      <button id="logout-btn" class="auth-action">Logout</button>
    `;
    document.getElementById("logout-btn")?.addEventListener("click", async () => {
      try {
        await logoutUser();
      } catch (err) {
        console.error("Logout error:", err);
      }
    });
  } else {
    // revert to login/signup buttons
    authControls.innerHTML = `
      <button id="login-btn" class="auth-action open-auth-modal">Login</button>
      <button id="signup-btn" class="auth-action open-auth-modal">Sign Up</button>
    `;
    // rebind header buttons so they work again
    bindHeaderButtons();
  }
});
