// scripts/auth-modal.js - Handles authentication modal functionality and integrates with Firebase Auth

// Import Firebase Authentication and Function calling logic from your Auth.js file
// IMPORTANT: Using './auth.js' assumes auth.js is in the SAME directory as auth-modal.js
// and that the file name is 'auth.js'.
import {
    registerUser,
    loginUser,
    logoutUser,
    onAuthChange // Listener for Firebase Auth state changes
} from './auth-service.js'; // Corrected to relative path and assumed 'Auth.js' filename


// IMPORTANT: You also need to import 'db' and 'getDoc' here for the onAuthChange listener
// to work correctly in auth-modal.js, as it directly accesses Firestore.
import {
    db // Import db from your firebase.js
} from './firebase-config.js'; // Ensure firebase.js is in the same 'scripts' folder

import {
    doc, // Import doc and getDoc for Firestore operations
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// FIX: Removed the outer document.addEventListener("DOMContentLoaded", ...)
// Now listening directly for the 'authModal:loaded' event.
document.addEventListener("authModal:loaded", () => {
    console.log("auth-modal.js: Script is running, authModal:loaded event fired!");

    // --- DOM References ---
    const authModal = document.getElementById("auth-modal");
    const closeAuthModalBtn = authModal?.querySelector(".close-auth-modal");
    // This now runs AFTER the header is loaded, so the buttons will be found.
    const openAuthModalBtns = document.querySelectorAll(".open-auth-modal");
    console.log("auth-modal.js: Found openAuthModalBtns:", openAuthModalBtns);

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
    const authBtns = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');

    // --- Basic Validation and Element Check ---
    if (!authModal || !loginFormContainer || !signupFormContainer || !showLoginBtn || !showSignupBtn) {
        console.error("Critical authentication modal elements not found. Check auth-modal.html and load-header.js injection.");
        return; // Stop execution if essential elements are missing
    }

    // --- Modal Display Logic ---
    function openModal() {
        authModal.classList.remove("hidden");
        authModal.classList.add("show");
        document.body.style.overflow = "hidden";
        console.log("Auth modal opened.");
    }

    function closeModal() {
        authModal.classList.remove("show");
        authModal.classList.add("hidden");
        document.body.style.overflow = "";
        console.log("Auth modal closed.");
    }

    function attachOpenModalListeners() {
        openAuthModalBtns.forEach(btn => {
            btn.removeEventListener("click", openModal);
            btn.addEventListener("click", openModal);
        });
    }
    attachOpenModalListeners(); // Initial attachment

    closeAuthModalBtn?.addEventListener("click", closeModal);

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
        if (loginErrorMessage) loginErrorMessage.textContent = "";
        if (signupErrorMessage) signupErrorMessage.textContent = "";
    }

    showForm("login");

    showLoginBtn.addEventListener("click", () => showForm("login"));
    showSignupBtn.addEventListener("click", () => showForm("signup"));

    // --- Conditional Fields Logic for Signup Form ---
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


    // --- ACTUAL FIREBASE AUTHENTICATION LOGIC ---

    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (loginErrorMessage) loginErrorMessage.textContent = "";

        const email = loginForm.querySelector("#login-email")?.value;
        const password = loginForm.querySelector("#login-password")?.value;

        try {
            await loginUser(email, password);
            closeModal();
        } catch (error) {
            console.error("Login failed:", error.message);
            if (loginErrorMessage) loginErrorMessage.textContent = error.message;
        }
    });

    signupForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (signupErrorMessage) signupErrorMessage.textContent = "";

        const username = signupForm.querySelector("#signup-username")?.value;
        const email = signupForm.querySelector("#signup-email")?.value;
        const password = signupForm.querySelector("#signup-password")?.value;
        const confirmPassword = signupForm.querySelector("#signup-confirm-password")?.value;
        const role = userRoleSelect?.value;

        let idType = '';
        let plainTextId = '';
        if (role === 'student') {
            idType = 'studentId';
            plainTextId = signupForm.querySelector("#student-id")?.value;
        } else if (role === 'lawyer') {
            idType = 'lawyerNumber';
            plainTextId = signupForm.querySelector("#lawyer-number")?.value;
        }

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
            await registerUser(email, password, idType, plainTextId);
            alert('Account created! Please log in with your new account.');
            signupForm.reset();
            showForm("login");
        } catch (error) {
            console.error("Signup failed:", error.message);
            if (signupErrorMessage) signupErrorMessage.textContent = error.message;
        }
    });

    // --- Firebase Auth State Listener (updates UI when user logs in/out) ---
    onAuthChange(async (user) => {
        if (!authBtns || !userInfo) {
            console.warn("Auth UI control elements not found. 'auth-buttons' or 'user-info' might be missing in your main HTML.");
            return;
        }

        if (user) {
            authBtns.classList.add('hidden');
            userInfo.classList.remove('hidden');

            const userDocRef = doc(db, 'users', user.uid);
            const snap = await getDoc(userDocRef);
            const data = snap.exists() ? snap.data() : {};

            document.getElementById('user-name').textContent = data.username || user.email;
            document.getElementById('user-role-badge').textContent = data.university || data.status || '';

            const logoutBtn = userInfo.querySelector("#logout-btn");
            if (logoutBtn) {
                logoutBtn.removeEventListener("click", logoutUser);
                logoutBtn.addEventListener("click", logoutUser);
            }

        } else {
            authBtns.classList.remove('hidden');
            userInfo.classList.add('hidden');
            attachOpenModalListeners();
        }
    });

    // --- Global Logout Button Listener ---
    document.addEventListener('click', e => {
        if (e.target.id === 'logout-btn') {
            logoutUser();
        }
    });
});