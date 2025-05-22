import { DOM } from '../core/constants.js';
import { initializeContacts } from './contacts.js';
import { openChat } from './contacts.js';

// Modal Management
export function setupModals(currentUser, state) {
  DOM.newChatBtn.addEventListener('click', () => {
    DOM.newChatModal.style.display = 'block';
  });

  document.getElementById('new-private-chat').addEventListener('click', 
    () => createPrivateChat(currentUser, state));
  
  document.getElementById('new-group-chat').addEventListener('click', 
    () => createGroupChat(currentUser));
  
  setupModalCloseHandlers();
}

function setupModalCloseHandlers() {
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.newChatModal.style.display = 'none';
      DOM.addUsersModal.style.display = 'none';
    });
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === DOM.newChatModal) DOM.newChatModal.style.display = 'none';
    if (e.target === DOM.addUsersModal) DOM.addUsersModal.style.display = 'none';
  });
}

// Chat Creation
export function createPrivateChat(currentUser, state) {
  const contacts = initializeContacts(currentUser);
  const availableContacts = contacts.filter(c => 
    !c.isGroup && c.email !== currentUser.email
  );
  
  renderUserSelection(availableContacts, 'Select User to Chat With', 'Start Chat', (selectedEmail) => {
    const selectedContact = contacts.find(c => c.email === selectedEmail);
    if (selectedContact) {
      openChat(currentUser, selectedContact, state);
      DOM.addUsersModal.style.display = 'none';
    }
  });
}

export function createGroupChat(currentUser) {
  const contacts = initializeContacts(currentUser);
  const availableContacts = contacts.filter(c => 
    !c.isGroup && c.email !== currentUser.email
  );
  
  renderUserSelection(availableContacts, 'Select Users for Group Chat', 'Create Group', (selectedEmails) => {
    const groupName = prompt('Enter group name:');
    if (groupName?.trim()) {
      createGroup(currentUser, groupName, selectedEmails);
      DOM.addUsersModal.style.display = 'none';
    }
  }, true);
}

// Helper Functions
function renderUserSelection(contacts, title, confirmText, onConfirm, isMultiSelect = false) {
  DOM.userSelection.innerHTML = '';
  DOM.querySelector('#add-users-modal h3').textContent = title;
  
  if (contacts.length === 0) {
    DOM.userSelection.innerHTML = '<div class="no-contacts">No contacts available</div>';
  } else {
    contacts.forEach(contact => {
      const item = document.createElement('div');
      item.className = 'user-selection-item';
      item.innerHTML = `
        <input type="${isMultiSelect ? 'checkbox' : 'radio'}" 
               name="selected-user" 
               id="user-${contact.id}" 
               value="${contact.email}">
        <label for="user-${contact.id}">
          <span class="contact-avatar-small">${contact.name.charAt(0)}</span>
          <div>
            <div class="contact-name">${contact.name}</div>
            <div class="contact-status-text">${contact.online ? 'Online' : 'Offline'}</div>
          </div>
        </label>
      `;
      DOM.userSelection.appendChild(item);
    });
  }
  
  DOM.addUsersModal.style.display = 'block';
  setupConfirmButton(confirmText, onConfirm, isMultiSelect);
}

function setupConfirmButton(text, onConfirm, isMultiSelect) {
  const confirmBtn = document.getElementById('confirm-add-users');
  confirmBtn.textContent = text;
  confirmBtn.onclick = () => {
    const selected = isMultiSelect
      ? Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value)
      : document.querySelector('input[name="selected-user"]:checked')?.value;
    
    if (selected) onConfirm(selected);
  };
}

function createGroup(currentUser, name, memberEmails) {
  const groupId = `group_${Date.now()}`;
  const groupContact = {
    id: groupId,
    name,
    email: `${groupId}@group`,
    isGroup: true,
    members: [currentUser.email, ...memberEmails],
    online: true
  };
  
  // Save to all members
  groupContact.members.forEach(memberEmail => {
    const memberContacts = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.userContacts(memberEmail))
    ) || [];
    
    if (!memberContacts.some(c => c.id === groupId)) {
      memberContacts.push(groupContact);
      localStorage.setItem(
        STORAGE_KEYS.userContacts(memberEmail),
        JSON.stringify(memberContacts)
      );
    }
  });
  
  return groupContact;
}