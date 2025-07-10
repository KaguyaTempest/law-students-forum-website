document.addEventListener("header:loaded", () => {
  const modal = document.querySelector("#auth-modal");
  const openButtons = document.querySelectorAll(".open-auth-modal");
  const closeButton = modal.querySelector(".close-auth-modal");
  const loginContainer = modal.querySelector("#login-form-container");
  const signupContainer = modal.querySelector("#signup-form-container");

  const showLoginBtn = modal.querySelector("#show-login");
  const showSignupBtn = modal.querySelector("#show-signup");

  // Open modal
  openButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modal.classList.remove("hidden");
      modal.classList.add("show");

      // Default to login view
      loginContainer.classList.add("active");
      signupContainer.classList.remove("active");
      showLoginBtn.classList.add("active");
      showSignupBtn.classList.remove("active");
    });
  });

  // Close modal
  closeButton.addEventListener("click", () => {
    modal.classList.remove("show");
    modal.classList.add("hidden");
  });

  // Switch between login and signup
  showLoginBtn.addEventListener("click", () => {
    loginContainer.classList.add("active");
    signupContainer.classList.remove("active");
    showLoginBtn.classList.add("active");
    showSignupBtn.classList.remove("active");
  });

  showSignupBtn.addEventListener("click", () => {
    signupContainer.classList.add("active");
    loginContainer.classList.remove("active");
    showSignupBtn.classList.add("active");
    showLoginBtn.classList.remove("active");
  });
});
