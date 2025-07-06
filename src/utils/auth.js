// Authentication utilities for consistent token management

/**
 * Get authentication token from either localStorage or sessionStorage
 * @returns {string|null} The authentication token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * Set authentication token in appropriate storage
 * @param {string} token - The authentication token
 * @param {boolean} remember - Whether to store in localStorage (true) or sessionStorage (false)
 */
export const setAuthToken = (token, remember = false) => {
  if (remember) {
    localStorage.setItem('token', token);
    sessionStorage.removeItem('token'); // Clear from session storage
  } else {
    sessionStorage.setItem('token', token);
    localStorage.removeItem('token'); // Clear from local storage
  }
};

/**
 * Remove authentication token from all storage locations
 */
export const removeAuthToken = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Get authorization headers for fetch requests
 * @returns {Record<string, string>} Headers object with Authorization header if token exists
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}; 