import { DOM, STORAGE_KEYS } from "../core/constants.js";
import { renderSingleMessage, updateLastMessagePreview } from "./messages.js";
import { normalizeEmailForId } from "../utils/helpers.js";

export function startRealtimeUpdates(currentUser, state) {
  state.intervals.messageCheck = setInterval(
    () => checkForNewMessages(currentUser, state.currentChat),
    1000
  );

  state.intervals.statusCheck = setInterval(
    () => updateOnlineStatuses(currentUser),
    3000
  );
}

function checkForNewMessages(currentUser, currentChat) {
  if (!currentChat) return;

  const chatKey = STORAGE_KEYS.chat(currentUser.email, currentChat.id);
  const currentMessages = JSON.parse(localStorage.getItem(chatKey)) || [];
  const lastMessageTime =
    currentMessages[currentMessages.length - 1]?.timestamp || 0;

  if (currentChat.isGroup) {
    checkGroupMessages(
      currentUser,
      currentChat,
      currentMessages,
      lastMessageTime,
      chatKey
    );
  } else {
    checkPrivateMessages(
      currentUser,
      currentChat,
      currentMessages,
      lastMessageTime,
      chatKey
    );
  }
}

function checkGroupMessages(
  currentUser,
  currentChat,
  currentMessages,
  lastMessageTime,
  chatKey
) {
  currentChat.members.forEach((memberEmail) => {
    // Skip checking messages from self
    if (memberEmail === currentUser.email) return;

    const memberKey = STORAGE_KEYS.chat(memberEmail, currentChat.id);
    const memberMessages = JSON.parse(localStorage.getItem(memberKey)) || [];

    memberMessages.forEach((msg) => {
      if (msg.timestamp > lastMessageTime && msg.sender !== currentUser.email) {
        currentMessages.push(msg);
        localStorage.setItem(chatKey, JSON.stringify(currentMessages));
        if (currentChat.id === msg.chatId) {
          renderSingleMessage(msg, currentUser);
          updateLastMessagePreview(currentChat, msg.text);
        }
      }
    });
  });
}

function checkPrivateMessages(
  currentUser,
  currentChat,
  currentMessages,
  lastMessageTime,
  chatKey
) {
  // Skip if this is a chat with ourselves
  if (currentChat.email === currentUser.email) return;

  const otherUserKey = STORAGE_KEYS.chat(
    currentChat.email,
    normalizeEmailForId(currentUser.email)
  );
  const otherUserMessages =
    JSON.parse(localStorage.getItem(otherUserKey)) || [];

  otherUserMessages.forEach((msg) => {
    if (msg.timestamp > lastMessageTime) {
      currentMessages.push(msg);
      localStorage.setItem(chatKey, JSON.stringify(currentMessages));
      renderSingleMessage(msg, currentUser);
      updateLastMessagePreview(currentChat, msg.text);
    }
  });
}

export function updateOnlineStatuses(currentUser) {
  const contacts = [];
  const contactEmails = new Set();

  // Get all contacts except current user
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    // Skip current user and system keys
    if (
      key === currentUser.email ||
      key.startsWith("user_status_") ||
      key.startsWith("last_seen_") ||
      key.startsWith("chat_")
    ) {
      continue;
    }

    const item = localStorage.getItem(key);
    if (!item) continue;

    try {
      const userData = JSON.parse(item);
      if (
        userData?.email &&
        userData?.name &&
        userData.email !== currentUser.email &&
        !contactEmails.has(userData.email)
      ) {
        contacts.push({
          id: normalizeEmailForId(userData.email),
          name: userData.name,
          email: userData.email,
          online:
            localStorage.getItem(STORAGE_KEYS.userStatus(userData.email)) ===
            "online",
          lastSeen: localStorage.getItem(STORAGE_KEYS.lastSeen(userData.email)),
        });
        contactEmails.add(userData.email);
      }
    } catch (e) {
      console.warn("Error parsing user data", e);
    }
  }

  // Update UI for online contacts
  const onlineContacts = contacts.filter((c) => c.online && !c.isGroup);
  const offlineContacts = contacts.filter((c) => !c.online && !c.isGroup);

  DOM.onlineContactsList.innerHTML = "";
  DOM.allContactsList.innerHTML = "";

  // Add online contacts
  onlineContacts.forEach((contact) => {
    const contactElement = createContactElement(currentUser, contact);
    DOM.onlineContactsList.appendChild(contactElement);
    DOM.allContactsList.appendChild(contactElement.cloneNode(true));
  });

  // Add offline contacts
  offlineContacts.forEach((contact) => {
    const contactElement = createContactElement(currentUser, contact);
    DOM.allContactsList.appendChild(contactElement);
  });

  // Update current chat status if it's a private chat
  if (state.currentChat && !state.currentChat.isGroup) {
    const contact = contacts.find((c) => c.email === state.currentChat.email);
    if (contact) {
      DOM.chatStatus.textContent = contact.online
        ? "Online now"
        : `Last seen ${formatLastSeen(contact.lastSeen)}`;
      DOM.chatStatus.style.color = contact.online ? "#48bb78" : "#a0aec0";
    }
  }
}

// Helper function to create contact element (simplified)
function createContactElement(currentUser, contact) {
  const element = document.createElement("div");
  element.className = "contact-item";
  element.dataset.contactId = contact.id;

  const lastMessage = getLastMessagePreview(currentUser, contact);
  const statusText = contact.online
    ? "Online"
    : `Last seen ${formatLastSeen(contact.lastSeen)}`;

  element.innerHTML = `
    <div class="contact-avatar">${contact.name.charAt(0)}</div>
    <div class="contact-info">
      <div class="contact-name">${contact.name}</div>
      <div class="contact-last-message">${lastMessage || statusText}</div>
    </div>
    <div class="contact-status ${
      contact.online ? "status-online" : "status-offline"
    }"></div>
  `;

  return element;
}
