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
    document.getElementById('student-id').required = true;
    document.getElementById('student-university').required = true;
    document.getElementById('student-year-of-study').required = true;
    document.getElementById('lawyer-years-experience').required = false;
  } else if (role === 'lawyer') {
    lawyerFields.classList.remove('hidden');
    studentFields.classList.add('hidden');
    document.getElementById('lawyer-years-experience').required = true;
    document.getElementById('student-id').required = false;
    document.getElementById('student-university').required = false;
    document.getElementById('student-year-of-study').required = false;
  } else {
    studentFields.classList.add('hidden');
    lawyerFields.classList.add('hidden');
    document.getElementById('student-id').required = false;
    document.getElementById('student-university').required = false;
    document.getElementById('student-year-of-study').required = false;
    document.getElementById('lawyer-years-experience').required = false;
  }
}

showSignupBtn.addEventListener('click', showSignup);
showLoginBtn.addEventListener('click', showLogin);
userRoleSelect.addEventListener('change', handleRoleChange);

// ✅ SIGNUP — with username!
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

    await database.ref('users/' + user.uid).set({
      username: username, // ✅ Save it here
      email: email,
      role: role,
      ...extraData,
      createdAt: Date.now()
    });

    alert('Account created successfully! You can now log in.');
    signupForm.reset();
    showLogin();
  } catch (error) {
    signupErrorMsg.textContent = error.message;
  }
});

// LOGIN
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    alert('Login successful! Redirecting...');
    window.location.href = "index.html";
  } catch (error) {
    loginErrorMsg.textContent = error.message;
  }
});

// FORGOT PASSWORD
forgotPasswordLink.addEventListener('click', async (e) => {
  e.preventDefault();
  clearMessages();

  const email = prompt("Please enter your email address to reset your password:");
  if (!email) return;

  try {
    await auth.sendPasswordResetEmail(email);
    alert('Password reset email sent. Please check your inbox.');
  } catch (error) {
    loginErrorMsg.textContent = error.message;
  }
});

// On page load
document.addEventListener('DOMContentLoaded', () => {
  showSignup();
  handleRoleChange();
});

// auth.js

// Auth form toggling
document.getElementById("show-signup").addEventListener("click", () => {
  document.getElementById("signup-form-container").classList.add("active");
  document.getElementById("login-form-container").classList.remove("active");
});

document.getElementById("show-login").addEventListener("click", () => {
  document.getElementById("login-form-container").classList.add("active");
  document.getElementById("signup-form-container").classList.remove("active");
});

// Show/hide role-specific fields
document.getElementById("user-role").addEventListener("change", (e) => {
  const role = e.target.value;
  document.getElementById("student-fields").classList.toggle("hidden", role !== "student");
  document.getElementById("lawyer-fields").classList.toggle("hidden", role !== "lawyer");
});

// Sign up
document.getElementById("signup-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("signup-confirm-password").value;
  const role = document.getElementById("user-role").value;

  if (password !== confirmPassword) {
    document.getElementById("signup-error-message").textContent = "Passwords do not match.";
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const userId = user.uid;

      let userData = {
        email,
        role,
        status: role === "student" ? "law_student" : role === "lawyer" ? "lawyer" : "spectator"
      };

      if (role === "student") {
        userData.studentId = document.getElementById("student-id").value;
        userData.university = document.getElementById("student-university").value;
        userData.yearOfStudy = document.getElementById("student-year-of-study").value;
      }

      if (role === "lawyer") {
        userData.yearsOfExperience = document.getElementById("lawyer-years-experience").value;
      }

      return firebase.database().ref('users/' + userId).set(userData);
    })
    .then(() => {
      alert("Account created!");
    })
    .catch((error) => {
      document.getElementById("signup-error-message").textContent = error.message;
    });
});

// Login
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch((error) => {
      document.getElementById("login-error-message").textContent = error.message;
    });
});

// Logout
document.addEventListener("click", (e) => {
  if (e.target.id === "logout-btn") {
    firebase.auth().signOut();
  }
});

// Auth state change: Update header UI
firebase.auth().onAuthStateChanged((user) => {
  const authButtons = document.getElementById("auth-buttons");
  const userInfo = document.getElementById("user-info");

  if (user) {
    authButtons.classList.add("hidden");
    userInfo.classList.remove("hidden");

    firebase.database().ref("users/" + user.uid).once("value").then(snapshot => {
      const data = snapshot.val();
      document.getElementById("user-name").textContent = data.email;
      document.getElementById("user-role-badge").textContent = data.university || data.status;

      // optional avatar
      const avatar = document.getElementById("user-avatar");
      avatar.src = "assets/default-avatar.png"; // or pull from user profile if available
    });
  } else {
    authButtons.classList.remove("hidden");
    userInfo.classList.add("hidden");
  }
});

