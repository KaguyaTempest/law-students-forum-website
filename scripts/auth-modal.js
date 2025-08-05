// Scripts/authModal.js

document.addEventListener("DOMContentLoaded", () => {
    const authModal = document.getElementById("auth-modal");
    const loginBtn = document.getElementById("login-btn");
    const signupBtn = document.getElementById("signup-btn");
    const closeBtn = document.querySelector(".close-auth-modal");

    const loginFormContainer = document.getElementById("login-form-container");
    const signupFormContainer = document.getElementById("signup-form-container");

    const showLoginBtn = document.getElementById("show-login");
    const showSignupBtn = document.getElementById("show-signup");

    // 🔓 Show Modal
    const openAuthModal = (formToShow) => {
        authModal.classList.remove("hidden");
        document.body.classList.add("no-scroll");

        if (formToShow === "login") {
            loginFormContainer.classList.remove("hidden");
            signupFormContainer.classList.add("hidden");
            showLoginBtn.classList.add("active");
            showSignupBtn.classList.remove("active");
        } else {
            loginFormContainer.classList.add("hidden");
            signupFormContainer.classList.remove("hidden");
            showSignupBtn.classList.add("active");
            showLoginBtn.classList.remove("active");
        }
    };

    // ❌ Close Modal
    closeBtn.addEventListener("click", () => {
        authModal.classList.add("hidden");
        document.body.classList.remove("no-scroll");
    });

    // 🟦 Button Listeners
    loginBtn.addEventListener("click", () => openAuthModal("login"));
    signupBtn.addEventListener("click", () => openAuthModal("signup"));

    // 🔁 Toggle Forms
    showLoginBtn.addEventListener("click", () => openAuthModal("login"));
    showSignupBtn.addEventListener("click", () => openAuthModal("signup"));
});
