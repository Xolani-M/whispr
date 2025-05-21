/**
 * Utility functions
 */

/**
 * Formats timestamp into readable time (e.g., "6:55 AM")
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted time string
 */
export function formatTime(timestamp) {
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
export function formatLastSeen(timestamp) {
  if (!timestamp) return 'long ago';
  const now = new Date();
  const lastSeen = new Date(parseInt(timestamp));
  const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes/60)} hours ago`;
  return `${Math.floor(diffMinutes/1440)} days ago`;
}