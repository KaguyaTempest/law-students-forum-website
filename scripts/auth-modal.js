// scripts/auth-modal.js
// Enhanced Firebase Auth integration with profile dropdown system
// NOTE: This version implements a two-phase signup flow for optional data entry.

import { registerUser, loginUser, logoutUser, onAuthChange, getUserProfile } from './auth-service.js';

(() => {
    let modalReady = false;
    let headerReady = false;
    let pendingShow = null;
    let currentUser = null;
    let signupPhase = 1; // 1: Initial (basic data only), 2: Final (full data)

    // Modal elements
    let authModal, loginContainer, signupContainer,
        loginForm, signupForm, switchToSignupBtn, switchToLoginBtn,
        closeModalBtn, userRoleSelect, studentFields, lawyerFields,
        loginError, signupError;

    // Profile elements (omitted for brevity)
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
                // Fetch the user's profile data from Firestore
                const profile = await getUserProfile(user.uid);
                // Pass the profile data to the UI update function
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

    // NEW UTILITY: Generates a mock ID in the style "RXXXXXXK"
    function generateMockId() {
        // Generate 6 random digits
        const digits = Math.floor(100000 + Math.random() * 900000);
        return `R${digits}K`;
    }

    // Utility functions for avatar generation (omitted for brevity, assume they are correct)
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

    // Formats role information for display (omitted for brevity, assume they are correct)
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

    // Profile dropdown logic (omitted for brevity, assume they are correct)
    function initializeProfileDropdown() {
        if (profileTrigger) {
            profileTrigger.addEventListener('click', (e) => {
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

        document.addEventListener('click', (e) => {
            if (userInfo && !userInfo.contains(e.target)) {
                closeProfileDropdown();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeProfileDropdown();
            }
        });
    }

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

    // Shows a welcome/farewell message (omitted for brevity, assume they are correct)
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
        
        welcomePopup.classList.add('show');
        
        setTimeout(() => {
            welcomePopup.classList.remove('show');
            setTimeout(() => {
                if (welcomePopup.parentNode) {
                    welcomePopup.parentNode.removeChild(welcomePopup);
                }
            }, 300);
        }, 4000);
    }

    // Clears any error messages
    function clearErrors() {
        if (loginError) loginError.textContent = "";
        if (signupError) signupError.textContent = "";
    }

    // Displays an error message
    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    /**
     * Hides and clears all role-specific input fields.
     */
    function hideRoleSpecificFields() {
        if (studentFields) {
            studentFields.classList.add("hidden");
            const inputs = studentFields.querySelectorAll("input, select");
            inputs.forEach(input => {
                input.removeAttribute("required");
                input.value = ""; // Clear values
            });
        }

        if (lawyerFields) {
            lawyerFields.classList.add("hidden");
            const inputs = lawyerFields.querySelectorAll("input, select");
            inputs.forEach(input => {
                input.removeAttribute("required");
                input.value = ""; // Clear values
            });
        }
    }

    /**
     * Reveals the role-specific fields and removes mock data.
     * Called in Phase 1 to prepare the form for manual input.
     */
    function revealRoleFields(role) {
        hideRoleSpecificFields(); // Start clean

        // 1. Force-select the role
        if (userRoleSelect) {
             userRoleSelect.value = role;
        }

        if (role === "student" && studentFields) {
            // Clear the mock data
            document.getElementById("student-id").value = ""; 
            document.getElementById("student-university").value = ""; 
            document.getElementById("student-year-of-study").value = ""; 

            // Make fields required and visible
            studentFields.querySelectorAll("input, select").forEach(input => {
                input.setAttribute("required", "true");
            });
            studentFields.classList.remove("hidden");
        } else if (role === "lawyer" && lawyerFields) {
            // Clear the mock data (optional, but good practice)
            document.getElementById("lawyer-years-experience").value = ""; 
            document.getElementById("lawyer-number").value = ""; 
            
            // Make fields required and visible
            lawyerFields.querySelectorAll("input, select").forEach(input => {
                input.setAttribute("required", "true");
            });
            lawyerFields.classList.remove("hidden");
        }
    }
    
    /**
     * Pre-fills role-specific fields with required defaults to pass validation silently.
     * Called in Phase 2 only if the user submits without interacting with the revealed fields.
     */
    function prefillRoleFields() {
        const role = userRoleSelect?.value || "student";
        
        // 1. Force-select the role (ensure it's not the initial empty value)
        if (userRoleSelect && userRoleSelect.value === "") {
             userRoleSelect.value = "student";
        }

        // 2. Prefill Student Fields
        if (studentFields && role === "student") {
            // Check if fields are empty (meaning the user didn't fill them)
            if (!document.getElementById("student-id").value) {
                document.getElementById("student-id").value = generateMockId(); 
            }
            if (!document.getElementById("student-university").value) {
                document.getElementById("student-university").value = "UZ"; 
            }
            if (!document.getElementById("student-year-of-study").value) {
                document.getElementById("student-year-of-study").value = "3"; 
            }
        }
        
        // 3. Prefill Lawyer Fields
        if (lawyerFields && role === "lawyer") {
            if (!document.getElementById("lawyer-years-experience").value) {
                 document.getElementById("lawyer-years-experience").value = "5"; 
            }
            if (!document.getElementById("lawyer-number").value) {
                 document.getElementById("lawyer-number").value = generateMockId(); 
            }
        }
    }

    /**
     * Displays the authentication modal. (omitted for brevity, assume it is correct)
     */
    function showModal(showLogin = true) {
        if (!modalReady || !authModal) {
            pendingShow = Boolean(showLogin);
            return;
        }

        clearErrors();
        hideRoleSpecificFields(); // Reset all form fields
        closeProfileDropdown(); 
        signupPhase = 1; // Reset phase on modal open

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
     * Hides the authentication modal. (omitted for brevity, assume it is correct)
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
        signupPhase = 1; // Reset phase on modal close

        setTimeout(() => {
            authModal.classList.add("hidden");
            authModal.style.display = "none";
        }, 300);
    }

    /**
     * Validates the signup form data. 
     * Checks all fields in Phase 2.
     */
    function validateSignupForm(formData) {
        const password = formData.get("signup-password");
        const confirmPassword = formData.get("signup-confirm-password");
        const email = formData.get("signup-email");
        const username = formData.get("signup-username");
        const role = formData.get("user-role");

        // --- Core Validation (Required for all users) ---
        if (!username || username.length < 3) return "Username must be at least 3 characters long";
        if (!email || !email.includes("@")) return "Please enter a valid email address";
        if (!password || password.length < 6) return "Password must be at least 6 characters long";
        if (password !== confirmPassword) return "Passwords do not match";
        if (!role) return "Role is required.";
        
        // --- Phase 2: Detailed Role Validation ---
        if (signupPhase === 2) {
             if (role === "student") {
                if (!formData.get("student-id") || !formData.get("student-university") || !formData.get("student-year-of-study")) {
                    return "Please fill in all student details (ID, University, Year).";
                }
            } else if (role === "lawyer") {
                if (!formData.get("lawyer-years-experience") || !formData.get("lawyer-number")) {
                    return "Please fill in all lawyer details (Years of Experience, ID).";
                }
            }
        }

        return null;
    }

    /**
     * Handles the login form submission. (omitted for brevity, assume it is correct)
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
     * Handles the signup form submission (Two-Phase).
     */
    async function handleSignup(e) {
        e.preventDefault();
        clearErrors();

        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalText = "Sign Up";
        
        // Get form data immediately to check basic validation
        const formData = new FormData(signupForm);
        const coreValidationError = validateSignupForm(formData);
        
        const email = formData.get("signup-email");
        const password = formData.get("signup-password");
        const username = formData.get("signup-username");
        const role = formData.get("user-role");

        if (coreValidationError) {
            showError(signupError, coreValidationError);
            return;
        }

        if (signupPhase === 1) {
            // ⭐ PHASE 1: VALIDATE CORE, REVEAL FIELDS, AND STOP SUBMISSION ⭐
            
            // Set the default role to student if none selected (as required)
            if (!role) {
                userRoleSelect.value = "student";
                role = "student"; // Re-set role variable
            }
            
            // Change UI for Phase 2
            revealRoleFields(role);
            submitBtn.textContent = "Complete Sign Up"; 
            submitBtn.disabled = false; // Ensure button is enabled for the next step
            signupPhase = 2; // Move to the final submission phase
            
            // Stop the submission and prompt the user
            showError(signupError, "Please complete your role details below, then click 'Complete Sign Up'.");
            return;
        }

        // ⭐ PHASE 2: FINAL SUBMISSION ⭐
        
        // Fill any *empty* required role fields with defaults (UZ, RXXXXXXK, 5 yrs exp)
        prefillRoleFields(); 

        // Re-validate now that all fields should be filled (either by user or defaults)
        const finalValidationError = validateSignupForm(new FormData(signupForm));

        if (finalValidationError) {
            showError(signupError, finalValidationError);
            submitBtn.disabled = false;
            submitBtn.textContent = "Complete Sign Up";
            return;
        }
        
        // Proceed to Firebase registration
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = "Creating account...";

            // Collect final data
            const finalFormData = new FormData(signupForm);
            
            const userData = {
                username,
                role,
                profileData: {}
            };

            if (role === "student") {
                userData.idType = "student_id";
                userData.plainTextSensitiveId = finalFormData.get("student-id"); 
                userData.profileData.university = finalFormData.get("student-university"); 
                userData.profileData.yearOfStudy = finalFormData.get("student-year-of-study");
            } else if (role === "lawyer") {
                userData.idType = "lawyer_number";
                userData.plainTextSensitiveId = finalFormData.get("lawyer-number");
                userData.profileData.yearsExperience = parseInt(finalFormData.get("lawyer-years-experience"));
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
                case 'auth/weak-password':
                    errorMessage = "Password must be at least 6 characters long.";
                    break;
            }

            showError(signupError, errorMessage);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            signupPhase = 1; // Reset phase for the next time the modal is opened
        }
    }

    // Updates the header UI based on the user's login status (omitted for brevity, assume it is correct)
    function updateAuthUI(isLoggedIn, userData = null) {
        // ... (existing updateAuthUI logic) ...
    }

    // Binds the event listeners to the login and signup buttons in the header.
    function bindHeaderButtons() {
        const openLoginBtn = document.getElementById("login-btn");
        const openSignupBtn = document.getElementById("signup-btn");

        if (openLoginBtn) {
            openLoginBtn.addEventListener("click", (e) => {
                e.preventDefault();
                showModal(true);
            });
        }

        if (openSignupBtn) {
            openSignupBtn.addEventListener("click", (e) => {
                e.preventDefault();
                showModal(false);
            });
        }
    }

    // Header loaded event (omitted for brevity, assume it is correct)
    document.addEventListener("header:loaded", () => {
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

        // Tab switching (kept to allow manual tab switching)
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
                signupPhase = 1; // Reset phase on switch
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
                signupPhase = 1; // Reset phase on switch
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

        // Add the role change listener back, for Phase 2 updates
        if (userRoleSelect) {
            userRoleSelect.addEventListener("change", (e) => {
                const role = e.target.value;
                if (role && signupPhase === 2) {
                    // Switch fields if in Phase 2
                    revealRoleFields(role);
                } else if (role && signupPhase === 1) {
                    // Just hide/clear if the user manually selects a role in Phase 1 (before submission)
                    hideRoleSpecificFields();
                }
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

    // ESC key to close modal (omitted for brevity, assume it is correct)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && authModal && !authModal.classList.contains("hidden")) {
            hideModal();
        }
    });

    // Re-bind buttons on DOMContentLoaded if header is not using custom event (omitted for brevity, assume it is correct)
    document.addEventListener('DOMContentLoaded', () => {
        if (!headerReady) {
            bindHeaderButtons();
            initAuthStateListener();
        }
    });
})();