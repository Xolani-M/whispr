import { initializeApp, cleanupOnUnload } from './core/init.js';
import { renderContacts } from './features/contacts.js';
import { setupEventListeners } from './events/listeners.js';
import { startRealtimeUpdates } from './features/realtime.js';
import { setupModals } from './features/modals.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = initializeApp();
  if (!app) return; // User not logged in
  
  const { currentUser, state } = app;
  
  // Initialize UI
  renderContacts(currentUser);
  
  // Set up interactions
  setupEventListeners(currentUser, state);
  setupModals(currentUser, state);
  
  // Start background processes
  startRealtimeUpdates(currentUser, state);
  cleanupOnUnload(currentUser);
});