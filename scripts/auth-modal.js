// scripts/auth-modal.js - Handles authentication modal functionality and integrates with Firebase Auth

// Import Firebase Authentication and Function calling logic from your Auth.js file
// IMPORTANT: Using './Auth.js' assumes Auth.js is in the SAME directory as auth-modal.js
// and that the file name is 'Auth.js' (capital A). Adjust if your file name differs.
import {
    registerUser,
    loginUser,
    logoutUser,
    onAuthChange // Listener for Firebase Auth state changes
} from './Auth.js'; // Corrected to relative path and assumed 'Auth.js' filename


// IMPORTANT: You also need to import 'db' and 'getDoc' here for the onAuthChange listener
// to work correctly in auth-modal.js, as it directly accesses Firestore.
import {
    db // Import db from your firebase.js
} from './firebase.js'; // Ensure firebase.js is in the same 'scripts' folder

import {
    doc, // Import doc and getDoc for Firestore operations
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


document.addEventListener("DOMContentLoaded", () => {
    // LISTEN FOR THE CORRECT EVENT: authModal:loaded
    document.addEventListener("authModal:loaded", () => { // <--- THIS IS THE CRITICAL CHANGE!
        // --- DOM References ---
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
        const authControls = document.getElementById("auth-controls"); // This refers to the container in header.html or main index.html

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
        // Note: These need to be re-attached if authControls content changes (e.g., after logout)
        function attachOpenModalListeners() {
            openAuthModalBtns.forEach(btn => {
                btn.removeEventListener("click", openModal); // Prevent duplicate listeners
                btn.addEventListener("click", openModal);
            });
        }
        attachOpenModalListeners(); // Initial attachment

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

        // Initialize: Show login form by default when modal opens (or based on Firebase auth state)
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


        // --- ACTUAL FIREBASE AUTHENTICATION LOGIC ---

        // Login form submission handler
        loginForm?.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (loginErrorMessage) loginErrorMessage.textContent = ""; // Clear previous errors

            const email = loginForm.querySelector("#login-email")?.value;
            const password = loginForm.querySelector("#login-password")?.value;

            try {
                await loginUser(email, password); // Call the Firebase login function from Auth.js
                closeModal(); // Close modal on successful login
                // UI will update via onAuthChange listener
            } catch (error) {
                console.error("Login failed:", error.message);
                if (loginErrorMessage) loginErrorMessage.textContent = error.message; // Display Firebase error message
            }
        });

        // Signup form submission handler
        signupForm?.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (signupErrorMessage) signupErrorMessage.textContent = ""; // Clear previous errors

            const username = signupForm.querySelector("#signup-username")?.value;
            const email = signupForm.querySelector("#signup-email")?.value;
            const password = signupForm.querySelector("#signup-password")?.value;
            const confirmPassword = signupForm.querySelector("#signup-confirm-password")?.value;
            const role = userRoleSelect?.value;

            // Get sensitive ID based on role
            let idType = '';
            let plainTextId = '';
            if (role === 'student') {
                idType = 'studentId';
                plainTextId = signupForm.querySelector("#student-id")?.value;
            } else if (role === 'lawyer') {
                idType = 'lawyerNumber';
                plainTextId = signupForm.querySelector("#lawyer-number")?.value; // Get the new lawyer-number field
            }

            // Client-side validations (some are already handled by 'required' in HTML, but good to have JS checks too)
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
            if ((role === 'student' || role === 'lawyer') && !plainTextId) {
                if (signupErrorMessage) signupErrorMessage.textContent = `Please enter your ${idType === 'studentId' ? 'student ID' : 'lawyer number'}.`;
                return;
            }


            try {
                // Call the Firebase registration function from Auth.js
                // This function handles Firebase Auth user creation, Cloud Function call for hashing, and Firestore profile creation.
                await registerUser(email, password, idType, plainTextId);
                alert('Account created! Please log in with your new account.'); // Use alert for simplicity, consider better UX
                signupForm.reset(); // Clear form fields
                showForm("login"); // Switch to login form after successful signup
            } catch (error) {
                console.error("Signup failed:", error.message);
                if (signupErrorMessage) signupErrorMessage.textContent = error.message; // Display Firebase error message
            }
        });


        // --- Firebase Auth State Listener (updates UI when user logs in/out) ---
        onAuthChange(async (user) => {
            const authBtns = document.getElementById('auth-buttons'); // Assuming this is in your main HTML
            const userInfo = document.getElementById('user-info');     // Assuming this is in your main HTML

            if (!authBtns || !userInfo) {
                console.warn("Auth UI control elements not found. 'auth-buttons' or 'user-info' might be missing in your main HTML.");
                return;
            }

            if (user) {
                // User is signed in. Update UI to show user info.
                authBtns.classList.add('hidden');
                userInfo.classList.remove('hidden');

                // Pull custom data (username, role, etc.) from Firestore
                // Note: We're not getting sensitiveIds here for security, only publicly displayable profile data
                const userDocRef = doc(db, 'users', user.uid); // Reference the Firestore document
                const snap = await getDoc(userDocRef);       // Get the document snapshot
                const data = snap.exists() ? snap.data() : {}; // Get data if document exists

                document.getElementById('user-name').textContent =
                    data.username || user.email; // Display username or email

                document.getElementById('user-role-badge').textContent =
                    data.university || data.status || ''; // Adjust display as needed (e.g., role)

                // Attach logout listener to the newly created logout button
                const logoutBtn = userInfo.querySelector("#logout-btn"); // Assuming logout button is inside user-info
                if (logoutBtn) {
                    logoutBtn.removeEventListener("click", logoutUser); // Prevent duplicates
                    logoutBtn.addEventListener("click", logoutUser);
                }

            } else {
                // User is signed out. Update UI to show login/signup buttons.
                authBtns.classList.remove('hidden');
                userInfo.classList.add('hidden');
                // Re-attach listeners for openAuthModalBtns if they are dynamically added/removed
                attachOpenModalListeners();
            }
        });

        // --- Global Logout Button Listener ---
        // This is a redundant listener if onAuthChange properly handles the UI for logoutBtn,
        // but can be kept for robustness if logoutBtn is outside 'user-info' container
        // or if 'authControls' structure is very dynamic.
        // For now, let's rely on the logoutBtn inside userInfo in the onAuthChange.
        // If you have a separate, persistent logout button outside authControls, keep this.
        document.addEventListener('click', e => {
            if (e.target.id === 'logout-btn') {
                logoutUser(); // Call the Firebase logout function from Auth.js
            }
        });

        // Initial check for logout button (if user was already "logged in" from a previous session state)
        // This part becomes less critical with the onAuthChange listener above.
        // But ensures any pre-existing logout button has a listener.
        const currentLogoutBtn = authControls?.querySelector("#logout-btn");
        if (currentLogoutBtn) {
            currentLogoutBtn.addEventListener("click", logoutUser);
        }

    }); // End of authModal:loaded event listener
}); // End of DOMContentLoaded event listener