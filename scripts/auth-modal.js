// auth-modal.js - Handles authentication modal functionality

document.addEventListener("DOMContentLoaded", () => {
    // Listen for the custom 'header:loaded' event dispatched by load-header.js
    // This ensures the auth-modal.html content is already in the DOM
    document.addEventListener("header:loaded", () => {
        const authModal = document.getElementById("auth-modal");
        const closeAuthModalBtn = authModal?.querySelector(".close-auth-modal");
        const openAuthModalBtns = document.querySelectorAll(".open-auth-modal"); // Login/Sign Up buttons in header

        // Auth form toggles
        const showLoginBtn = authModal?.querySelector("#show-login");
        const showSignupBtn = authModal?.querySelector("#show-signup");
        const loginFormContainer = authModal?.querySelector("#login-form-container");
        const signupFormContainer = authModal?.querySelector("#signup-form-container");

        // Conditional fields for signup
        const userRoleSelect = authModal?.querySelector("#user-role");
        const studentFields = authModal?.querySelector("#student-fields");
        const lawyerFields = authModal?.querySelector("#lawyer-fields");

        // Error messages
        const loginErrorMessage = authModal?.querySelector("#login-error-message");
        const signupErrorMessage = authModal?.querySelector("#signup-error-message");

        // Auth forms
        const loginForm = authModal?.querySelector("#login-form");
        const signupForm = authModal?.querySelector("#signup-form");

        // Placeholder for where login/logout buttons are displayed in the header
        const authControls = document.getElementById("auth-controls");

        // --- Basic Validation and Element Check ---
        if (!authModal || !loginFormContainer || !signupFormContainer || !showLoginBtn || !showSignupBtn) {
            console.error("Critical authentication modal elements not found. Check auth-modal.html and load-header.js injection.");
            return; // Stop execution if essential elements are missing
        }

        // --- Modal Display Logic ---
        function openModal() {
            authModal.classList.remove("hidden");
            authModal.classList.add("show"); // Add 'show' class for CSS transition
            document.body.style.overflow = "hidden"; // Prevent background scrolling
            console.log("Auth modal opened.");
        }

        function closeModal() {
            authModal.classList.remove("show"); // Remove 'show' class
            authModal.classList.add("hidden");
            document.body.style.overflow = ""; // Restore scrolling
            console.log("Auth modal closed.");
        }

        // Attach event listeners for opening the modal
        openAuthModalBtns.forEach(btn => {
            btn.addEventListener("click", openModal);
        });

        // Attach event listener for closing the modal
        closeAuthModalBtn?.addEventListener("click", closeModal);

        // Close modal when clicking outside the auth-card
        authModal.addEventListener("click", (e) => {
            if (e.target === authModal) {
                closeModal();
            }
        });

        // --- Form Toggling Logic within Modal ---
        function showForm(formType) {
            if (formType === "login") {
                loginFormContainer.classList.add("active");
                loginFormContainer.classList.remove("hidden");
                signupFormContainer.classList.add("hidden");
                signupFormContainer.classList.remove("active");
                showLoginBtn.classList.add("active");
                showSignupBtn.classList.remove("active");
            } else if (formType === "signup") {
                signupFormContainer.classList.add("active");
                signupFormContainer.classList.remove("hidden");
                loginFormContainer.classList.add("hidden");
                loginFormContainer.classList.remove("active");
                showSignupBtn.classList.add("active");
                showLoginBtn.classList.remove("active");
            }
            // Clear any previous error messages when switching forms
            if (loginErrorMessage) loginErrorMessage.textContent = "";
            if (signupErrorMessage) signupErrorMessage.textContent = "";
        }

        // Initialize: Show login form by default when modal opens
        showForm("login");

        // Event listeners for switching between login/signup forms
        showLoginBtn.addEventListener("click", () => showForm("login"));
        showSignupBtn.addEventListener("click", () => showForm("signup"));

        // --- Conditional Fields Logic for Signup Form ---
        userRoleSelect?.addEventListener("change", (e) => {
            const selectedRole = e.target.value;
            // Hide all conditional fields first
            if (studentFields) studentFields.classList.add("hidden");
            if (lawyerFields) lawyerFields.classList.add("hidden");

            // Show relevant fields based on selection
            if (selectedRole === "student") {
                if (studentFields) studentFields.classList.remove("hidden");
            } else if (selectedRole === "lawyer") {
                if (lawyerFields) lawyerFields.classList.remove("hidden");
            }
        });

        // --- Placeholder for Authentication Logic ---
        // This is where you would integrate with a backend (e.g., Firebase, your own API)

        function simulateLogin(username, role) {
            if (authControls) {
                // Replace login/signup buttons with user info and logout
                authControls.innerHTML = `
                    <div id="user-info" style="display: flex; align-items: center; gap: 10px;">
                        <img id="user-avatar" src="/law-students-forum-website/assets/default-avatar.png" alt="Avatar" class="avatar">
                        <span id="user-name">${username}</span>
                        <span id="user-role-badge" class="role-badge">${role}</span>
                        <button id="logout-btn" class="auth-action">Logout</button>
                    </div>
                `;
                // Attach listener to the new logout button
                authControls.querySelector("#logout-btn")?.addEventListener("click", simulateLogout);
            }
            closeModal();
            console.log(`Simulated Login: ${username} (${role})`);
        }

        function simulateLogout() {
            if (authControls) {
                // Replace user info with login/signup buttons
                authControls.innerHTML = `
                    <button id="login-btn" class="auth-action open-auth-modal">Login</button>
                    <button id="signup-btn" class="auth-action open-auth-modal">Sign Up</button>
                `;
                // Re-attach listeners for newly added open modal buttons
                authControls.querySelector("#login-btn")?.addEventListener("click", openModal);
                authControls.querySelector("#signup-btn")?.addEventListener("click", openModal);
            }
            console.log("Simulated Logout.");
        }

        // Login form submission handler
        loginForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            if (loginErrorMessage) loginErrorMessage.textContent = ""; // Clear previous errors
            const email = loginForm.querySelector("#login-email")?.value;
            const password = loginForm.querySelector("#login-password")?.value;

            if (email === "test@example.com" && password === "password") {
                simulateLogin("TestUser", "Student"); // Simulate a successful login
            } else {
                if (loginErrorMessage) loginErrorMessage.textContent = "Invalid email or password.";
            }
        });

        // Signup form submission handler
        signupForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            if (signupErrorMessage) signupErrorMessage.textContent = ""; // Clear previous errors
            const username = signupForm.querySelector("#signup-username")?.value;
            const email = signupForm.querySelector("#signup-email")?.value;
            const password = signupForm.querySelector("#signup-password")?.value;
            const confirmPassword = signupForm.querySelector("#signup-confirm-password")?.value;
            const role = userRoleSelect?.value;

            if (!username || !email || !password || !confirmPassword || !role) {
                if (signupErrorMessage) signupErrorMessage.textContent = "Please fill in all required fields.";
                return;
            }

            if (password !== confirmPassword) {
                if (signupErrorMessage) signupErrorMessage.textContent = "Passwords do not match.";
                return;
            }
            if (password.length < 6) {
                if (signupErrorMessage) signupErrorMessage.textContent = "Password must be at least 6 characters.";
                return;
            }

            simulateLogin(username, role); // Simulate a successful signup
            console.log(`Simulated Signup: ${username}, ${email}, Role: ${role}`);
        });

        // Initial check for logout button (if user was already "logged in" from a previous session state)
        const currentLogoutBtn = authControls?.querySelector("#logout-btn");
        if (currentLogoutBtn) {
            currentLogoutBtn.addEventListener("click", simulateLogout);
        }
    }); // End of header:loaded event listener
}); // End of DOMContentLoaded event listener