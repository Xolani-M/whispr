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
        // Set current user and online status
        const currentUser = {
          name: parsedUser.name,
          email: parsedUser.email
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem(`user_status_${email}`, 'online');
        localStorage.removeItem(`last_seen_${email}`);
        
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

      const user = { 
        name, 
        email, 
        password,
        contacts: [] // Initialize empty contacts array
      };
      
      localStorage.setItem(email, JSON.stringify(user));
      
      // Set user as online immediately after signup
      localStorage.setItem(`user_status_${email}`, 'online');
      
      alert('Registration successful. You are now logged in!');
      
      // Automatically log in the new user
      localStorage.setItem('currentUser', JSON.stringify({ name, email }));
      window.location.href = '../index.html';
    });
  }
});