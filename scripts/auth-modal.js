// scripts/auth-modal.js - Handles authentication modal functionality and integrates with Firebase Auth service

// Import core Firebase logic from the service file
import {
    registerUser,
    loginUser,
    logoutUser,
    onAuthChange,
    getUserProfile
} from './auth-service.js';

// --- Global DOM References ---
// These are defined globally, but the code inside the event listener
// will re-query for them to ensure they are not null.
const authModal = document.getElementById("auth-modal");
const authBtns = document.getElementById('auth-buttons');
const userInfo = document.getElementById('user-info');

// The main event listener for when the modal's HTML is injected into the DOM
document.addEventListener("authModal:loaded", () => {
    console.log("auth-modal.js: Event 'authModal:loaded' received. Initializing modal functionality.");

    // --- References that are only available after the modal loads ---
    const closeAuthModalBtn = document.querySelector(".close-auth-modal");
    const openAuthModalBtns = document.querySelectorAll(".open-auth-modal");
    
    const showLoginBtn = document.querySelector("#show-login");
    const showSignupBtn = document.querySelector("#show-signup");
    const loginFormContainer = document.querySelector("#login-form-container");
    const signupFormContainer = document.querySelector("#signup-form-container");
    
    const userRoleSelect = document.querySelector("#user-role");
    const studentFields = document.querySelector("#student-fields");
    const lawyerFields = document.querySelector("#lawyer-fields");
    
    const loginErrorMessage = document.querySelector("#login-error-message");
    const signupErrorMessage = document.querySelector("#signup-error-message");
    
    const loginForm = document.querySelector("#login-form");
    const signupForm = document.querySelector("#signup-form");
    
    // --- Error Checking ---
    if (!authModal || !loginFormContainer || !signupFormContainer || !openAuthModalBtns.length) {
        console.error("Critical authentication modal elements not found. Check auth-modal.html and load-header.js injection.");
        return;
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
    
    showForm("login"); // Start on login form

    // --- Attach Event Listeners (now that elements are guaranteed to exist) ---
    openAuthModalBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const openingSignup = e.target.id === 'signup-btn' || e.target.closest('#signup-btn');
            showForm(openingSignup ? "signup" : "login");
            openModal();
        });
    });

    closeAuthModalBtn?.addEventListener("click", closeModal);
    authModal.addEventListener("click", (e) => {
        if (e.target === authModal) {
            closeModal();
        }
    });

    showLoginBtn?.addEventListener("click", () => showForm("login"));
    showSignupBtn?.addEventListener("click", () => showForm("signup"));

    userRoleSelect?.addEventListener("change", (e) => {
        const selectedRole = e.target.value;
        studentFields?.classList.toggle("hidden", selectedRole !== "student");
        lawyerFields?.classList.toggle("hidden", selectedRole !== "lawyer");
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
        
        // --- Validation ---
        if (password !== confirmPassword) {
            signupErrorMessage.textContent = "Passwords do not match.";
            return;
        }
        if (password.length < 6) {
            signupErrorMessage.textContent = "Password must be at least 6 characters.";
            return;
        }

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

        if ((role === 'student' || role === 'lawyer') && !userData.plainTextSensitiveId) {
            signupErrorMessage.textContent = `Please enter your ${userData.idType === 'studentId' ? 'student ID' : 'lawyer number'}.`;
            return;
        }

        try {
            await registerUser(email, password, userData);
            closeModal();
            showForm("login");
        } catch (error) {
            signupErrorMessage.textContent = error.message;
        }
    });

    // --- Auth State Listener (updates UI when user logs in/out) ---
    onAuthChange(async (user) => {
        if (!authBtns || !userInfo) {
            console.warn("Auth UI control elements not found.");
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
