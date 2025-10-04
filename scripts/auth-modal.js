// scripts/auth-modal.js (Modified)
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

    // Profile elements (NEW)
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

    /**
     * Utility functions for avatar generation (omitted for brevity, assume they are correct)
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
     * Formats role information for display (omitted for brevity, assume they are correct)
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
     * Sets up the profile dropdown functionality (omitted for brevity, assume they are correct)
     */
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
     * Toggles the profile dropdown menu (omitted for brevity, assume they are correct)
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
     * Shows a welcome/farewell message (omitted for brevity, assume they are correct)
     */
    function showWelcomeMessage(message, isWelcome = true) {
        // Create or find welcome popup element
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
        
        // Show the popup
        welcomePopup.classList.add('show');
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            welcomePopup.classList.remove('show');
            setTimeout(() => {
                if (welcomePopup.parentNode) {
                    welcomePopup.parentNode.removeChild(welcomePopup);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Clears any error messages displayed in the modal. (omitted for brevity, assume they are correct)
     */
    function clearErrors() {
        if (loginError) loginError.textContent = "";
        if (signupError) signupError.textContent = "";
    }

    /**
     * Displays an error message in a specified element. (omitted for brevity, assume they are correct)
     */
    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    /**
     * Hides all role-specific input fields for students and lawyers.
     * FIX: Remove display inline style.
     */
    function hideRoleSpecificFields() {
        if (studentFields) {
            studentFields.classList.add("hidden");
            // studentFields.style.display = "none"; // <-- REMOVED THIS LINE
            const inputs = studentFields.querySelectorAll("input, select");
            inputs.forEach(input => {
                input.removeAttribute("required");
                input.value = "";
            });
        }

        if (lawyerFields) {
            lawyerFields.classList.add("hidden");
            // lawyerFields.style.display = "none"; // <-- REMOVED THIS LINE
            const inputs = lawyerFields.querySelectorAll("input, select");
            inputs.forEach(input => {
                input.removeAttribute("required");
                input.value = "";
            });
        }
    }

    /**
     * Shows the input fields specific to the selected user role.
     * FIX: Remove display inline style and rely purely on class removal.
     */
    function showRoleSpecificFields(role) {
        console.log("showRoleSpecificFields called with role:", role);
        
        hideRoleSpecificFields();

        if (role === "student" && studentFields) {
            console.log("Showing student fields");
            studentFields.classList.remove("hidden");
            // studentFields.style.display = "flex"; // <-- REMOVED THIS LINE
            // studentFields.style.flexDirection = "column"; // <-- REMOVED THIS LINE
            const inputs = studentFields.querySelectorAll("input, select");
            inputs.forEach(input => input.setAttribute("required", "true")); // Explicit required attribute
        } else if (role === "lawyer" && lawyerFields) {
            console.log("Showing lawyer fields");
            lawyerFields.classList.remove("hidden");
            // lawyerFields.style.display = "flex"; // <-- REMOVED THIS LINE
            // lawyerFields.style.flexDirection = "column"; // <-- REMOVED THIS LINE
            const inputs = lawyerFields.querySelectorAll("input, select");
            inputs.forEach(input => input.setAttribute("required", "true")); // Explicit required attribute
        } else {
            console.log("No matching role or elements not found");
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
        hideRoleSpecificFields();
        closeProfileDropdown(); // Close profile dropdown if open

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

        setTimeout(() => {
            authModal.classList.add("hidden");
            authModal.style.display = "none";
        }, 300);
    }

    /**
     * Validates the signup form data. (omitted for brevity, assume it is correct)
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
            if (yearsExperience === null || yearsExperience === "" || parseInt(yearsExperience) < 0) {
                return "Please enter valid years of experience";
            }
            if (parseInt(yearsExperience) > 60) return "Years of experience seems too high. Please verify.";
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
     * Handles the signup form submission. (omitted for brevity, assume it is correct)
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
     * Updates the header UI based on the user's login status. (omitted for brevity, assume it is correct)
     */
    function updateAuthUI(isLoggedIn, userData = null) {
        if (!authControls || !userInfo) return;

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
                // Check if user has profile image
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
            if (messagesBadge) messagesBadge.textContent = '3'; // Mock data
            if (notificationsBadge) notificationsBadge.textContent = '5'; // Mock data

        } else {
            // Show auth buttons, hide profile
            authControls.classList.remove('hidden');
            userInfo.classList.add('hidden');
            userInfo.classList.remove('active');
            closeProfileDropdown();
        }
    }

    /**
     * Binds the event listeners to the login and signup buttons in the header. (omitted for brevity, assume it is correct)
     */
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

    // Modal loaded event (Modified tab switching to rely on CSS classes)
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
                console.log("Role selected:", e.target.value);
                showRoleSpecificFields(e.target.value);
            });
        } else {
            console.error("User role select element not found!");
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