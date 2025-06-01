// Initialize Firebase Auth and Database instances (already done in HTML)

// DOM Elements
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

// Toggle between signup and login views
function showSignup() {
  showSignupBtn.classList.add('active');
  showLoginBtn.classList.remove('active');
  signupFormContainer.classList.add('active');
  loginFormContainer.classList.remove('active');
  clearMessages();
}

function showLogin() {
  showLoginBtn.classList.add('active');
  showSignupBtn.classList.remove('active');
  loginFormContainer.classList.add('active');
  signupFormContainer.classList.remove('active');
  clearMessages();
}

// Clear error messages
function clearMessages() {
  signupErrorMsg.textContent = '';
  loginErrorMsg.textContent = '';
}

// Show/hide fields depending on role selected
function handleRoleChange() {
  const role = userRoleSelect.value;
  if (role === 'student') {
    studentFields.classList.remove('hidden');
    lawyerFields.classList.add('hidden');
    // Make student fields required
    document.getElementById('student-id').required = true;
    document.getElementById('student-university').required = true;
    document.getElementById('student-year-of-study').required = true;
    // Remove lawyer required
    document.getElementById('lawyer-years-experience').required = false;
  } else if (role === 'lawyer') {
    lawyerFields.classList.remove('hidden');
    studentFields.classList.add('hidden');
    // Make lawyer fields required
    document.getElementById('lawyer-years-experience').required = true;
    // Remove student required
    document.getElementById('student-id').required = false;
    document.getElementById('student-university').required = false;
    document.getElementById('student-year-of-study').required = false;
  } else {
    // observer or blank role
    studentFields.classList.add('hidden');
    lawyerFields.classList.add('hidden');
    // Remove all specific required
    document.getElementById('student-id').required = false;
    document.getElementById('student-university').required = false;
    document.getElementById('student-year-of-study').required = false;
    document.getElementById('lawyer-years-experience').required = false;
  }
}

// Attach toggle event listeners
showSignupBtn.addEventListener('click', showSignup);
showLoginBtn.addEventListener('click', showLogin);
userRoleSelect.addEventListener('change', handleRoleChange);

// Signup form submission
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  const role = userRoleSelect.value;

  if (password !== confirmPassword) {
    signupErrorMsg.textContent = "Passwords do not match.";
    return;
  }

  if (!role) {
    signupErrorMsg.textContent = "Please select your role.";
    return;
  }

  // Gather extra info based on role
  let extraData = {};

  if (role === 'student') {
    extraData.studentId = document.getElementById('student-id').value.trim();
    extraData.university = document.getElementById('student-university').value;
    extraData.yearOfStudy = document.getElementById('student-year-of-study').value;

    if (!extraData.studentId || !extraData.university || !extraData.yearOfStudy) {
      signupErrorMsg.textContent = "Please fill all student-specific fields.";
      return;
    }
  } else if (role === 'lawyer') {
    const experience = document.getElementById('lawyer-years-experience').value;
    if (experience === '' || experience < 0) {
      signupErrorMsg.textContent = "Please enter valid years of experience.";
      return;
    }
    extraData.yearsExperience = experience;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Save additional user data to Realtime Database
    await database.ref('users/' + user.uid).set({
      email: email,
      role: role,
      ...extraData,
      createdAt: Date.now()
    });

    // Optionally redirect or show success message
    alert('Account created successfully! You can now log in.');
    signupForm.reset();
    showLogin();
  } catch (error) {
    signupErrorMsg.textContent = error.message;
  }
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    // Redirect or update UI after login
    alert('Login successful! Redirecting...');
    window.location.href = "index.html"; // Redirect to homepage or dashboard
  } catch (error) {
    loginErrorMsg.textContent = error.message;
  }
});

// Forgot Password functionality
forgotPasswordLink.addEventListener('click', async (e) => {
  e.preventDefault();
  clearMessages();

  const email = prompt("Please enter your email address to reset your password:");

  if (!email) {
    return; // user cancelled
  }

  try {
    await auth.sendPasswordResetEmail(email);
    alert('Password reset email sent. Please check your inbox.');
  } catch (error) {
    loginErrorMsg.textContent = error.message;
  }
});

// On page load, set default to signup view and hide role-specific fields
document.addEventListener('DOMContentLoaded', () => {
  showSignup();
  handleRoleChange();
});
