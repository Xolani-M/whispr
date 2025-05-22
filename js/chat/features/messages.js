import { DOM, STORAGE_KEYS } from '../core/constants.js';
import { formatTime, normalizeEmailForId } from '../utils/helpers.js';

// Message Rendering
export function renderSingleMessage(message, currentUser) {
  const isCurrentUser = message.sender === currentUser.email;
  const senderName = isCurrentUser ? 'You' : (message.senderName || 'Unknown');
  
  const messageElement = document.createElement('div');
  messageElement.className = `message ${isCurrentUser ? 'message-sent' : 'message-received'}`;
  messageElement.innerHTML = `
    <div class="message-sender">${senderName}</div>
    <div class="message-content">${message.text}</div>
    <div class="message-time">${formatTime(message.timestamp)}</div>
  `;
  
  DOM.messagesContainer.appendChild(messageElement);
  DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
}

export function renderMessages(currentUser, currentChat) {
  DOM.messagesContainer.innerHTML = '';
  
  if (!currentChat) {
    showEmptyState('Select a chat to start messaging');
    return;
  }
  
  const chatKey = STORAGE_KEYS.chat(currentUser.email, currentChat.id);
  const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
  
  if (messages.length === 0) {
    showEmptyState('No messages yet. Start the conversation!');
    return;
  }
  
  messages.forEach(message => renderSingleMessage(message, currentUser));
}

function showEmptyState(message) {
  DOM.messagesContainer.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-comment-alt"></i>
      <p>${message}</p>
    </div>
  `;
}

// Message Handling
export function sendMessage(currentUser, currentChat) {
  const messageText = DOM.messageInput.value.trim();
  if (!messageText || !currentChat) return;
  
  const message = createMessageObject(currentUser, currentChat, messageText);
  renderSingleMessage(message, currentUser);
  saveMessageToStorage(currentUser, currentChat, message);
  updateUIAfterSend(messageText);
}

function createMessageObject(currentUser, currentChat, text) {
  return {
    text,
    sender: currentUser.email,
    senderName: currentUser.name,
    timestamp: Date.now(),
    chatId: currentChat.id
  };
}

function saveMessageToStorage(currentUser, currentChat, message) {
  // Save to sender's storage
  const senderKey = STORAGE_KEYS.chat(currentUser.email, currentChat.id);
  const senderMessages = JSON.parse(localStorage.getItem(senderKey)) || [];
  senderMessages.push(message);
  localStorage.setItem(senderKey, JSON.stringify(senderMessages));
  
  // Save to recipients
  if (currentChat.isGroup) {
    currentChat.members.forEach(memberEmail => {
      if (memberEmail !== currentUser.email) {
        saveToRecipient(memberEmail, currentChat.id, message);
      }
    });
  } else {
    saveToRecipient(currentChat.email, normalizeEmailForId(currentUser.email), message);
  }
}

function saveToRecipient(email, chatId, message) {
  const recipientKey = STORAGE_KEYS.chat(email, chatId);
  const recipientMessages = JSON.parse(localStorage.getItem(recipientKey)) || [];
  recipientMessages.push(message);
  localStorage.setItem(recipientKey, JSON.stringify(recipientMessages));
}

function updateUIAfterSend(messageText) {
  DOM.messageInput.value = '';
  DOM.messageInput.focus();
}

// Helpers
export function getLastMessagePreview(currentUser, contact) {
  const chatKey = STORAGE_KEYS.chat(currentUser.email, contact.id);
  const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
  
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    const prefix = lastMessage.sender === currentUser.email ? 'You: ' : '';
    return prefix + lastMessage.text.substring(0, 20) + (lastMessage.text.length > 20 ? '...' : '');
  }
  return '';
}

export function updateLastMessagePreview(contact, text) {
  document.querySelectorAll(`.contact-item[data-contact-id="${contact.id}"]`).forEach(item => {
    const lastMessageElement = item.querySelector('.contact-last-message');
    if (lastMessageElement) {
      lastMessageElement.textContent = 'You: ' + text.substring(0, 20) + (text.length > 20 ? '...' : '');
    }
  });
}