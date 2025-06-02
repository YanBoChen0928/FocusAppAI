/**
 * Date utility functions for handling week calculations
 */

/**
 * Get the ISO week number for a given date
 * @param {Date} date - The date to get the week number for
 * @returns {number} - The ISO week number (1-53)
 */
export function getWeek(date) {
  const tempDate = new Date(date);
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  return 1 + Math.round(((tempDate - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * Get the start date of the week for a given date (Sunday)
 * @param {Date} date - The date to get the start of week for
 * @returns {Date} - The date of the first day of the week (Sunday)
 */
export function getStartOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day); // Go back to Sunday
  result.setHours(0, 0, 0, 0); // Reset time part
  return result;
}

/**
 * Format a date as MM/DD
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string (MM/DD)
 */
export function formatShortDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * Check if a date is today
 * @param {Date|string} dateInput - The date to check
 * @returns {boolean} - True if the date is today
 */
export function isToday(dateInput) {
  if (!dateInput) return false;
  
  // Parse date string if needed
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return false;
  
  const today = new Date();
  return date.getDate() === today.getDate() && 
         date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
} 