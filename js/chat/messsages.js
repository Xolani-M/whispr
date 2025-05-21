/**
 * Message handling functions
 */

import { formatTime } from './utils.js';

/**
 * Renders a single message in the chat UI
 * @param {object} message - Message object containing text, sender, etc.
 * @param {object} currentUser - Current user data
 * @param {HTMLElement} messagesContainer - DOM element for messages
 */
export function renderSingleMessage(message, currentUser, messagesContainer) {
  const isCurrentUser = message.sender === currentUser.email;
  const senderName = isCurrentUser ? 'You' : (message.senderName || 'Unknown');
  
  const messageElement = document.createElement('div');
  messageElement.className = `message ${isCurrentUser ? 'message-sent' : 'message-received'}`;
  messageElement.innerHTML = `
    <div class="message-sender">${senderName}</div>
    <div class="message-content">${message.text}</div>
    <div class="message-time">${formatTime(message.timestamp)}</div>
  `;
  
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Shows empty state message when no chat is selected or no messages exist
 * @param {string} message - Message to display
 * @param {HTMLElement} messagesContainer - DOM element for messages
 */
export function showEmptyState(message, messagesContainer) {
  messagesContainer.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-comment-alt"></i>
      <p>${message}</p>
    </div>
  `;
}
