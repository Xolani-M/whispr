document.addEventListener('DOMContentLoaded', function() {
  // ===== VARIABLE DECLARATIONS =====
  const currentUserData = localStorage.getItem('currentUser');
  if (!currentUserData) {
    window.location.href = './pages/signin.html';
    return;
  }

  const currentUser = JSON.parse(currentUserData);
  
  // Immediately set current user as online and clear last seen
  localStorage.setItem(`user_status_${currentUser.email}`, 'online');
  localStorage.removeItem(`last_seen_${currentUser.email}`);
  
  let currentChat = null;
  let messageCheckInterval;
  let statusCheckInterval;
  
  // DOM Elements
  const onlineContactsList = document.getElementById('online-contacts');
  const allContactsList = document.getElementById('all-contacts');
  const messagesContainer = document.getElementById('messages-container');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const currentChatName = document.getElementById('current-chat-name');
  const chatStatus = document.getElementById('chat-status');
  const newChatBtn = document.getElementById('new-chat-btn');
  const newChatModal = document.getElementById('new-chat-modal');
  const addUsersModal = document.getElementById('add-users-modal');
  const loggedInUserSpan = document.getElementById('logged-in-user');
  const searchConversations = document.getElementById('search-conversations');
  const searchUsers = document.getElementById('search-users');

  // ===== UTILITY FUNCTIONS =====
  
  /**
   * Formats timestamp into readable time (e.g., "6:55 AM")
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted time string
   */
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  /**
   * Formats last seen timestamp into relative time (e.g., "1 min ago")
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Relative time string
   */
  function formatLastSeen(timestamp) {
    if (!timestamp) return 'long ago';
    const now = new Date();
    const lastSeen = new Date(parseInt(timestamp));
    const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes/60)} hours ago`;
    return `${Math.floor(diffMinutes/1440)} days ago`;
  }

  // ===== MESSAGE FUNCTIONS =====
  
  /**
   * Renders a single message in the chat UI
   * @param {object} message - Message object containing text, sender, etc.
   */
  function renderSingleMessage(message) {
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
   * Renders all messages for the current chat
   */
  function renderMessages() {
    messagesContainer.innerHTML = '';
    
    if (!currentChat) {
      showEmptyState('Select a chat to start messaging');
      return;
    }
    
    const chatKey = `chat_${currentUser.email}_${currentChat.id}`;
    const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
    
    if (messages.length === 0) {
      showEmptyState('No messages yet. Start the conversation!');
      return;
    }
    
    messages.forEach(message => {
      renderSingleMessage(message);
    });
  }

  /**
   * Shows empty state message when no chat is selected or no messages exist
   * @param {string} message - Message to display
   */
  function showEmptyState(message) {
    messagesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-comment-alt"></i>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Handles sending a new message
   */
  function sendMessage() {
    const messageText = messageInput.value.trim();
    if (!messageText || !currentChat) {
      alert('Please select a chat and enter a message');
      return;
    }
    
    const message = {
      text: messageText,
      sender: currentUser.email,
      senderName: currentUser.name,
      timestamp: Date.now(),
      chatId: currentChat.id
    };
    
    // Immediately render the sent message
    renderSingleMessage(message);
    
    // Save to current user's chat
    const chatKey = `chat_${currentUser.email}_${currentChat.id}`;
    const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
    messages.push(message);
    localStorage.setItem(chatKey, JSON.stringify(messages));
    
    // Save to recipient(s)
    if (currentChat.isGroup) {
      currentChat.members.forEach(memberEmail => {
        if (memberEmail !== currentUser.email) {
          const memberChatKey = `chat_${memberEmail}_${currentChat.id}`;
          const memberMessages = JSON.parse(localStorage.getItem(memberChatKey)) || [];
          memberMessages.push(message);
          localStorage.setItem(memberChatKey, JSON.stringify(memberMessages));
        }
      });
    } else {
      const recipientChatKey = `chat_${currentChat.email}_${currentUser.email.replace(/[@.]/g, '_')}`;
      const recipientMessages = JSON.parse(localStorage.getItem(recipientChatKey)) || [];
      recipientMessages.push(message);
      localStorage.setItem(recipientChatKey, JSON.stringify(recipientMessages));
    }
    
    // Update UI
    updateLastMessagePreview(currentChat, messageText);
    messageInput.value = '';
    messageInput.focus();
  }

  /**
   * Updates the last message preview in the contact list
   * @param {object} contact - Contact object
   * @param {string} text - Message text to display
   */
  function updateLastMessagePreview(contact, text) {
    document.querySelectorAll(`.contact-item[data-contact-id="${contact.id}"]`).forEach(item => {
      const lastMessageElement = item.querySelector('.contact-last-message');
      if (lastMessageElement) {
        lastMessageElement.textContent = 'You: ' + text.substring(0, 20) + (text.length > 20 ? '...' : '');
      }
    });
  }

  // ===== CONTACT FUNCTIONS =====
  
  /**
   * Initializes all contacts with proper online/offline status
   * @returns {Array} Array of contact objects
   */
  function initializeContacts() {
    const contacts = [];
    const contactEmails = new Set();
    
    // Get all registered users from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes('@') && key !== currentUser.email && 
          !key.startsWith('user_status_') && !key.startsWith('last_seen_')) {
        try {
          const item = localStorage.getItem(key);
          if (item !== 'online' && item !== 'offline') {
            const userData = JSON.parse(item);
            if (userData && userData.email && userData.name && !contactEmails.has(userData.email)) {
              // Initialize status if it doesn't exist
              if (!localStorage.getItem(`user_status_${userData.email}`)) {
                localStorage.setItem(`user_status_${userData.email}`, 'offline');
              }
              
              contacts.push({
                id: userData.email.replace(/[@.]/g, '_'),
                name: userData.name,
                email: userData.email,
                online: localStorage.getItem(`user_status_${userData.email}`) === 'online',
                lastSeen: localStorage.getItem(`last_seen_${userData.email}`)
              });
              contactEmails.add(userData.email);
            }
          }
        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }
    
    // Add groups and contacts from user's contact list
    const userContacts = JSON.parse(localStorage.getItem(`user_contacts_${currentUser.email}`)) || [];
    userContacts.forEach(contact => {
      if (contact.isGroup) {
        contacts.push({
          ...contact,
          online: true // Groups are always "online"
        });
      } else if (!contactEmails.has(contact.email)) {
        // Initialize status if it doesn't exist
        if (!localStorage.getItem(`user_status_${contact.email}`)) {
          localStorage.setItem(`user_status_${contact.email}`, 'offline');
        }
        
        contacts.push({
          id: contact.email.replace(/[@.]/g, '_'),
          name: contact.name,
          email: contact.email,
          online: localStorage.getItem(`user_status_${contact.email}`) === 'online',
          lastSeen: localStorage.getItem(`last_seen_${contact.email}`)
        });
        contactEmails.add(contact.email);
      }
    });
    
    return contacts;
  }

  /**
   * Creates a DOM element for a contact
   * @param {object} contact - Contact object
   * @returns {HTMLElement} Contact DOM element
   */
  function createContactElement(contact) {
    const element = document.createElement('div');
    element.className = 'contact-item';
    element.dataset.contactId = contact.id;
    
    const lastMessage = getLastMessagePreview(contact);
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
    
    element.addEventListener('click', () => openChat(contact));
    return element;
  }

  /**
   * Gets the last message preview for a contact
   * @param {object} contact - Contact object
   * @returns {string} Last message preview text
   */
  function getLastMessagePreview(contact) {
    const chatKey = `chat_${currentUser.email}_${contact.id}`;
    const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
    
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const prefix = lastMessage.sender === currentUser.email ? 'You: ' : '';
      return prefix + lastMessage.text.substring(0, 20) + (lastMessage.text.length > 20 ? '...' : '');
    }
    return '';
  }

  /**
   * Renders all contacts in the UI
   */
  function renderContacts() {
    const contacts = initializeContacts();
    
    // Clear existing contacts lists
    onlineContactsList.innerHTML = '';
    allContactsList.innerHTML = '';
    
    // Create a map to ensure each contact only appears once
    const contactsMap = new Map();
    contacts.forEach(contact => {
      if (!contactsMap.has(contact.id)) {
        contactsMap.set(contact.id, contact);
      }
    });
    
    // Sort contacts - online first
    const sortedContacts = Array.from(contactsMap.values()).sort((a, b) => {
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;
      return 0;
    });
    
    sortedContacts.forEach(contact => {
      const contactElement = createContactElement(contact);
      
      if (contact.online && !contact.isGroup) {
        onlineContactsList.appendChild(contactElement.cloneNode(true));
      }
      
      allContactsList.appendChild(contactElement);
    });

    // Set up click handlers for all contact items
    document.querySelectorAll('.contact-item').forEach(item => {
      item.addEventListener('click', () => {
        const contactId = item.dataset.contactId;
        const contact = contactsMap.get(contactId);
        if (contact) {
          openChat(contact);
        }
      });
    });
  }

  /**
   * Opens a chat with the specified contact
   * @param {object} contact - Contact object to chat with
   */
  function openChat(contact) {
    if (!contact) return;
    
    currentChat = contact;
    currentChatName.textContent = contact.name;
    
    if (contact.isGroup) {
      chatStatus.textContent = `${contact.members.length} members`;
      chatStatus.style.color = '#4a5568';
    } else {
      const isOnline = localStorage.getItem(`user_status_${contact.email}`) === 'online';
      chatStatus.textContent = isOnline ? 'Online now' : `Last seen ${formatLastSeen(contact.lastSeen)}`;
      chatStatus.style.color = isOnline ? '#48bb78' : '#a0aec0';
    }
    
    // Enable input
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.placeholder = `Message ${contact.name}...`;
    
    // Highlight contact
    document.querySelectorAll('.contact-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.contactId === contact.id) {
        item.classList.add('active');
      }
    });
    
    renderMessages();
    messageInput.focus();
  }

  // ===== REAL-TIME UPDATES =====
  
  /**
   * Checks for new messages in the current chat
   */
  function checkForNewMessages() {
    if (!currentChat) return;
    
    const chatKey = `chat_${currentUser.email}_${currentChat.id}`;
    const currentMessages = JSON.parse(localStorage.getItem(chatKey)) || [];
    const lastMessageTime = currentMessages[currentMessages.length - 1]?.timestamp || 0;
    
    if (currentChat.isGroup) {
      currentChat.members.forEach(memberEmail => {
        if (memberEmail !== currentUser.email) {
          const memberChatKey = `chat_${memberEmail}_${currentChat.id}`;
          const memberMessages = JSON.parse(localStorage.getItem(memberChatKey)) || [];
          
          memberMessages.forEach(msg => {
            if (msg.timestamp > lastMessageTime && msg.sender !== currentUser.email) {
              currentMessages.push(msg);
              localStorage.setItem(chatKey, JSON.stringify(currentMessages));
              if (currentChat.id === msg.chatId) {
                renderSingleMessage(msg);
                updateLastMessagePreview(currentChat, msg.text);
              }
            }
          });
        }
      });
    } else {
      const otherUserChatKey = `chat_${currentChat.email}_${currentUser.email.replace(/[@.]/g, '_')}`;
      const otherUserMessages = JSON.parse(localStorage.getItem(otherUserChatKey)) || [];
      
      otherUserMessages.forEach(msg => {
        if (msg.timestamp > lastMessageTime) {
          currentMessages.push(msg);
          localStorage.setItem(chatKey, JSON.stringify(currentMessages));
          renderSingleMessage(msg);
          updateLastMessagePreview(currentChat, msg.text);
        }
      });
    }
  }

  /**
   * Updates all contacts' online statuses in the UI
   */
  function updateOnlineStatuses() {
    const contacts = initializeContacts();
    const contactsMap = new Map();
    
    // Build a map of contacts with updated statuses
    contacts.forEach(contact => {
      if (!contact.isGroup) {
        // Force status check for all contacts
        const isOnline = localStorage.getItem(`user_status_${contact.email}`) === 'online';
        contactsMap.set(contact.id, {
          ...contact,
          online: isOnline
        });
      }
    });
    
    // Find contacts that need to be moved between lists
    const onlineContacts = [];
    const offlineContacts = [];
    
    contactsMap.forEach(contact => {
      if (contact.online) {
        onlineContacts.push(contact);
      } else {
        offlineContacts.push(contact);
      }
    });
    
    // Clear and rebuild the contacts lists
    onlineContactsList.innerHTML = '';
    allContactsList.innerHTML = '';
    
    // Add online contacts to both lists
    onlineContacts.forEach(contact => {
      onlineContactsList.appendChild(createContactElement(contact));
      allContactsList.appendChild(createContactElement(contact));
    });
    
    // Add offline contacts only to all contacts list
    offlineContacts.forEach(contact => {
      allContactsList.appendChild(createContactElement(contact));
    });
    
    // Re-add group contacts to all contacts list
    contacts.forEach(contact => {
      if (contact.isGroup) {
        allContactsList.appendChild(createContactElement(contact));
      }
    });
    
    // Highlight current chat if it exists
    if (currentChat) {
      document.querySelectorAll(`.contact-item[data-contact-id="${currentChat.id}"]`).forEach(item => {
        item.classList.add('active');
      });
      
      // Update status in chat header if it's a private chat
      if (!currentChat.isGroup) {
        const isOnline = localStorage.getItem(`user_status_${currentChat.email}`) === 'online';
        chatStatus.textContent = isOnline ? 'Online now' : `Last seen ${formatLastSeen(currentChat.lastSeen)}`;
        chatStatus.style.color = isOnline ? '#48bb78' : '#a0aec0';
      }
    }
  }

  // ===== CHAT CREATION FUNCTIONS =====
  
  /**
   * Creates a new private chat modal
   */
  function createPrivateChat() {
    const contacts = initializeContacts();
    const availableContacts = contacts.filter(c => 
      !c.isGroup && c.email !== currentUser.email
    );
    
    const userSelection = document.querySelector('#add-users-modal .user-selection');
    userSelection.innerHTML = '';
    
    if (availableContacts.length === 0) {
      userSelection.innerHTML = '<div class="no-contacts">No contacts available</div>';
    } else {
      availableContacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'user-selection-item';
        item.innerHTML = `
          <input type="radio" name="selected-user" id="user-${contact.id}" value="${contact.email}">
          <label for="user-${contact.id}">
            <span class="contact-avatar-small">${contact.name.charAt(0)}</span>
            <div>
              <div class="contact-name">${contact.name}</div>
              <div class="contact-status-text">${contact.online ? 'Online' : 'Offline'}</div>
            </div>
          </label>
        `;
        userSelection.appendChild(item);
      });
    }
    
    document.querySelector('#add-users-modal h3').textContent = 'Select User to Chat With';
    newChatModal.style.display = 'none';
    addUsersModal.style.display = 'block';
    
    const confirmBtn = document.getElementById('confirm-add-users');
    confirmBtn.textContent = 'Start Chat';
    confirmBtn.onclick = () => {
      const selectedEmail = document.querySelector('input[name="selected-user"]:checked')?.value;
      if (selectedEmail) {
        const selectedContact = contacts.find(c => c.email === selectedEmail);
        if (selectedContact) {
          openChat(selectedContact);
          addUsersModal.style.display = 'none';
        }
      }
    };
  }

  /**
   * Creates a new group chat modal
   */
  function createGroupChat() {
    const contacts = initializeContacts();
    const availableContacts = contacts.filter(c => 
      !c.isGroup && c.email !== currentUser.email
    );
    
    const userSelection = document.querySelector('#add-users-modal .user-selection');
    userSelection.innerHTML = '';
    
    if (availableContacts.length === 0) {
      userSelection.innerHTML = '<div class="no-contacts">No contacts available</div>';
    } else {
      availableContacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'user-selection-item';
        item.innerHTML = `
          <input type="checkbox" id="group-user-${contact.id}" value="${contact.email}">
          <label for="group-user-${contact.id}">
            <span class="contact-avatar-small">${contact.name.charAt(0)}</span>
            <div>
              <div class="contact-name">${contact.name}</div>
              <div class="contact-status-text">${contact.online ? 'Online' : 'Offline'}</div>
            </div>
          </label>
        `;
        userSelection.appendChild(item);
      });
    }
    
    document.querySelector('#add-users-modal h3').textContent = 'Select Users for Group Chat';
    newChatModal.style.display = 'none';
    addUsersModal.style.display = 'block';
    
    const confirmBtn = document.getElementById('confirm-add-users');
    confirmBtn.textContent = 'Create Group';
    confirmBtn.onclick = () => {
      const selectedEmails = Array.from(
        document.querySelectorAll('input[type="checkbox"]:checked')
      ).map(el => el.value);
      
      if (selectedEmails.length > 0) {
        const groupName = prompt('Enter group name:');
        if (groupName && groupName.trim()) {
          const groupId = `group_${Date.now()}`;
          
          // Create group contact
          const groupContact = {
            id: groupId,
            name: groupName,
            email: groupId + '@group',
            isGroup: true,
            members: [currentUser.email, ...selectedEmails],
            online: true
          };
          
          // Add to all members' contact lists
          groupContact.members.forEach(memberEmail => {
            const memberContacts = JSON.parse(
              localStorage.getItem(`user_contacts_${memberEmail}`)
            ) || [];
            
            if (!memberContacts.some(c => c.id === groupId)) {
              memberContacts.push(groupContact);
              localStorage.setItem(
                `user_contacts_${memberEmail}`,
                JSON.stringify(memberContacts)
              );
            }
          });
          
          // Open the new group chat
          openChat(groupContact);
          addUsersModal.style.display = 'none';
          
          // Refresh contacts list
          renderContacts();
        }
      }
    };
  }

  // ===== EVENT LISTENERS =====
  
  /**
   * Sets up all event listeners for the application
   */
  function setupEventListeners() {
    // Send message on button click
    sendButton.addEventListener('click', function(e) {
      e.preventDefault();
      sendMessage();
    });
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // New chat button
    newChatBtn.addEventListener('click', () => {
      newChatModal.style.display = 'block';
    });
    
    // New private chat button
    document.getElementById('new-private-chat').addEventListener('click', createPrivateChat);
    
    // New group chat button
    document.getElementById('new-group-chat').addEventListener('click', createGroupChat);
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        newChatModal.style.display = 'none';
        addUsersModal.style.display = 'none';
      });
    });
    
    // Cancel button in add users modal
    document.getElementById('cancel-add-users').addEventListener('click', () => {
      addUsersModal.style.display = 'none';
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === newChatModal) {
        newChatModal.style.display = 'none';
      }
      if (e.target === addUsersModal) {
        addUsersModal.style.display = 'none';
      }
    });
    
    // Search functionality
    searchConversations.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      document.querySelectorAll('.contact-item').forEach(item => {
        const name = item.querySelector('.contact-name').textContent.toLowerCase();
        item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
      });
    });

    // Search in add users modal
    searchUsers?.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      document.querySelectorAll('#add-users-modal .user-selection-item').forEach(item => {
        const name = item.textContent.toLowerCase();
        item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
      });
    });
  }

  // ===== INITIALIZATION =====
  
  /**
   * Initializes the application
   */
  function init() {
    // Display current user
    loggedInUserSpan.textContent = currentUser.name;
    
    renderContacts();
    setupEventListeners();
    
    // Start checking for new messages
    messageCheckInterval = setInterval(checkForNewMessages, 1000);
    
    // Start checking for online status updates
    statusCheckInterval = setInterval(updateOnlineStatuses, 3000);
    
    // Clean up when page unloads
    window.addEventListener('beforeunload', () => {
      clearInterval(messageCheckInterval);
      clearInterval(statusCheckInterval);
      localStorage.setItem(`user_status_${currentUser.email}`, 'offline');
      localStorage.setItem(`last_seen_${currentUser.email}`, Date.now());
    });
  }

  // ===== START THE APPLICATION =====
  init();
});