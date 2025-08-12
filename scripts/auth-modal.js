document.addEventListener("DOMContentLoaded", () => {
  const authModal = document.getElementById("auth-modal");
  const openLoginBtn = document.getElementById("login-btn");     // Navbar Login
  const openSignupBtn = document.getElementById("signup-btn");   // Navbar Sign Up
  const switchToSignupBtn = document.getElementById("show-signup"); // Modal tab
  const switchToLoginBtn = document.getElementById("show-login");   // Modal tab
  const closeModalBtn = document.querySelector(".close-auth-modal");

  const loginContainer = document.getElementById("login-form-container");
  const signupContainer = document.getElementById("signup-form-container");

  // Show modal
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

      switchToLoginBtn?.classList.add("active");
      switchToSignupBtn?.classList.remove("active");
    } else {
      signupContainer?.classList.remove("hidden");
      signupContainer?.classList.add("active");
      loginContainer?.classList.add("hidden");
      loginContainer?.classList.remove("active");

      switchToSignupBtn?.classList.add("active");
      switchToLoginBtn?.classList.remove("active");
    }
  }

  // Hide modal
  function hideModal() {
    authModal.classList.remove("show");
    document.body.classList.remove("no-scroll");

    setTimeout(() => {
      authModal.classList.add("hidden");
    }, 300); // Match CSS transition
  }

  // Switch to signup
  switchToSignupBtn?.addEventListener("click", () => {
    showModal(false);
  });

  // Switch to login
  switchToLoginBtn?.addEventListener("click", () => {
    showModal(true);
  });

  // Navbar open buttons
  openLoginBtn?.addEventListener("click", () => showModal(true));
  openSignupBtn?.addEventListener("click", () => showModal(false));

  // Close modal button
  closeModalBtn?.addEventListener("click", hideModal);

  // Click outside modal content to close
  authModal?.addEventListener("click", (e) => {
    if (e.target === authModal) {
      hideModal();
    }
  });
});
