
// scripts/auth-modal.js
// Enhanced Firebase Auth integration with profile dropdown system
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

  // Profile elements
  let authControls, userInfo, profileTrigger, profileDropdown,
      userAvatar, userName, userRole, dropdownAvatar, dropdownName,
      dropdownEmail, dropdownRoleDetail, logoutBtn;

  /**
   * Initializes the Firebase Auth state listener.
   * Updates the UI based on the user's login status.
   */
  function initAuthStateListener() {
    onAuthChange(async (user) => {
      currentUser = user;
      if (user) {
        // User is logged in, fetch profile and update UI
        const profile = await getUserProfile(user.uid);
        updateAuthUI(true, {
          email: user.email,
          username: profile?.username || user.email.split('@')[0],
          ...profile
        });
      } else {
        // User is logged out, show the auth buttons
        updateAuthUI(false);
      }
    });
  }

  /**
   * Utility functions for avatar generation
   */
  function getInitials(name) {
    if (!name) return '??';
    return name.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
  }

  function generateAvatarColor(name) {
    const colors = ['#007bff', '#28a745', '#dc3545', '#6f42c1', '#20c997', '#fd7e14'];
    if (!name) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Formats role information for display
   */
  function formatRoleInfo(userData) {
    const role = userData.role || 'User';
    let roleDetail = role;

    if (userData.role === 'student') {
      const university = userData.profileData?.university || 'Unknown University';
      const year = userData.profileData?.yearOfStudy || 'Unknown Year';
      roleDetail = `Law Student • Year ${year}`;
    } else if (userData.role === 'lawyer') {
      const experience = userData.profileData?.yearsExperience || 0;
      roleDetail = `Legal Practitioner • ${experience} years experience`;
    } else if (userData.role === 'observer') {
      roleDetail = 'Observer • Community Member';
    }

    return {
      role: role.charAt(0).toUpperCase() + role.slice(1),
      roleDetail
    };
  }

  /**
   * Sets up the profile dropdown functionality
   */
  function initializeProfileDropdown() {
    if (profileTrigger) {
      profileTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleProfileDropdown();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await logoutUser();
          closeProfileDropdown();
          showWelcomeMessage('Successfully logged out!', false);
        } catch (error) {
          console.error('Logout error:', error);
          alert('Error logging out. Please try again.');
        }
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (userInfo && !userInfo.contains(e.target)) {
        closeProfileDropdown();
      }
    });

    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProfileDropdown();
      }
    });
  }

  /**
   * Toggles the profile dropdown menu
   */
  function toggleProfileDropdown() {
    if (!profileDropdown || !userInfo) return;
    
    const isOpen = profileDropdown.classList.contains('show');
    
    if (isOpen) {
      closeProfileDropdown();
    } else {
      openProfileDropdown();
    }
  }

  function openProfileDropdown() {
    if (profileDropdown && userInfo) {
      profileDropdown.classList.add('show');
      userInfo.classList.add('open');
    }
  }

  function closeProfileDropdown() {
    if (profileDropdown && userInfo) {
      profileDropdown.classList.remove('show');
      userInfo.classList.remove('open');
    }
  }

  /**
   * Shows a welcome/farewell message
   */
  function showWelcomeMessage(message, isWelcome = true) {
    let welcomePopup = document.getElementById('welcome-popup');
    if (!welcomePopup) {
      welcomePopup = document.createElement('div');
      welcomePopup.id = 'welcome-popup';
      welcomePopup.className = 'welcome-popup';
      document.body.appendChild(welcomePopup);
    }

    welcomePopup.textContent = message;
    welcomePopup.style.position = 'fixed';
    welcomePopup.style.top = '20px';
    welcomePopup.style.right = '20px';
    welcomePopup.style.zIndex = '1001';
    welcomePopup.style.background = isWelcome ? '#28a745' : '#dc3545';
    welcomePopup.style.color = 'white';
    welcomePopup.style.padding = '10px 20px';
    welcomePopup.style.borderRadius = '5px';
    welcomePopup.style.transform = 'translateX(100%)';
    welcomePopup.style.transition = 'transform 0.3s ease';
    
    // Show the popup
    setTimeout(() => {
      welcomePopup.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      welcomePopup.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (welcomePopup.parentNode) {
          welcomePopup.parentNode.removeChild(welcomePopup);
        }
      }, 300);
    }, 4000);
  }

  /**
   * Clears any error messages displayed in the modal.
   */
  function clearErrors() {
    if (loginError) {
      loginError.textContent = "";
      loginError.style.display = 'none';
    }
    if (signupError) {
      signupError.textContent = "";
      signupError.style.display = 'none';
    }
  }

  /**
   * Displays an error message in a specified element.
   */
  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    }
  }

  /**
   * Hides all role-specific input fields for students and lawyers.
   */
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

  /**
   * Shows the input fields specific to the selected user role.
   */
  function showRoleSpecificFields(role) {
    console.log('Showing role specific fields for:', role);
    hideRoleSpecificFields();

    if (role === "student" && studentFields) {
      studentFields.classList.remove("hidden");
      const inputs = studentFields.querySelectorAll("input, select");
      inputs.forEach(input => input.setAttribute("required", ""));
      console.log('Student fields shown');
    } else if (role === "lawyer" && lawyerFields) {
      lawyerFields.classList.remove("hidden");
      const inputs = lawyerFields.querySelectorAll("input, select");
      inputs.forEach(input => input.setAttribute("required", ""));
      console.log('Lawyer fields shown');
    }
  }

  /**
   * Displays the authentication modal.
   */
  function showModal(showLogin = true) {
    if (!modalReady || !authModal) {
      pendingShow = Boolean(showLogin);
      return;
    }

    clearErrors();
    hideRoleSpecificFields();
    closeProfileDropdown();

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

  /**
   * Hides the authentication modal.
   */
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

  /**
   * Validates the signup form data.
   */
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

  /**
   * Handles the login form submission.
   */
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
      showWelcomeMessage(`Welcome back!`);

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
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password.";
          break;
      }

      showError(loginError, errorMessage);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  /**
   * Handles the signup form submission.
   */
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
      showWelcomeMessage(`Welcome to LSIF, ${username}!`);

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

  /**
   * Updates the header UI based on the user's login status.
   */
  function updateAuthUI(isLoggedIn, userData = null) {
    console.log('Updating auth UI:', isLoggedIn, userData);
    if (!authControls || !userInfo) {
      console.warn('Auth controls or user info elements not found');
      return;
    }

    if (isLoggedIn && userData) {
      // Hide auth buttons, show profile
      authControls.classList.add('hidden');
      userInfo.classList.remove('hidden');
      userInfo.classList.add('active');

      // Generate avatar info
      const initials = getInitials(userData.username);
      const avatarColor = generateAvatarColor(userData.username);
      const roleInfo = formatRoleInfo(userData);

      // Update profile trigger
      if (userAvatar) {
        userAvatar.textContent = initials;
        userAvatar.style.backgroundColor = avatarColor;
        if (userData.profileImage) {
          const img = document.createElement('img');
          img.src = userData.profileImage;
          img.alt = 'Profile';
          userAvatar.innerHTML = '';
          userAvatar.appendChild(img);
        }
      }

      if (userName) userName.textContent = userData.username;
      if (userRole) userRole.textContent = roleInfo.role;

      // Update dropdown info
      if (dropdownAvatar) {
        dropdownAvatar.textContent = initials;
        dropdownAvatar.style.backgroundColor = avatarColor;
        if (userData.profileImage) {
          const img = document.createElement('img');
          img.src = userData.profileImage;
          img.alt = 'Profile';
          dropdownAvatar.innerHTML = '';
          dropdownAvatar.appendChild(img);
        }
      }

      if (dropdownName) dropdownName.textContent = userData.username;
      if (dropdownEmail) dropdownEmail.textContent = userData.email;
      if (dropdownRoleDetail) dropdownRoleDetail.textContent = roleInfo.roleDetail;

      // Update notification badges (mock data for now)
      const messagesBadge = document.getElementById('messages-badge');
      const notificationsBadge = document.getElementById('notifications-badge');
      if (messagesBadge) messagesBadge.textContent = '3';
      if (notificationsBadge) notificationsBadge.textContent = '5';

    } else {
      // Show auth buttons, hide profile
      authControls.classList.remove('hidden');
      userInfo.classList.add('hidden');
      userInfo.classList.remove('active');
      closeProfileDropdown();
    }
  }

  /**
   * Binds the event listeners to the login and signup buttons in the header.
   */
  function bindHeaderButtons() {
    const openLoginBtn = document.getElementById("login-btn");
    const openSignupBtn = document.getElementById("signup-btn");

    if (openLoginBtn) {
      // Remove any existing listeners
      openLoginBtn.replaceWith(openLoginBtn.cloneNode(true));
      const newLoginBtn = document.getElementById("login-btn");
      newLoginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log('Login button clicked');
        showModal(true);
      });
    }

    if (openSignupBtn) {
      // Remove any existing listeners
      openSignupBtn.replaceWith(openSignupBtn.cloneNode(true));
      const newSignupBtn = document.getElementById("signup-btn");
      newSignupBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log('Signup button clicked');
        showModal(false);
      });
    }
  }

  // Header loaded event
  document.addEventListener("header:loaded", () => {
    console.log('Header loaded event received');
    headerReady = true;
    
    // Get header elements
    authControls = document.getElementById('auth-controls');
    userInfo = document.getElementById('user-info');
    profileTrigger = document.getElementById('profile-trigger');
    profileDropdown = document.getElementById('user-dropdown');
    userAvatar = document.getElementById('user-avatar');
    userName = document.getElementById('user-name');
    userRole = document.getElementById('user-role');
    dropdownAvatar = document.getElementById('dropdown-avatar');
    dropdownName = document.getElementById('dropdown-name');
    dropdownEmail = document.getElementById('dropdown-email');
    dropdownRoleDetail = document.getElementById('dropdown-role-detail');
    logoutBtn = document.getElementById('logout-btn');

    bindHeaderButtons();
    initializeProfileDropdown();

    if (modalReady && pendingShow !== null) {
      showModal(Boolean(pendingShow));
      pendingShow = null;
    }
  });

  // Modal loaded event
  document.addEventListener("authModal:loaded", () => {
    console.log('Auth modal loaded event received');
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

    // Role selection - this is crucial for showing role-specific fields
    if (userRoleSelect) {
      userRoleSelect.addEventListener("change", (e) => {
        console.log('Role changed to:', e.target.value);
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

  // Re-bind buttons on DOMContentLoaded if header is not using custom event
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    if (!headerReady) {
      setTimeout(() => {
        bindHeaderButtons();
        initAuthStateListener();
      }, 1000);
    }
  });
})();
