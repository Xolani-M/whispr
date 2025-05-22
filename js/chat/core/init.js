import { DOM, STORAGE_KEYS } from './constants.js';

export function initializeApp() {
  const currentUserData = localStorage.getItem('currentUser');
  if (!currentUserData) {
    window.location.href = './pages/signin.html';
    return null;
  }

  const currentUser = JSON.parse(currentUserData);
  
  // Set initial online status
  localStorage.setItem(STORAGE_KEYS.userStatus(currentUser.email), 'online');
  localStorage.removeItem(STORAGE_KEYS.lastSeen(currentUser.email));
  
  // Display current user
  DOM.loggedInUserSpan.textContent = currentUser.name;
  
  return {
    currentUser,
    state: {
      currentChat: null,
      intervals: {
        messageCheck: null,
        statusCheck: null
      }
    }
  };
}

export function cleanupOnUnload(currentUser) {
  window.addEventListener('beforeunload', () => {
    localStorage.setItem(STORAGE_KEYS.userStatus(currentUser.email), 'offline');
    localStorage.setItem(STORAGE_KEYS.lastSeen(currentUser.email), Date.now());
  });
}
