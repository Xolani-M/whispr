/**
 * Utility functions for the chat application
 */

// ===== TIME FORMATTING =====

/**
 * Formats timestamp into readable time (e.g., "6:55 AM")
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time string
 */
export function formatTime(timestamp) {
  if (!timestamp || isNaN(timestamp)) return '';
  
  const date = new Date(parseInt(timestamp));
  if (isNaN(date.getTime())) return '';
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Formats last seen timestamp into relative time (e.g., "1 min ago")
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Relative time string
 */
export function formatLastSeen(timestamp) {
  if (!timestamp || isNaN(timestamp)) return 'long ago';
  
  const now = new Date();
  const lastSeen = new Date(parseInt(timestamp));
  if (isNaN(lastSeen.getTime())) return 'long ago';
  
  const diffSeconds = Math.floor((now - lastSeen) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  
  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds} sec ago`;
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
  return `${Math.floor(diffMinutes / 1440)} days ago`;
}

// ===== DATA VALIDATION =====

/**
 * Validates if an object contains valid user data
 * @param {any} obj - Data to validate
 * @returns {boolean} True if valid user data
 */
export function isUserData(obj) {
  return obj && 
         typeof obj === 'object' && 
         !Array.isArray(obj) &&
         'email' in obj && 
         'name' in obj &&
         typeof obj.email === 'string' &&
         typeof obj.name === 'string' &&
         obj.email.includes('@') &&
         obj.name.trim().length > 0;
}

/**
 * Validates if an object is a valid message
 * @param {any} obj - Data to validate
 * @returns {boolean} True if valid message
 */
export function isMessage(obj) {
  return obj &&
         typeof obj === 'object' &&
         'text' in obj &&
         'sender' in obj &&
         'timestamp' in obj &&
         typeof obj.text === 'string' &&
         typeof obj.sender === 'string' &&
         typeof obj.timestamp === 'number';
}

// ===== DATA TRANSFORMATION =====

/**
 * Normalizes email for use in IDs by replacing special characters
 * @param {string} email - Email address to normalize
 * @returns {string} Normalized ID-safe string
 */
export function normalizeEmailForId(email) {
  if (!email || typeof email !== 'string') return '';
  return email.replace(/[@.]/g, '_').toLowerCase();
}

/**
 * Safely parses JSON with error handling
 * @param {string} jsonString - String to parse
 * @returns {object|null} Parsed object or null if invalid
 */
export function safeJsonParse(jsonString) {
  try {
    if (typeof jsonString !== 'string') return null;
    const result = JSON.parse(jsonString);
    return (result && typeof result === 'object') ? result : null;
  } catch (e) {
    console.warn('JSON parse error:', e);
    return null;
  }
}

// ===== DOM HELPERS =====

/**
 * Scrolls an element to the bottom
 * @param {HTMLElement} element - DOM element to scroll
 */
export function scrollToBottom(element) {
  if (element && element.scrollHeight) {
    element.scrollTop = element.scrollHeight;
  }
}

/**
 * Creates a DOM element from HTML string
 * @param {string} html - HTML string to convert
 * @returns {HTMLElement} The created element
 */
export function createElementFromHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

// ===== STORAGE HELPERS =====

/**
 * Gets a value from localStorage with safe parsing
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} The stored value or default
 */
export function getStoredItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn('Failed to parse stored item:', e);
    return defaultValue;
  }
}

/**
 * Saves a value to localStorage with stringification
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
export function setStoredItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to store item:', e);
  }
}

// ===== MISC UTILITIES =====

/**
 * Debounces a function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay = 300) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Generates a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}