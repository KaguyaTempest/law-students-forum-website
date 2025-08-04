// scripts/auth-modal.js - Handles authentication modal functionality and integrates with Firebase Auth service

// Import core Firebase logic from our new service file
import {
    registerUser,
    loginUser,
    logoutUser,
    onAuthChange,
    getUserProfile
} from './auth-service.js';

// --- DOM References ---
// These are now global so they can be accessed anywhere within the script
const authModal = document.getElementById("auth-modal");
const closeAuthModalBtn = authModal?.querySelector(".close-auth-modal");

const showLoginBtn = authModal?.querySelector("#show-login");
const showSignupBtn = authModal?.querySelector("#show-signup");
const loginFormContainer = authModal?.querySelector("#login-form-container");
const signupFormContainer = authModal?.querySelector("#signup-form-container");

const userRoleSelect = authModal?.querySelector("#user-role");
const studentFields = authModal?.querySelector("#student-fields");
const lawyerFields = authModal?.querySelector("#lawyer-fields");

const loginErrorMessage = authModal?.querySelector("#login-error-message");
const signupErrorMessage = authModal?.querySelector("#signup-error-message");

const loginForm = authModal?.querySelector("#login-form");
const signupForm = authModal?.querySelector("#signup-form");

const authBtns = document.getElementById('auth-buttons');
const userInfo = document.getElementById('user-info');


// --- Modal Display Logic (your original functions) ---
function openModal() {
    authModal.classList.remove("hidden");
    authModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    authModal.classList.remove("show");
    authModal.classList.add("hidden");
    document.body.style.overflow = "";
}

function showForm(formType) {
    if (formType === "login") {
        loginFormContainer.classList.remove("hidden");
        signupFormContainer.classList.add("hidden");
        showLoginBtn.classList.add("active");
        showSignupBtn.classList.remove("active");
    } else if (formType === "signup") {
        signupFormContainer.classList.remove("hidden");
        loginFormContainer.classList.add("hidden");
        showSignupBtn.classList.add("active");
        showLoginBtn.classList.remove("active");
    }
    if (loginErrorMessage) loginErrorMessage.textContent = "";
    if (signupErrorMessage) signupErrorMessage.textContent = "";
}

// --- Main Event Listeners ---
// IMPORTANT: We use DOMContentLoaded, which is a reliable event that fires
// when the HTML document has been completely loaded and parsed.
document.addEventListener("DOMContentLoaded", () => {
    // Event delegation to catch clicks on buttons that might not be on the page initially
    document.addEventListener("click", (e) => {
        // Handle "Open Modal" buttons from anywhere on the page
        if (e.target.matches('.open-auth-modal') || e.target.closest('.open-auth-modal')) {
            openModal();
            const openingSignup = e.target.id === 'signup-btn'; // Check which button was clicked
            showForm(openingSignup ? "signup" : "login");
        }

        // Handle the global logout button
        if (e.target.id === 'logout-btn') {
            logoutUser();
        }
    });

    // Close the modal when the close button or overlay is clicked
    closeAuthModalBtn?.addEventListener("click", closeModal);
    authModal?.addEventListener("click", (e) => {
        if (e.target === authModal) closeModal();
    });

    // Handle form toggling within the modal
    showLoginBtn?.addEventListener("click", () => showForm("login"));
    showSignupBtn?.addEventListener("click", () => showForm("signup"));

    // Handle conditional fields for signup form
    userRoleSelect?.addEventListener("change", (e) => {
        const selectedRole = e.target.value;
        if (studentFields) studentFields.classList.toggle("hidden", selectedRole !== "student");
        if (lawyerFields) lawyerFields.classList.toggle("hidden", selectedRole !== "lawyer");
    });

    // --- Form Submission Logic ---
    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector("#login-email")?.value;
        const password = loginForm.querySelector("#login-password")?.value;
        try {
            await loginUser(email, password);
            closeModal();
        } catch (error) {
            if (loginErrorMessage) loginErrorMessage.textContent = error.message;
        }
    });

    signupForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = signupForm.querySelector("#signup-username")?.value;
        const email = signupForm.querySelector("#signup-email")?.value;
        const password = signupForm.querySelector("#signup-password")?.value;
        const confirmPassword = signupForm.querySelector("#signup-confirm-password")?.value;
        const role = userRoleSelect?.value;

        const userData = {
            username,
            role,
            idType: '',
            plainTextSensitiveId: '',
            profileData: {}
        };

        if (role === 'student') {
            userData.idType = 'studentId';
            userData.plainTextSensitiveId = signupForm.querySelector("#student-id")?.value;
            userData.profileData.university = signupForm.querySelector("#student-university")?.value;
            userData.profileData.yearOfStudy = signupForm.querySelector("#student-year-of-study")?.value;
        } else if (role === 'lawyer') {
            userData.idType = 'lawyerNumber';
            userData.plainTextSensitiveId = signupForm.querySelector("#lawyer-number")?.value;
            userData.profileData.yearsExperience = signupForm.querySelector("#lawyer-years-experience")?.value;
        }

        if (password !== confirmPassword) {
            if (signupErrorMessage) signupErrorMessage.textContent = "Passwords do not match.";
            return;
        }
        if (password.length < 6) {
            if (signupErrorMessage) signupErrorMessage.textContent = "Password must be at least 6 characters.";
            return;
        }
        if ((role === 'student' || role === 'lawyer') && !userData.plainTextSensitiveId) {
            if (signupErrorMessage) signupErrorMessage.textContent = `Please enter your ${userData.idType === 'studentId' ? 'student ID' : 'lawyer number'}.`;
            return;
        }

        try {
            await registerUser(email, password, userData);
            closeModal(); // Close modal on successful signup
        } catch (error) {
            if (signupErrorMessage) signupErrorMessage.textContent = error.message;
        }
    });

    // --- Firebase Auth State Listener (updates UI when user logs in/out) ---
    onAuthChange(async (user) => {
        if (!authBtns || !userInfo) {
            return;
        }

        if (user) {
            authBtns.classList.add('hidden');
            userInfo.classList.remove('hidden');

            const data = await getUserProfile(user.uid);

            if (data) {
                document.getElementById('user-name').textContent = data.username || user.email;
                document.getElementById('user-role-badge').textContent = data.university || data.status || '';
            }

        } else {
            authBtns.classList.remove('hidden');
            userInfo.classList.add('hidden');
        }
    });
});
