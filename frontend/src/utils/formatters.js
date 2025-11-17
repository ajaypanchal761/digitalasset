/**
 * Format currency amount with Indian Rupee symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'INR')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined) return '₹0';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type: 'short', 'medium', 'long', 'full'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'medium') => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '-';
  
  const formatOptions = {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  };
  
  return new Intl.DateTimeFormat('en-IN', formatOptions[format] || formatOptions.medium).format(dateObj);
};

/**
 * Format date and time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '-';
  
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '-';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

/**
 * Get status color configuration
 * @param {string} status - Status value
 * @returns {object} Color configuration with bg and text colors
 */
export const getStatusColor = (status) => {
  const statusColors = {
    // KYC Status
    pending: { bg: '#fef3c7', text: '#92400e' },
    approved: { bg: '#d1fae5', text: '#065f46' },
    rejected: { bg: '#fee2e2', text: '#991b1b' },
    
    // Account Status
    active: { bg: '#d1fae5', text: '#065f46' },
    locked: { bg: '#fee2e2', text: '#991b1b' },
    suspended: { bg: '#fed7aa', text: '#9a3412' },
    
    // Withdrawal Status
    processing: { bg: '#dbeafe', text: '#1e40af' },
    completed: { bg: '#d1fae5', text: '#065f46' },
    
    // Investment Status
    'lock-in': { bg: '#dbeafe', text: '#1e40af' },
    matured: { bg: '#d1fae5', text: '#065f46' },
    withdrawn: { bg: '#f3f4f6', text: '#374151' },
    
    // Property Status
    inactive: { bg: '#f3f4f6', text: '#374151' },
    closed: { bg: '#fee2e2', text: '#991b1b' },
  };
  
  return statusColors[status?.toLowerCase()] || statusColors.pending;
};

/**
 * Calculate pagination info
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @param {number} totalItems - Total number of items
 * @returns {object} Pagination information
 */
export const getPaginationInfo = (currentPage, pageSize, totalItems) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);
  
  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Mask sensitive information (e.g., account numbers)
 * @param {string} value - Value to mask
 * @param {number} visibleChars - Number of characters to show at start and end
 * @returns {string} Masked string
 */
export const maskSensitive = (value, visibleChars = 4) => {
  if (!value || value.length <= visibleChars * 2) return value;
  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  const middle = '*'.repeat(value.length - visibleChars * 2);
  return `${start}${middle}${end}`;
};

