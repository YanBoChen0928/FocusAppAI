/**
 * Date utility functions for handling timezone and date calculations
 */

import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  format, 
  parseISO,
  isValid,
  addDays,
  formatISO
} from 'date-fns';

/**
 * Convert local date to UTC
 * @param {Date} date - Local date to convert
 * @returns {Date} - UTC date
 */
export function toUTC(date) {
  if (!date) return null;
  const localDate = new Date(date);
  return new Date(
    localDate.getTime() - (localDate.getTimezoneOffset() * 60000)
  );
}

/**
 * Convert UTC date to local
 * @param {Date} date - UTC date to convert
 * @returns {Date} - Local date
 */
export function fromUTC(date) {
  if (!date) return null;
  const utcDate = new Date(date);
  return new Date(
    utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000)
  );
}

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
  return format(date, 'MM/dd');
}

/**
 * Check if a date is today
 * @param {Date|string} dateInput - The date to check
 * @returns {boolean} - True if the date is today
 */
export function isToday(dateInput) {
  if (!dateInput) return false;
  
  // Parse date string if needed
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return false;
  
  const today = new Date();
  return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
}

/**
 * Get the date range for last N days
 * @param {number} days - Number of days to look back
 * @returns {{start: Date, end: Date}} - Start and end dates
 */
export function getLastNDaysRange(days) {
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(new Date(), days - 1));
  return { 
    start: toUTC(start), 
    end: toUTC(end) 
  };
}

/**
 * Get the date range for a custom period
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {{start: Date, end: Date}} - Start and end dates with proper time set
 */
export function getCustomDateRange(startDate, endDate) {
  if (!startDate || !endDate) return { start: null, end: null };
  try {
    return {
      start: toUTC(startOfDay(startDate)),
      end: toUTC(endOfDay(endDate))
    };
  } catch (error) {
    console.error('Error getting custom date range:', error);
    return { start: null, end: null };
  }
}

/**
 * Format date to standard display format (MM/DD/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDisplayDate(date) {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISOToLocal(date) : date;
    return isValid(dateObj) ? format(dateObj, 'MM/dd/yyyy') : '';
  } catch (error) {
    console.error('Error formatting display date:', error);
    return '';
  }
}

/**
 * Format date to ISO string with timezone
 * @param {Date} date - Date to format
 * @returns {string} - ISO string with timezone
 */
export function formatISOWithTimezone(date) {
  if (!date) return '';
  const utcDate = toUTC(new Date(date));
  return formatISO(utcDate);
}

/**
 * Parse ISO date string to local date object
 * @param {string} dateString - ISO date string
 * @returns {Date} - Local date object
 */
export function parseISOToLocal(dateString) {
  if (!dateString) return null;
  try {
    const utcDate = parseISO(dateString);
    return fromUTC(utcDate);
  } catch (error) {
    console.error('Error parsing ISO date:', error);
    return null;
  }
}

/**
 * Get date range options for reports
 * @returns {Object} - Object containing standard date range options
 */
export function getDateRangeOptions() {
  return {
    last7Days: getLastNDaysRange(7),
    last30Days: getLastNDaysRange(30),
    custom: {
      start: null,
      end: null
    }
  };
}

/**
 * Validate date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {boolean} - True if range is valid
 */
export function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) return false;
  try {
    const start = toUTC(new Date(startDate));
    const end = toUTC(new Date(endDate));
    return isValid(start) && isValid(end) && start <= end;
  } catch (error) {
    console.error('Error validating date range:', error);
    return false;
  }
}

/**
 * Format timestamp to Apple style with timezone
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted timestamp string
 */
export function formatTimestampAppleStyle(timestamp) {
  if (!timestamp) return 'N/A';
  try {
    const date = parseISOToLocal(timestamp);
    if (!date) return 'Invalid Date';
    
    // Use Intl.DateTimeFormat to get better timezone display
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'shortOffset'
    });
    
    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Error';
  }
} 