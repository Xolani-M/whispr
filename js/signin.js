document.addEventListener('DOMContentLoaded', function () {
  const cont = document.querySelector('.cont');
  const imgBtn = document.querySelector('.img-btn');
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');

  // Toggle between sign in and sign up forms
  if (imgBtn && cont) {
    imgBtn.addEventListener('click', () => {
      cont.classList.toggle('s-signup');
    });
  }

  // Sign In Functionality
  if (signinForm) {
    signinForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const email = document.getElementById('signin-email')?.value.trim();
      const password = document.getElementById('signin-password')?.value;

      if (!email || !password) {
        alert('Please enter both email and password.');
        return;
      }

      const userData = localStorage.getItem(email);

      if (!userData) {
        alert('User not found. Please sign up first.');
        return;
      }

      const parsedUser = JSON.parse(userData);

      if (parsedUser.password === password) {
        localStorage.setItem('currentUser', JSON.stringify(parsedUser));
        alert('Login successful!');
        window.location.href = '../index.html';
      } else {
        alert('Incorrect password.');
      }
    });
  }

  // Sign Up Functionality
  if (signupForm) {
    signupForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const name = document.getElementById('signup-name')?.value.trim();
      const email = document.getElementById('signup-email')?.value.trim();
      const password = document.getElementById('signup-password')?.value;
      const confirmPassword = document.getElementById('signup-confirm-password')?.value;

      if (!name || !email || !password || !confirmPassword) {
        alert('All fields are required.');
        return;
      }

      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }

      if (localStorage.getItem(email)) {
        alert('User already exists with this email.');
        return;
      }

      const user = { name, email, password };
      localStorage.setItem(email, JSON.stringify(user));
      alert('Registration successful.');

      signupForm.reset();

      if (cont) {
        cont.classList.remove('s-signup'); // Switch to sign-in form
      }
    });
  }
});
