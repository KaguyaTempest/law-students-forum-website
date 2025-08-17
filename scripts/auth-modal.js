// scripts/auth-modal.js
// Replaces previous DOMContentLoaded-based wiring with event-driven wiring
import { registerUser, loginUser, logoutUser } from './auth-service.js';

(() => {
  let modalReady = false;
  let headerReady = false;
  let pendingShow = null; // true => show login, false => show signup

  // Local references (populated when modal is loaded)
  let authModal, loginContainer, signupContainer,
      loginForm, signupForm, switchToSignupBtn, switchToLoginBtn,
      closeModalBtn, userRoleSelect, studentFields, lawyerFields,
      loginError, signupError;

  // Utility: clear errors and role fields
  function clearErrors() {
    if (loginError) loginError.textContent = "";
    if (signupError) signupError.textContent = "";
  }

  function hideRoleSpecificFields() {
    studentFields?.classList.add("hidden");
    lawyerFields?.classList.add("hidden");
    const studentInputs = studentFields?.querySelectorAll("input, select");
    const lawyerInputs = lawyerFields?.querySelectorAll("input, select");
    studentInputs?.forEach(i => i.removeAttribute("required"));
    lawyerInputs?.forEach(i => i.removeAttribute("required"));
  }

  function showRoleSpecificFields(role) {
    hideRoleSpecificFields();
    if (role === "student") {
      studentFields?.classList.remove("hidden");
      const studentInputs = studentFields?.querySelectorAll("input, select");
      studentInputs?.forEach(i => i.setAttribute("required", ""));
    } else if (role === "lawyer") {
      lawyerFields?.classList.remove("hidden");
      const lawyerInputs = lawyerFields?.querySelectorAll("input, select");
      lawyerInputs?.forEach(i => i.setAttribute("required", ""));
    }
  }

  // Show modal (true => login, false => signup)
  function showModal(showLogin = true) {
    if (!authModal) {
      // modal not yet ready; queue the request and return
      pendingShow = Boolean(showLogin);
      return;
    }

    clearErrors();
    authModal.classList.remove("hidden");
    authModal.classList.add("show");
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

    // reset forms & state
    loginForm?.reset();
    signupForm?.reset();
    clearErrors();
    hideRoleSpecificFields();

    setTimeout(() => {
      authModal.classList.add("hidden");
    }, 300);
  }

  // Signup validation (keeps your logic)
  function validateSignupForm(formData) {
    const password = formData.get("signup-password");
    const confirmPassword = formData.get("signup-confirm-password");
    const email = formData.get("signup-email");
    const username = formData.get("signup-username");
    const role = formData.get("user-role");

    if (!username || username.length < 3) return "Username must be at least 3 characters long";
    if (!email || !email.includes("@")) return "Please enter a valid email address";
    if (!password || password.length < 6) return "Password must be at least 6 characters long";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!role) return "Please select your role";

    if (role === "student") {
      const studentId = formData.get("student-id");
      const university = formData.get("student-university");
      const yearOfStudy = formData.get("student-year-of-study");
      if (!studentId) return "Student ID is required";
      if (!university) return "Please select your university";
      if (!yearOfStudy || yearOfStudy < 1 || yearOfStudy > 7) return "Please select a valid year of study (1-7)";
    } else if (role === "lawyer") {
      const yearsExperience = formData.get("lawyer-years-experience");
      const lawyerNumber = formData.get("lawyer-number");
      if (!lawyerNumber) return "Lawyer Bar Number/ID is required";
      if (!yearsExperience || yearsExperience < 0) return "Please enter valid years of experience (0 or more)";
      if (yearsExperience > 60) return "Years of experience seems too high. Please verify.";
    }

    return null;
  }

  // Default demo handlers (you can replace with real auth-service calls)
  async function handleLogin(e) {
    e.preventDefault();
    clearErrors();
    const fd = new FormData(loginForm);
    const email = fd.get("login-email");
    const password = fd.get("login-password");
    if (!email || !password) {
      if (loginError) loginError.textContent = "Please fill in all fields";
      return;
    }
    
    try {
    const user = await loginUser(email, password); // real Firebase login
    alert("Login successful!");
    hideModal();
    updateAuthUI(true, { email: user.email });
  } catch (err) {
    if (loginError) loginError.textContent = err.message;
  }
}
  async function handleSignup(e) {
    e.preventDefault();
    clearErrors();
    const fd = new FormData(signupForm);
    const validationError = validateSignupForm(fd);
    if (validationError) {
      if (signupError) signupError.textContent = validationError;
      return;
    }

    try {
    const user = await registerUser(fd.get("signup-email"), fd.get("signup-password"), {
      username: fd.get("signup-username"),
      role: fd.get("user-role"),
      idType: fd.get("user-role") === "student" ? "studentId" : "lawyerNumber",
      plainTextSensitiveId: fd.get("user-role") === "student" ? fd.get("student-id") : fd.get("lawyer-number"),
      profileData: {
        university: fd.get("student-university"),
        yearOfStudy: fd.get("student-year-of-study"),
        yearsExperience: fd.get("lawyer-years-experience")
      }
    });

    alert("Account created successfully!");
    hideModal();
    updateAuthUI(true, { username: fd.get("signup-username"), email: user.email });
  } catch (err) {
    if (signupError) signupError.textContent = err.message;
  }
}

  function updateAuthUI(isLoggedIn, userData = null) {
    const authControls = document.getElementById("auth-controls");
    if (!authControls) return;
    if (isLoggedIn && userData) {
      authControls.innerHTML = `
        <span class="user-greeting">Welcome, ${userData.username || userData.email}</span>
        <button id="logout-btn" class="auth-action">Logout</button>
      `;
      document.getElementById("logout-btn")?.addEventListener("click", () => location.reload());
    } else {
      // fallback to default buttons if needed
      authControls.innerHTML = `
        <button id="login-btn" class="auth-action open-auth-modal">Login</button>
        <button id="signup-btn" class="auth-action open-auth-modal">Sign Up</button>
      `;
      // Re-bind header buttons after replacing HTML
      bindHeaderButtons();
    }
  }

  // Bind header navbar buttons (called when header:loaded)
  function bindHeaderButtons() {
    const openLoginBtn = document.getElementById("login-btn");
    const openSignupBtn = document.getElementById("signup-btn");

    openLoginBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      // If modal ready, show immediately; otherwise queue
      if (modalReady) showModal(true);
      else pendingShow = true;
    });

    openSignupBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      if (modalReady) showModal(false);
      else pendingShow = false;
    });
  }

  // When header has been injected
  document.addEventListener("header:loaded", () => {
    headerReady = true;
    bindHeaderButtons();
    // If modal already loaded and a pending show was queued from header before modal load, handle it
    if (modalReady && pendingShow !== null) {
      showModal(Boolean(pendingShow));
      pendingShow = null;
    }
  });

  // When modal has been injected
  document.addEventListener("authModal:loaded", () => {
    modalReady = true;

    // Query modal internals now that modal exists in DOM
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

    // Safety checks (log if required pieces are missing)
    if (!authModal) console.warn("[auth-modal] auth-modal not found in DOM after authModal:loaded");
    if (!loginContainer || !signupContainer) console.warn("[auth-modal] login/signup containers missing");

    // Internal tab swapping (does not re-open modal)
    switchToSignupBtn?.addEventListener("click", () => {
      loginContainer?.classList.add("hidden");
      loginContainer?.classList.remove("active");
      signupContainer?.classList.remove("hidden");
      signupContainer?.classList.add("active");
      switchToLoginBtn?.classList.remove("active");
      switchToSignupBtn?.classList.add("active");
    });

    switchToLoginBtn?.addEventListener("click", () => {
      signupContainer?.classList.add("hidden");
      signupContainer?.classList.remove("active");
      loginContainer?.classList.remove("hidden");
      loginContainer?.classList.add("active");
      switchToSignupBtn?.classList.remove("active");
      switchToLoginBtn?.classList.add("active");
    });

    // Close modal button
    closeModalBtn?.addEventListener("click", hideModal);

    // Click outside modal content closes modal
    authModal?.addEventListener("click", (e) => {
      if (e.target === authModal) hideModal();
    });

    // Role select
    userRoleSelect?.addEventListener("change", (e) => showRoleSpecificFields(e.target.value));

    // Form submit handlers
    loginForm?.addEventListener("submit", handleLogin);
    signupForm?.addEventListener("submit", handleSignup);

    // If header was already loaded and a header click queued a pending show, open modal now
    if (headerReady && pendingShow !== null) {
      showModal(Boolean(pendingShow));
      pendingShow = null;
    }
  });

  // Also allow ESC to close modal if modal exists
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && authModal && !authModal.classList.contains("hidden")) {
      hideModal();
    }
  });
})();

