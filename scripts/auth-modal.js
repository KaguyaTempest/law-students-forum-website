document.addEventListener("DOMContentLoaded", () => {
  const authModal = document.getElementById("auth-modal");
  const openLoginBtn = document.getElementById("login-btn");
  const openSignupBtn = document.getElementById("signup-btn");
  const switchToSignupBtn = document.getElementById("show-signup");
  const switchToLoginBtn = document.getElementById("show-login");
  const closeModalBtn = document.querySelector(".close-auth-modal");

  const loginContainer = document.getElementById("login-form-container");
  const signupContainer = document.getElementById("signup-form-container");
  
  // Form elements
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const userRoleSelect = document.getElementById("user-role");
  const studentFields = document.getElementById("student-fields");
  const lawyerFields = document.getElementById("lawyer-fields");

  // Error message elements
  const loginError = document.getElementById("login-error-message");
  const signupError = document.getElementById("signup-error-message");

  // Show modal function
  function showModal(showLogin = true) {
    if (!authModal) return;

    // Show modal
    authModal.classList.remove("hidden");
    authModal.classList.add("show");
    document.body.classList.add("no-scroll");

    // Clear any previous errors
    clearErrors();

    if (showLogin) {
      // Show login form
      loginContainer.classList.remove("hidden");
      signupContainer.classList.add("hidden");
      
      // Update tab buttons
      switchToLoginBtn.classList.add("active");
      switchToSignupBtn.classList.remove("active");
    } else {
      // Show signup form
      signupContainer.classList.remove("hidden");
      loginContainer.classList.add("hidden");
      
      // Update tab buttons
      switchToSignupBtn.classList.add("active");
      switchToLoginBtn.classList.remove("active");
    }
  }

  // Hide modal function
  function hideModal() {
    authModal.classList.remove("show");
    document.body.classList.remove("no-scroll");
    
    // Clear forms
    loginForm?.reset();
    signupForm?.reset();
    clearErrors();
    hideRoleSpecificFields();

    setTimeout(() => {
      authModal.classList.add("hidden");
    }, 300);
  }

  // Clear error messages
  function clearErrors() {
    if (loginError) loginError.textContent = "";
    if (signupError) signupError.textContent = "";
  }

  // Hide all role-specific fields
  function hideRoleSpecificFields() {
    studentFields?.classList.add("hidden");
    lawyerFields?.classList.add("hidden");
    
    // Clear required attributes
    const studentInputs = studentFields?.querySelectorAll("input, select");
    const lawyerInputs = lawyerFields?.querySelectorAll("input, select");
    
    studentInputs?.forEach(input => input.removeAttribute("required"));
    lawyerInputs?.forEach(input => input.removeAttribute("required"));
  }

  // Show role-specific fields
  function showRoleSpecificFields(role) {
    hideRoleSpecificFields();
    
    if (role === "student") {
      studentFields?.classList.remove("hidden");
      // Add required attributes to student fields
      const studentInputs = studentFields?.querySelectorAll("input, select");
      studentInputs?.forEach(input => input.setAttribute("required", ""));
    } else if (role === "lawyer") {
      lawyerFields?.classList.remove("hidden");
      // Add required attributes to lawyer fields
      const lawyerInputs = lawyerFields?.querySelectorAll("input, select");
      lawyerInputs?.forEach(input => input.setAttribute("required", ""));
    }
  }

  // Validate signup form
  function validateSignupForm(formData) {
    const password = formData.get("signup-password");
    const confirmPassword = formData.get("signup-confirm-password");
    const email = formData.get("signup-email");
    const username = formData.get("signup-username");
    const role = formData.get("user-role");

    // Basic validation
    if (!username || username.length < 3) {
      return "Username must be at least 3 characters long";
    }

    if (!email || !email.includes("@")) {
      return "Please enter a valid email address";
    }

    if (!password || password.length < 6) {
      return "Password must be at least 6 characters long";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    if (!role) {
      return "Please select your role";
    }

    // Role-specific validation
    if (role === "student") {
      const studentId = formData.get("student-id");
      const university = formData.get("student-university");
      const yearOfStudy = formData.get("student-year-of-study");

      if (!studentId) return "Student ID is required";
      if (!university) return "Please select your university";
      if (!yearOfStudy || yearOfStudy < 1 || yearOfStudy > 7) {
        return "Please select a valid year of study (1-7)";
      }
    } else if (role === "lawyer") {
      const yearsExperience = formData.get("lawyer-years-experience");
      const lawyerNumber = formData.get("lawyer-number");

      if (!lawyerNumber) return "Lawyer Bar Number/ID is required";
      if (!yearsExperience || yearsExperience < 0) {
        return "Please enter valid years of experience (0 or more)";
      }
      if (yearsExperience > 60) {
        return "Years of experience seems too high. Please verify.";
      }
    }

    return null; // No errors
  }

  // Handle login form submission
  function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const email = formData.get("login-email");
    const password = formData.get("login-password");

    // Clear previous errors
    clearErrors();

    // Basic validation
    if (!email || !password) {
      loginError.textContent = "Please fill in all fields";
      return;
    }

    // TODO: Replace with actual authentication logic
    // For now, simulate authentication
    console.log("Login attempt:", { email });
    
    // Simulate API call
    setTimeout(() => {
      // For demo purposes, accept any email/password combination
      // In real implementation, make API call here
      if (email && password) {
        alert("Login successful! (Demo mode)");
        hideModal();
        // TODO: Update UI to show logged-in state
        updateAuthUI(true, { email });
      } else {
        loginError.textContent = "Invalid email or password";
      }
    }, 1000);
  }

  // Handle signup form submission
  function handleSignup(e) {
    e.preventDefault();
    const formData = new FormData(signupForm);

    // Clear previous errors
    clearErrors();

    // Validate form
    const validationError = validateSignupForm(formData);
    if (validationError) {
      signupError.textContent = validationError;
      return;
    }

    // TODO: Replace with actual registration logic
    const userData = {
      username: formData.get("signup-username"),
      email: formData.get("signup-email"),
      role: formData.get("user-role")
    };

    // Add role-specific data
    if (userData.role === "student") {
      userData.studentId = formData.get("student-id");
      userData.university = formData.get("student-university");
      userData.yearOfStudy = formData.get("student-year-of-study");
    } else if (userData.role === "lawyer") {
      userData.yearsExperience = formData.get("lawyer-years-experience");
      userData.lawyerNumber = formData.get("lawyer-number");
    }

    console.log("Signup attempt:", userData);

    // Simulate API call
    setTimeout(() => {
      alert("Account created successfully! (Demo mode)");
      hideModal();
      // TODO: Update UI to show logged-in state
      updateAuthUI(true, userData);
    }, 1000);
  }

  // Update UI based on authentication state
  function updateAuthUI(isLoggedIn, userData = null) {
    const authControls = document.getElementById("auth-controls");
    
    if (isLoggedIn && userData) {
      // Replace login/signup buttons with user info
      authControls.innerHTML = `
        <span class="user-greeting">Welcome, ${userData.username || userData.email}</span>
        <button id="logout-btn" class="auth-action">Logout</button>
      `;
      
      // Add logout functionality
      document.getElementById("logout-btn")?.addEventListener("click", () => {
        // TODO: Clear authentication state
        location.reload(); // Simple reload for demo
      });
    }
  }

  // Event Listeners
  
  // Modal toggle buttons
  switchToSignupBtn?.addEventListener("click", () => showModal(false));
  switchToLoginBtn?.addEventListener("click", () => showModal(true));
  
  // Navbar buttons
  openLoginBtn?.addEventListener("click", () => showModal(true));
  openSignupBtn?.addEventListener("click", () => showModal(false));
  
  // Close modal
  closeModalBtn?.addEventListener("click", hideModal);
  
  // Click outside modal to close
  authModal?.addEventListener("click", (e) => {
    if (e.target === authModal) {
      hideModal();
    }
  });

  // Role selection change
  userRoleSelect?.addEventListener("change", (e) => {
    showRoleSpecificFields(e.target.value);
  });

  // Form submissions
  loginForm?.addEventListener("submit", handleLogin);
  signupForm?.addEventListener("submit", handleSignup);

  // Forgot password link (placeholder)
  document.getElementById("forgot-password-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    alert("Forgot password functionality would be implemented here");
  });

  // ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && authModal && !authModal.classList.contains("hidden")) {
      hideModal();
    }
  });
});
