// Check if user is logged in when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const currentUserData = localStorage.getItem('currentUser');
  
  if (!currentUserData) {
    // If no user is logged in, redirect to login page
    window.location.href = './pages/signin.html';
  }

  // Add logout functionality
  document.getElementById('logout-button').addEventListener('click', function() {
    // Create logout animation effect
    const button = this;
    
    // Add a class for animation
    button.classList.add('logging-out');
    
    // Change button text
    button.innerHTML = '<span>Logging out</span><span class="icon">...</span>';
    
    // Wait a moment before redirecting (for animation effect)
    setTimeout(function() {
      // Remove current user from localStorage
      localStorage.removeItem('currentUser');
      
      // Redirect to login page
      window.location.href = './pages/signin.html';
    }, 800);
  });
});