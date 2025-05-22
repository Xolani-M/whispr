import { DOM } from '../core/constants.js';
import { sendMessage } from '../features/messages.js';

export function setupEventListeners(currentUser, state) {
  // Message Input
  DOM.sendButton.addEventListener('click', (e) => {
    e.preventDefault();
    sendMessage(currentUser, state.currentChat);
  });

  DOM.messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage(currentUser, state.currentChat);
    }
  });

  // Search
  DOM.searchConversations.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.contact-item').forEach(item => {
      const name = item.querySelector('.contact-name').textContent.toLowerCase();
      item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
  });

  DOM.searchUsers?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('#add-users-modal .user-selection-item').forEach(item => {
      const name = item.textContent.toLowerCase();
      item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
  });
}