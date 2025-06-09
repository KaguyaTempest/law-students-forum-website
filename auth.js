// Assumes Firebase is already initialized in script.js

document.addEventListener('DOMContentLoaded', () => {
  const showSignupBtn = document.getElementById('show-signup');
  const showLoginBtn = document.getElementById('show-login');
  const signupFormContainer = document.getElementById('signup-form-container');
  const loginFormContainer = document.getElementById('login-form-container');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const signupErrorMsg = document.getElementById('signup-error-message');
  const loginErrorMsg = document.getElementById('login-error-message');
  const userRoleSelect = document.getElementById('user-role');
  const studentFields = document.getElementById('student-fields');
  const lawyerFields = document.getElementById('lawyer-fields');
  const forgotPasswordLink = document.getElementById('forgot-password-link');

  // 🧹 Clear messages
  function clearMessages() {
    signupErrorMsg.textContent = '';
    loginErrorMsg.textContent = '';
  }

  // 🔄 Toggle role-specific fields
  if (userRoleSelect) {
    userRoleSelect.addEventListener('change', () => {
      const role = userRoleSelect.value;
      studentFields.classList.toggle('hidden', role !== 'student');
      lawyerFields.classList.toggle('hidden', role !== 'lawyer');
    });
  }

  // 📝 Sign up form
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearMessages();

      const username = document.getElementById('signup-username').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      const role = userRoleSelect.value;

      if (!username) {
        signupErrorMsg.textContent = "Please enter a username.";
        return;
      }

      if (password !== confirmPassword) {
        signupErrorMsg.textContent = "Passwords do not match.";
        return;
      }

      if (!role) {
        signupErrorMsg.textContent = "Please select your role.";
        return;
      }

      let userData = {
        username,
        email,
        role,
        status: role === 'student' ? 'law_student' : role === 'lawyer' ? 'lawyer' : 'spectator',
        createdAt: Date.now()
      };

      if (role === 'student') {
        userData.s
