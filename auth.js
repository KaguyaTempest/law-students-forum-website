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

  // 🔁 Toggle forms
  if (showSignupBtn && showLoginBtn) {
    showSignupBtn.addEventListener('click', () => {
      signupFormContainer.classList.add('active');
      loginFormContainer.classList.remove('active');
      clearMessages();
    });

    showLoginBtn.addEventListener('click', () => {
      loginFormContainer.classList.add('active');
      signupFormContainer.classList.remove('active');
      clearMessages();
    });
  }

  // 🔄 Toggle role-specific fields
  if (userRoleSelect) {
    userRoleSelect.addEventListener('change', () => {
      const role = userRoleSelect.value;
      studentFields.classList.toggle('hidden', role !== 'student');
      lawyerFields.classList.toggle('hidden', role !== 'lawyer');
    });
  }

  // 🧹 Clear messages
  function clearMessages() {
    signupErrorMsg.textContent = '';
    loginErrorMsg.textContent = '';
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
        userData.studentId = document.getElementById('student-id').value;
        userData.university = document.getElementById('student-university').value;
        userData.yearOfStudy = document.getElementById('student-year-of-study').value;
      }

      if (role === 'lawyer') {
        userData.yearsOfExperience = document.getElementById('lawyer-years-experience').value;
      }

      try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        await firebase.database().ref('users/' + uid).set(userData);

        alert("Account created successfully! Please log in.");
        signupForm.reset();
        showLoginBtn.click();
      } catch (error) {
        signupErrorMsg.textContent = error.message;
      }
    });
  }

  // 🔐 Login form
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearMessages();

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        alert('Login successful!');
        window.location.href = 'index.html';
      } catch (error) {
        loginErrorMsg.textContent = error.message;
      }
    });
  }

  // 🔑 Forgot password
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
      e.preventDefault();
      clearMessages();

      const email = prompt("Enter your email for password reset:");
      if (!email) return;

      try {
        await firebase.auth().sendPasswordResetEmail(email);
        alert('Password reset link sent.');
      } catch (error) {
        loginErrorMsg.textContent = error.message;
      }
    });
  }

  // 🚪 Logout button (delegated)
  document.addEventListener("click", (e) => {
    if (e.target.id === "logout-btn") {
      firebase.auth().signOut();
    }
  });

  // 👤 Update header UI based on login state
  firebase.auth().onAuthStateChanged((user) => {
    const authButtons = document.getElementById("auth-buttons");
    const userInfo = document.getElementById("user-info");

    if (user) {
      if (authButtons) authButtons.classList.add("hidden");
      if (userInfo) userInfo.classList.remove("hidden");

      firebase.database().ref("users/" + user.uid).once("value").then(snapshot => {
        const data = snapshot.val();
        document.getElementById("user-name").textContent = data.username || data.email;
        document.getElementById("user-role-badge").textContent = data.university || data.status;

        const avatar = document.getElementById("user-avatar");
        if (avatar) {
          avatar.src = "assets/default-avatar.png";
        }
      });
    } else {
      if (authButtons) authButtons.classList.remove("hidden");
      if (userInfo) userInfo.classList.add("hidden");
    }
  });
});
