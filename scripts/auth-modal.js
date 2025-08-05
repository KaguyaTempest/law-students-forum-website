document.addEventListener("DOMContentLoaded", () => {
  const authModal = document.getElementById("auth-modal");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const openLoginBtn = document.getElementById("open-login-modal");
  const openSignupBtn = document.getElementById("open-signup-modal");
  const closeModalBtn = document.getElementById("close-auth-modal");
  const switchToSignupBtn = document.getElementById("switch-to-signup");
  const switchToLoginBtn = document.getElementById("switch-to-login");

  // Show modal
  function showModal(showLogin = true) {
    if (!authModal) return;

    authModal.classList.remove("hidden");
    authModal.classList.add("show");
    document.body.classList.add("no-scroll");

    if (showLogin) {
      loginForm.classList.remove("hidden");
      signupForm.classList.add("hidden");
    } else {
      loginForm.classList.add("hidden");
      signupForm.classList.remove("hidden");
    }
  }

  // Hide modal
  function hideModal() {
    authModal.classList.remove("show");
    document.body.classList.remove("no-scroll");

    // Wait for transition to end before hiding
    setTimeout(() => {
      authModal.classList.add("hidden");
    }, 300); // must match CSS transition duration
  }

  // Switch forms
  switchToSignupBtn?.addEventListener("click", () => {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
  });

  switchToLoginBtn?.addEventListener("click", () => {
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  });

  // Button triggers
  openLoginBtn?.addEventListener("click", () => showModal(true));
  openSignupBtn?.addEventListener("click", () => showModal(false));
  closeModalBtn?.addEventListener("click", hideModal);

  // Close when clicking outside modal content
  authModal?.addEventListener("click", (e) => {
    if (e.target === authModal) {
      hideModal();
    }
  });
});
