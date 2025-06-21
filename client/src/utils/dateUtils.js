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
 * Get date range for last N days
 * @param {number} days - Number of days to look back
 * @returns {Object} Object containing start and end dates
 */
export function getLastNDaysRange(days) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
}

/**
 * Get custom date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Object containing normalized start and end dates
 */
export function getCustomDateRange(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Format date to ISO string with timezone
 * @param {Date} date - Date to format
 * @returns {string} ISO string with timezone
 */
export function formatISOWithTimezone(date) {
  if (!date) return null;
  const localDate = new Date(date);
  return localDate.toISOString();
}

/**
 * Parse ISO date string to local date
 * @param {string} isoString - ISO date string
 * @returns {Date} Local date object
 */
export function parseISOToLocal(isoString) {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', isoString);
      return null;
    }
    return date;
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
 * Get date range for analysis based on specified time range
 * @param {string} timeRange - 'last7days', 'last30days', or 'custom'
 * @param {Object} customRange - { startDate, endDate } for custom range
 * @returns {Object} Date range with UTC and display dates
 */
export const getDateRangeForAnalysis = (timeRange, customRange = null) => {
  const now = new Date();  // Uses local timezone
  
  let start, end;
  
  switch(timeRange) {
    case 'last7days': {
      end = endOfDay(now);
      start = startOfDay(subDays(now, 6)); // 6 because including today
      break;
    }
    case 'last30days': {
      end = endOfDay(now);
      start = startOfDay(subDays(now, 29)); // 29 because including today
      break;
    }
    case 'custom': {
      if (!customRange?.startDate || !customRange?.endDate) {
        throw new Error('Custom date range requires both start and end dates');
      }
      start = startOfDay(new Date(customRange.startDate));
      end = endOfDay(new Date(customRange.endDate));
      break;
    }
    default: {
      // Default to last 7 days
      end = endOfDay(now);
      start = startOfDay(subDays(now, 6));
    }
  }

  // For API requests (UTC)
  const startUTC = start.toISOString();
  const endUTC = end.toISOString();

  // For display (local time)
  const displayStart = start;
  const displayEnd = end;

  return {
    startDate: startUTC,
    endDate: endUTC,
    displayStart,
    displayEnd
  };
};

/**
 * Format date for display in UI
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDisplayDate = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });
};

/**
 * Validate date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {boolean} Whether the date range is valid
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return start <= end && 
         start.toString() !== 'Invalid Date' && 
         end.toString() !== 'Invalid Date';
};

/**
 * Get formatted date range string
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} Formatted date range
 */
export const getDateRangeString = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
};

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