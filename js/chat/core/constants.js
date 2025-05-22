// DOM Elements
export const DOM = {
  // Contact Lists
  onlineContactsList: document.getElementById('online-contacts'),
  allContactsList: document.getElementById('all-contacts'),
  
  // Message Area
  messagesContainer: document.getElementById('messages-container'),
  messageInput: document.getElementById('message-input'),
  sendButton: document.getElementById('send-button'),
  
  // Chat Header
  currentChatName: document.getElementById('current-chat-name'),
  chatStatus: document.getElementById('chat-status'),
  
  // Modals
  newChatBtn: document.getElementById('new-chat-btn'),
  newChatModal: document.getElementById('new-chat-modal'),
  addUsersModal: document.getElementById('add-users-modal'),
  userSelection: document.querySelector('#add-users-modal .user-selection'),
  
  // User Info
  loggedInUserSpan: document.getElementById('logged-in-user'),
  
  // Search
  searchConversations: document.getElementById('search-conversations'),
  searchUsers: document.getElementById('search-users')
};

// Storage Key Generators
export const STORAGE_KEYS = {
  userStatus: (email) => `user_status_${email}`,
  lastSeen: (email) => `last_seen_${email}`,
  userContacts: (email) => `user_contacts_${email}`,
  chat: (userEmail, chatId) => `chat_${userEmail}_${chatId}`
};
