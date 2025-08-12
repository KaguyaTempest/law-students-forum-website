// scripts/auth-modal.js - COMPLETE REPLACEMENT
import { registerUser, loginUser, onAuthChange, logoutUser } from './auth-service.js';

document.addEventListener("DOMContentLoaded", () => {
    const authModal = document.getElementById("auth-modal");
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    const openLoginBtn = document.getElementById("login-btn");
    const openSignupBtn = document.getElementById("signup-btn");
    const closeModalBtn = document.querySelector(".close-auth-modal");

    // Form containers
    const loginContainer = document.getElementById("login-form-container");
    const signupContainer = document.getElementById("signup-form-container");

    // Toggle buttons
    const showLoginBtn = document.getElementById("show-login");
    const showSignupBtn = document.getElementById("show-signup");

    // Role-dependent fields
    const userRoleSelect = document.getElementById("user-role");
    const studentFields = document.getElementById("student-fields");
    const lawyerFields = document.getElementById("lawyer-fields");

    // Show modal function
    function showModal(showLogin = true) {
        if (!authModal) return;
        authModal.classList.remove("hidden");
        authModal.classList.add("show");
        document.body.classList.add("no-scroll");

        if (showLogin) {
            loginContainer?.classList.remove("hidden");
            loginContainer?.classList.add("active");
            signupContainer?.classList.add("hidden");
            signupContainer?.classList.remove("active");
            showLoginBtn?.classList.add("active");
            showSignupBtn?.classList.remove("active");
        } else {
            signupContainer?.classList.remove("hidden");
            signupContainer?.classList.add("active");
            loginContainer?.classList.add("hidden");
            loginContainer?.classList.remove("active");
            showSignupBtn?.classList.add("active");
            showLoginBtn?.classList.remove("active");
        }
    }

    // Hide modal function
    function hideModal() {
        authModal?.classList.remove("show");
        document.body.classList.remove("no-scroll");
        setTimeout(() => {
            authModal?.classList.add("hidden");
        }, 300);
    }

    // Toggle between login/signup inside modal (UPDATED LOGIC)
    showSignupBtn?.addEventListener("click", () => {
        loginContainer?.classList.add("hidden");
        loginContainer?.classList.remove("active");
        signupContainer?.classList.remove("hidden");
        signupContainer?.classList.add("active");
        showLoginBtn?.classList.remove("active");
        showSignupBtn?.classList.add("active");
    });

    showLoginBtn?.addEventListener("click", () => {
        signupContainer?.classList.add("hidden");
        signupContainer?.classList.remove("active");
        loginContainer?.classList.remove("hidden");
        loginContainer?.classList.add("active");
        showSignupBtn?.classList.remove("active");
        showLoginBtn?.classList.add("active");
    });

    // Modal triggers
    openLoginBtn?.addEventListener("click", () => showModal(true));
    openSignupBtn?.addEventListener("click", () => showModal(false));
    closeModalBtn?.addEventListener("click", hideModal);

    // Close on outside click
    authModal?.addEventListener("click", (e) => {
        if (e.target === authModal) hideModal();
    });

    // Show/hide role-specific fields
    userRoleSelect?.addEventListener("change", (e) => {
        const role = e.target.value;
        studentFields?.classList.toggle("hidden", role !== "student");
        lawyerFields?.classList.toggle("hidden", role !== "lawyer");

        // Update required attributes
        const studentInputs = studentFields?.querySelectorAll("input, select");
        const lawyerInputs = lawyerFields?.querySelectorAll("input, select");

        studentInputs?.forEach(input => {
            input.required = role === "student";
        });
        lawyerInputs?.forEach(input => {
            input.required = role === "lawyer";
        });
    });

    // Handle signup form submission
    signupForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get("signup-email");
        const password = formData.get("signup-password");
        const confirmPassword = formData.get("signup-confirm-password");
        const username = formData.get("signup-username");
        const role = formData.get("user-role");
        const errorDiv = document.getElementById("signup-error-message");

        errorDiv.textContent = "";

        // Validation
        if (password !== confirmPassword) {
            errorDiv.textContent = "Passwords don't match!";
            return;
        }
        if (password.length < 6) {
            errorDiv.textContent = "Password must be at least 6 characters!";
            return;
        }
        if (!role) {
            errorDiv.textContent = "Please select your role!";
            return;
        }

        try {
            // Prepare user data based on role
            const userData = { username, role, profileData: {} };

            if (role === "student") {
                const studentId = formData.get("student-id");
                const university = formData.get("student-university");
                const yearOfStudy = formData.get("student-year-of-study");

                if (!studentId || !university || !yearOfStudy) {
                    errorDiv.textContent = "Please fill in all student fields!";
                    return;
                }

                userData.idType = "student_id";
                userData.plainTextSensitiveId = studentId;
                userData.profileData = { university, yearOfStudy: parseInt(yearOfStudy) };
            } else if (role === "lawyer") {
                const lawyerNumber = formData.get("lawyer-number");
                const yearsExperience = formData.get("lawyer-years-experience");

                if (!lawyerNumber || !yearsExperience) {
                    errorDiv.textContent = "Please fill in all lawyer fields!";
                    return;
                }

                userData.idType = "lawyer_id";
                userData.plainTextSensitiveId = lawyerNumber;
                userData.profileData = { yearsExperience: parseInt(yearsExperience) };
            }

            // Register user
            await registerUser(email, password, userData);
            hideModal();
            alert("Registration successful! Welcome to LSIF!");
        } catch (error) {
            console.error("Registration error:", error);
            errorDiv.textContent = getFirebaseErrorMessage(error.code);
        }
    });

    // Handle login form submission
    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get("login-email");
        const password = formData.get("login-password");
        const errorDiv = document.getElementById("login-error-message");

        errorDiv.textContent = "";

        try {
            await loginUser(email, password);
            hideModal();
            alert("Login successful! Welcome back!");
        } catch (error) {
            console.error("Login error:", error);
            errorDiv.textContent = getFirebaseErrorMessage(error.code);
        }
    });

    // Auth state listener
    onAuthChange((user) => {
        const authControls = document.getElementById("auth-controls");
        if (!authControls) return;

        if (user) {
            authControls.innerHTML = `
                Welcome, ${user.email}!
                <button id="logout-btn" class="btn btn-logout">Logout</button>
            `;
            document.getElementById("logout-btn")?.addEventListener("click", async () => {
                try {
                    await logoutUser();
                    alert("Logged out successfully!");
                } catch (error) {
                    console.error("Logout error:", error);
                }
            });
        } else {
            authControls.innerHTML = `
                <button id="login-btn" class="btn btn-login">Login</button>
                <button id="signup-btn" class="btn btn-signup">Sign Up</button>
            `;

            // Re-attach event listeners for new buttons
            document.getElementById("login-btn")?.addEventListener("click", () => showModal(true));
            document.getElementById("signup-btn")?.addEventListener("click", () => showModal(false));
        }
    });
});

// Helper function for user-friendly error messages
function getFirebaseErrorMessage(code) {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please use a different email or try logging in.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.';
        case 'auth/user-not-found':
            return 'No account found with this email. Please check your email or sign up.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        default:
            return 'An error occurred. Please try again.';
    }
}
