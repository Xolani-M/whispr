/**
 * Core functionality and initialization
 */

export function initChat(currentUser) {
  // Immediately set current user as online and clear last seen
  localStorage.setItem(`user_status_${currentUser.email}`, 'online');
  localStorage.removeItem(`last_seen_${currentUser.email}`);
  
  return {
    currentChat: null,
    messageCheckInterval: null,
    statusCheckInterval: null
  };
}

export function setupWindowUnload(currentUser) {
  window.addEventListener('beforeunload', () => {
    localStorage.setItem(`user_status_${currentUser.email}`, 'offline');
    localStorage.setItem(`last_seen_${currentUser.email}`, Date.now());
  });
}