document.addEventListener("DOMContentLoaded", () => {
    // Wait for header to be loaded, which injects the auth modal
    document.addEventListener("header:loaded", () => {
        const authModal = document.getElementById("auth-modal");
        const closeAuthModalBtn = authModal?.querySelector(".close-auth-modal");
        const openAuthModalBtns = document.querySelectorAll(".open-auth-modal"); // Login/Sign Up buttons in header
        const showLoginBtn = authModal?.querySelector("#show-login");
        const showSignupBtn = authModal?.querySelector("#show-signup");
        const loginFormContainer = authModal?.querySelector("#login-form-container");
        const signupFormContainer = authModal?.querySelector("#signup-form-container");
        const userRoleSelect = authModal?.querySelector("#user-role");
        const studentFields = authModal?.querySelector("#student-fields");
        const lawyerFields = authModal?.querySelector("#lawyer-fields");

        if (!authModal || !loginFormContainer || !signupFormContainer) {
            console.error("Auth modal elements not found. Check auth.html and load-header.js.");
            return;
        }

        // --- Modal Display Logic ---
        function openModal() {
            authModal.classList.remove("hidden");
            authModal.classList.add("show");
            document.body.style.overflow = "hidden"; // Prevent scrolling body
        }

        function closeModal() {
            authModal.classList.remove("show");
            authModal.classList.add("hidden");
            document.body.style.overflow = ""; // Restore body scrolling
        }

        // Event listeners for opening and closing modal
        openAuthModalBtns.forEach(btn => {
            btn.addEventListener("click", openModal);
        });
        closeAuthModalBtn?.addEventListener("click", closeModal);
        authModal.addEventListener("click", (e) => {
            if (e.target === authModal) { // Close if clicked outside the card
                closeModal();
            }
        });

        // --- Form Toggling Logic ---
        function showForm(formType) {
            if (formType === "login") {
                loginFormContainer.classList.add("active");
                loginFormContainer.classList.remove("hidden");
                signupFormContainer.classList.add("hidden");
                signupFormContainer.classList.remove("active");
                showLoginBtn?.classList.add("active");
                showSignupBtn?.classList.remove("active");
            } else if (formType === "signup") {
                signupFormContainer.classList.add("active");
                signupFormContainer.classList.remove("hidden");
                loginFormContainer.classList.add("hidden");
                loginFormContainer.classList.remove("active");
                showSignupBtn?.classList.add("active");
                showLoginBtn?.classList.remove("active");
            }
        }

        // Initial form display (default to login)
        showForm("login");

        showLoginBtn?.addEventListener("click", () => showForm("login"));
        showSignupBtn?.addEventListener("click", () => showForm("signup"));

        // --- Conditional Fields Logic for Signup ---
        userRoleSelect?.addEventListener("change", (e) => {
            const selectedRole = e.target.value;
            if (studentFields) studentFields.classList.add("hidden");
            if (lawyerFields) lawyerFields.classList.add("hidden");

            if (selectedRole === "student") {
                if (studentFields) studentFields.classList.remove("hidden");
            } else if (selectedRole === "lawyer") {
                if (lawyerFields) lawyerFields.classList.remove("hidden");
            }
        });

        // --- Placeholder for Auth Logic (replace with actual backend calls) ---
        const loginForm = authModal.querySelector("#login-form");
        const signupForm = authModal.querySelector("#signup-form");
        const loginErrorMessage = authModal.querySelector("#login-error-message");
        const signupErrorMessage = authModal.querySelector("#signup-error-message");
        const authControls = document.getElementById("auth-controls"); // Where buttons/user info live

        // Simplified User State Simulation
        function simulateLogin(username, role) {
            if (authControls) {
                authControls.innerHTML = `
                    <div id="user-info" style="display: flex; align-items: center; gap: 10px;">
                        <img id="user-avatar" src="/law-students-forum-website/assets/default-avatar.png" alt="Avatar" class="avatar">
                        <span id="user-name">${username}</span>
                        <span id="user-role-badge" class="role-badge">${role}</span>
                        <button id="logout-btn" class="auth-action">Logout</button>
                    </div>
                `;
                authControls.querySelector("#logout-btn")?.addEventListener("click", simulateLogout);
            }
            closeModal();
            console.log(`User logged in: ${username} (${role})`);
        }

        function simulateLogout() {
            if (authControls) {
                authControls.innerHTML = `
                    <button id="login-btn" class="auth-action open-auth-modal">Login</button>
                    <button id="signup-btn" class="auth-action open-auth-modal">Sign Up</button>
                `;
                 // Re-attach listeners for newly added buttons
                authControls.querySelector("#login-btn")?.addEventListener("click", openModal);
                authControls.querySelector("#signup-btn")?.addEventListener("click", openModal);
            }
            console.log("User logged out.");
        }


        loginForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            loginErrorMessage.textContent = "";
            const email = loginForm.querySelector("#login-email").value;
            const password = loginForm.querySelector("#login-password").value;

            // Simple validation
            if (email === "test@example.com" && password === "password") {
                simulateLogin("TestUser", "Student"); // Simulate successful login
            } else {
                loginErrorMessage.textContent = "Invalid email or password.";
            }
        });

        signupForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            signupErrorMessage.textContent = "";
            const username = signupForm.querySelector("#signup-username").value;
            const email = signupForm.querySelector("#signup-email").value;
            const password = signupForm.querySelector("#signup-password").value;
            const confirmPassword = signupForm.querySelector("#signup-confirm-password").value;
            const role = userRoleSelect?.value;

            if (password !== confirmPassword) {
                signupErrorMessage.textContent = "Passwords do not match.";
                return;
            }
            if (password.length < 6) {
                signupErrorMessage.textContent = "Password must be at least 6 characters.";
                return;
            }
            if (!role) {
                signupErrorMessage.textContent = "Please select a role.";
                return;
            }

            // Simulate successful signup
            simulateLogin(username, role);
            console.log(`Signed up: ${username}, ${email}, Role: ${role}`);
        });

        // Initial setup for logout button if user is already "logged in" (e.g. from session)
        const currentLogoutBtn = authControls?.querySelector("#logout-btn");
        if (currentLogoutBtn) {
            currentLogoutBtn.addEventListener("click", simulateLogout);
        }
    });
});