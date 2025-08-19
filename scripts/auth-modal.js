// scripts/auth-modal.js
// Replaces previous DOMContentLoaded-based wiring with event-driven wiring
(() => {
  let modalReady = false;
  let headerReady = false;
  let pendingShow = null; // true => show login, false => show signup

  // Local references (populated when modal is loaded)
  let authModal, loginContainer, signupContainer,
      loginForm, signupForm, switchToSignupBtn, switchToLoginBtn,
      closeMo// scripts/auth-modal.js
// Real Firebase Auth integration with proper modal display handling
import { registerUser, loginUser, logoutUser, onAuthChange, getUserProfile } from './auth-service.js';

(() => {
  let modalReady = false;
  let headerReady = false;
  let pendingShow = null;
  let currentUser = null;

  // Modal elements
  let authModal, loginContainer, signupContainer,
      loginForm, signupForm, switchToSignupBtn, switchToLoginBtn,
      closeModalBtn, userRoleSelect, studentFields, lawyerFields,
      loginError, signupError;

  // Auth state listener
  function initAuthStateListener() {
    onAuthChange(async (user) => {
      currentUser = user;
      if (user) {
        const profile = await getUserProfile(user.uid);
        updateAuthUI(true, { 
          email: user.email, 
          username: profile?.username || user.email.split('@')[0],
          ...profile 
        });
      } else {
        updateAuthUI(false);
      }
    });
  }

  function clearErrors() {
    if (loginError) loginError.textContent = "";
    if (signupError) signupError.textContent = "";
  }

  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    }
  }

  function hideRoleSpecificFields() {
    if (studentFields) {
      studentFields.classList.add("hidden");
      const inputs = studentFields.querySelectorAll("input, select");
      inputs.forEach(input => {
        input.removeAttribute("required");
        input.value = "";
      });
    }
    
    if (lawyerFields) {
      lawyerFields.classList.add("hidden");
      const inputs = lawyerFields.querySelectorAll("input, select");
      inputs.forEach(input => {
        input.removeAttribute("required");
        input.value = "";
      });
    }
  }

  function showRoleSpecificFields(role) {
    hideRoleSpecificFields();
    
    if (role === "student" && studentFields) {
      studentFields.classList.remove("hidden");
      const inputs = studentFields.querySelectorAll("input, select");
      inputs.forEach(input => input.setAttribute("required", ""));
    } else if (role === "lawyer" && lawyerFields) {
      lawyerFields.classList.remove("hidden");
      const inputs = lawyerFields.querySelectorAll("input, select");
      inputs.forEach(input => input.setAttribute("required", ""));
    }
  }

  function showModal(showLogin = true) {
    if (!modalReady || !authModal) {
      pendingShow = Boolean(showLogin);
      return;
    }

    clearErrors();
    hideRoleSpecificFields();
    
    // Show modal with proper display
    authModal.classList.remove("hidden");
    authModal.style.display = "flex";
    setTimeout(() => {
      authModal.classList.add("show");
    }, 10);
    
    document.body.classList.add("no-scroll");

    // Show correct form
    if (showLogin) {
      if (loginContainer) {
        loginContainer.classList.remove("hidden");
        loginContainer.style.display = "block";
      }
      if (signupContainer) {
        signupContainer.classList.add("hidden");
        signupContainer.style.display = "none";
      }
      if (switchToLoginBtn) switchToLoginBtn.classList.add("active");
      if (switchToSignupBtn) switchToSignupBtn.classList.remove("active");
    } else {
      if (signupContainer) {
        signupContainer.classList.remove("hidden");
        signupContainer.style.display = "block";
      }
      if (loginContainer) {
        loginContainer.classList.add("hidden");
        loginContainer.style.display = "none";
      }
      if (switchToSignupBtn) switchToSignupBtn.classList.add("active");
      if (switchToLoginBtn) switchToLoginBtn.classList.remove("active");
    }
  }

  function hideModal() {
    if (!authModal) return;
    
    authModal.classList.remove("show");
    document.body.classList.remove("no-scroll");

    // Reset forms
    if (loginForm) loginForm.reset();
    if (signupForm) signupForm.reset();
    clearErrors();
    hideRoleSpecificFields();

    setTimeout(() => {
      authModal.classList.add("hidden");
      authModal.style.display = "none";
    }, 300);
  }

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

    // Validate role-specific fields
    if (role === "student") {
      const studentId = formData.get("student-id");
      const university = formData.get("student-university");
      const yearOfStudy = formData.get("student-year-of-study");
      
      if (!studentId || studentId.trim().length === 0) return "Student ID is required";
      if (!university) return "Please select your university";
      if (!yearOfStudy) return "Please select your year of study";
    } else if (role === "lawyer") {
      const yearsExperience = formData.get("lawyer-years-experience");
      const lawyerNumber = formData.get("lawyer-number");
      
      if (!lawyerNumber || lawyerNumber.trim().length === 0) return "Lawyer Bar Number/ID is required";
      if (yearsExperience === null || yearsExperience === "" || yearsExperience < 0) {
        return "Please enter valid years of experience";
      }
      if (parseInt(yearsExperience) > 60) return "Years of experience seems too high. Please verify.";
    }

    return null;
  }

  async function handleLogin(e) {
    e.preventDefault();
    clearErrors();
    
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Logging in...";
      
      const formData = new FormData(loginForm);
      const email = formData.get("login-email");
      const password = formData.get("login-password");
      
      if (!email || !password) {
        showError(loginError, "Please fill in all fields");
        return;
      }

      await loginUser(email, password);
      hideModal();
      
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please try again.";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled.";
          break;
      }
      
      showError(loginError, errorMessage);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    clearErrors();
    
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating account...";
      
      const formData = new FormData(signupForm);
      const validationError = validateSignupForm(formData);
      
      if (validationError) {
        showError(signupError, validationError);
        return;
      }

      const email = formData.get("signup-email");
      const password = formData.get("signup-password");
      const username = formData.get("signup-username");
      const role = formData.get("user-role");

      // Prepare user data
      const userData = {
        username,
        role,
        profileData: {}
      };

      // Add role-specific data
      if (role === "student") {
        userData.idType = "student_id";
        userData.plainTextSensitiveId = formData.get("student-id");
        userData.profileData.university = formData.get("student-university");
        userData.profileData.yearOfStudy = formData.get("student-year-of-study");
      } else if (role === "lawyer") {
        userData.idType = "lawyer_number";
        userData.plainTextSensitiveId = formData.get("lawyer-number");
        userData.profileData.yearsExperience = parseInt(formData.get("lawyer-years-experience"));
      }

      await registerUser(email, password, userData);
      hideModal();
      
      // Show success message
      setTimeout(() => {
        alert("Account created successfully! Welcome to LSIF!");
      }, 500);
      
    } catch (error) {
      console.error("Signup error:", error);
      let errorMessage = "Registration failed. Please try again.";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/weak-password':
        case 'auth/weak-password-client':
          errorMessage = "Password must be at least 8 characters with uppercase, lowercase, number, and special character.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password accounts are not enabled.";
          break;
      }
      
      showError(signupError, errorMessage);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
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
      
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          try {
            await logoutUser();
          } catch (error) {
            console.error("Logout error:", error);
          }
        });
      }
    } else {
      authControls.innerHTML = `
        <button id="login-btn" class="auth-action open-auth-modal">Login</button>
        <button id="signup-btn" class="auth-action open-auth-modal">Sign Up</button>
      `;
      bindHeaderButtons();
    }
  }

  function bindHeaderButtons() {
    const openLoginBtn = document.getElementById("login-btn");
    const openSignupBtn = document.getElementById("signup-btn");

    if (openLoginBtn) {
      openLoginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (modalReady) showModal(true);
        else pendingShow = true;
      });
    }

    if (openSignupBtn) {
      openSignupBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (modalReady) showModal(false);
        else pendingShow = false;
      });
    }
  }

  // Header loaded event
  document.addEventListener("header:loaded", () => {
    headerReady = true;
    bindHeaderButtons();
    
    if (modalReady && pendingShow !== null) {
      showModal(Boolean(pendingShow));
      pendingShow = null;
    }
  });

  // Modal loaded event
  document.addEventListener("authModal:loaded", () => {
    modalReady = true;

    // Get modal elements
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

    if (!authModal) {
      console.error("Auth modal not found after loading");
      return;
    }

    // Tab switching
    if (switchToSignupBtn) {
      switchToSignupBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (loginContainer) {
          loginContainer.classList.add("hidden");
          loginContainer.style.display = "none";
        }
        if (signupContainer) {
          signupContainer.classList.remove("hidden");
          signupContainer.style.display = "block";
        }
        switchToLoginBtn?.classList.remove("active");
        switchToSignupBtn.classList.add("active");
        clearErrors();
      });
    }

    if (switchToLoginBtn) {
      switchToLoginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (signupContainer) {
          signupContainer.classList.add("hidden");
          signupContainer.style.display = "none";
        }
        if (loginContainer) {
          loginContainer.classList.remove("hidden");
          loginContainer.style.display = "block";
        }
        switchToSignupBtn?.classList.remove("active");
        switchToLoginBtn.classList.add("active");
        clearErrors();
      });
    }

    // Close modal
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", hideModal);
    }

    // Click outside to close
    authModal.addEventListener("click", (e) => {
      if (e.target === authModal) hideModal();
    });

    // Role selection
    if (userRoleSelect) {
      userRoleSelect.addEventListener("change", (e) => {
        showRoleSpecificFields(e.target.value);
      });
    }

    // Form submissions
    if (loginForm) {
      loginForm.addEventListener("submit", handleLogin);
    }
    
    if (signupForm) {
      signupForm.addEventListener("submit", handleSignup);
    }

    // Handle pending show request
    if (headerReady && pendingShow !== null) {
      showModal(Boolean(pendingShow));
      pendingShow = null;
    }

    // Initialize auth state listener
    initAuthStateListener();
  });

  // ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && authModal && !authModal.classList.contains("hidden")) {
      hideModal();
    }
  });
})();dalBtn, userRoleSelect, studentFields, lawyerFields,
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

    console.log("Login attempt (demo):", { email });
    setTimeout(() => {
      alert("Login successful! (Demo)");
      hideModal();
      updateAuthUI(true, { email });
    }, 800);
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

    const userData = {
      username: fd.get("signup-username"),
      email: fd.get("signup-email"),
      role: fd.get("user-role")
    };

    if (userData.role === "student") {
      userData.studentId = fd.get("student-id");
      userData.university = fd.get("student-university");
      userData.yearOfStudy = fd.get("student-year-of-study");
    } else if (userData.role === "lawyer") {
      userData.yearsExperience = fd.get("lawyer-years-experience");
      userData.lawyerNumber = fd.get("lawyer-number");
    }

    console.log("Signup attempt (demo):", userData);
    setTimeout(() => {
      alert("Account created successfully! (Demo)");
      hideModal();
      updateAuthUI(true, userData);
    }, 800);
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
