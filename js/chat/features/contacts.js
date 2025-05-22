import { DOM, STORAGE_KEYS } from '../core/constants.js';
import { formatLastSeen, normalizeEmailForId, isUserData } from '../utils/helpers.js';
import { getLastMessagePreview } from './messages.js';

/**
 * Initializes and returns all contacts for the current user
 * @param {object} currentUser - The currently logged in user
 * @returns {Array} Array of contact objects
 */
export function initializeContacts(currentUser) {
  const contacts = [];
  const contactEmails = new Set();

  // 1. Get all registered users from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    // Skip system keys and current user
    if (shouldSkipKey(key, currentUser.email)) continue;

    const item = localStorage.getItem(key);
    if (!item) continue;

    // Process potential user data
    const userData = safelyParseUserData(item);
    if (userData && !contactEmails.has(userData.email) && userData.email !== currentUser.email ) {
      contacts.push(createContactObject(userData));
      contactEmails.add(userData.email);
    }
  }

  // 2. Add user's saved contacts (including groups)
  const userContacts = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.userContacts(currentUser.email)) || '[]'
  );
  
  userContacts.forEach(contact => {
    if (contact.isGroup || !contactEmails.has(contact.email)  && contact.email !== currentUser.email) {
      contacts.push(contact.isGroup ? 
        contact : 
        createContactObject(contact)
      );
      contactEmails.add(contact.email);
    }
  });

  return contacts;
}

/**
 * Creates a contact element for the UI
 * @param {object} currentUser - Current logged in user
 * @param {object} contact - Contact data
 * @returns {HTMLElement} The contact DOM element
 */
export function createContactElement(currentUser, contact) {
  const element = document.createElement('div');
  element.className = 'contact-item';
  element.dataset.contactId = contact.id;
  
  const lastMessage = getLastMessagePreview(currentUser, contact);
  const statusText = contact.isGroup ? 
    `${contact.members.length} members` : 
    (contact.online ? 'Online' : `Last seen ${formatLastSeen(contact.lastSeen)}`);

  element.innerHTML = `
    <div class="contact-avatar">${contact.name.charAt(0)}</div>
    <div class="contact-info">
      <div class="contact-name">${contact.name}</div>
      <div class="contact-last-message">${lastMessage || statusText}</div>
    </div>
    <div class="contact-status ${contact.online ? 'status-online' : 'status-offline'}"></div>
  `;

  return element;
}

/**
 * Renders all contacts in the UI
 * @param {object} currentUser - Current logged in user
 */
export function renderContacts(currentUser) {
  const contacts = initializeContacts(currentUser);
  
  // Clear existing contacts
  DOM.onlineContactsList.innerHTML = '';
  DOM.allContactsList.innerHTML = '';
  
  // Sort contacts - online first, then by name
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.online && !b.online) return -1;
    if (!a.online && b.online) return 1;
    return a.name.localeCompare(b.name);
  });

  // Render contacts
  sortedContacts.forEach(contact => {
    const contactElement = createContactElement(currentUser, contact);
    
    if (contact.online && !contact.isGroup) {
      DOM.onlineContactsList.appendChild(contactElement.cloneNode(true));
    }
    
    DOM.allContactsList.appendChild(contactElement);
  });
}

/**
 * Opens a chat with the specified contact
 * @param {object} currentUser - Current user data
 * @param {object} contact - Contact to chat with
 * @param {object} state - Application state
 */
export function openChat(currentUser, contact, state) {
  if (!contact) return;
  
  state.currentChat = contact;
  DOM.currentChatName.textContent = contact.name;
  
  if (contact.isGroup) {
    DOM.chatStatus.textContent = `${contact.members.length} members`;
    DOM.chatStatus.style.color = '#4a5568';
  } else {
    const isOnline = localStorage.getItem(STORAGE_KEYS.userStatus(contact.email)) === 'online';
    DOM.chatStatus.textContent = isOnline ? 'Online now' : `Last seen ${formatLastSeen(contact.lastSeen)}`;
    DOM.chatStatus.style.color = isOnline ? '#48bb78' : '#a0aec0';
  }
  
  // Enable message input
  DOM.messageInput.disabled = false;
  DOM.sendButton.disabled = false;
  DOM.messageInput.placeholder = `Message ${contact.name}...`;
  
  // Highlight active contact
  document.querySelectorAll('.contact-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.contactId === contact.id) {
      item.classList.add('active');
    }
  });
}

// Helper Functions

function shouldSkipKey(key, currentUserEmail) {
  return (
    key === currentUserEmail ||
    key.startsWith('user_status_') || 
    key.startsWith('last_seen_') ||
    key.startsWith('chat_')
  );
}

function safelyParseUserData(item) {
  try {
    // Skip non-JSON values
    if (typeof item !== 'string' || !['{', '['].includes(item[0])) {
      return null;
    }

    const data = JSON.parse(item);
    return isUserData(data) ? data : null;
  } catch (e) {
    console.warn('Failed to parse user data:', e);
    return null;
  }
}

function createContactObject(userData) {
  return {
    id: normalizeEmailForId(userData.email),
    name: userData.name,
    email: userData.email,
    online: localStorage.getItem(STORAGE_KEYS.userStatus(userData.email)) === 'online',
    lastSeen: localStorage.getItem(STORAGE_KEYS.lastSeen(userData.email)),
    isGroup: userData.isGroup || false,
    members: userData.members || []
  };
}