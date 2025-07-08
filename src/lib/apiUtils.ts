/**
 * Utility functions for handling API responses with inconsistent formats
 */

export interface APIResponse<T> {
  success?: boolean;
  count?: number;
  data?: T;
  error?: string;
}

/**
 * Extracts data from API responses that might be in different formats:
 * - Direct array: [item1, item2, ...]
 * - Nested object: { data: [item1, item2, ...], success: true, count: 2 }
 * - Error format: { success: false, error: "message", data: [] }
 */
export function extractResponseData<T>(response: any): T[] {
  // If response is null or undefined
  if (!response) {
    return [];
  }

  // If response is already an array
  if (Array.isArray(response)) {
    return response as T[];
  }

  // If response has a data property that's an array
  if (response.data && Array.isArray(response.data)) {
    return response.data as T[];
  }

  // If response.data is an object with a data property (nested)
  if (response.data && response.data.data && Array.isArray(response.data.data)) {
    return response.data.data as T[];
  }

  // If response.data is just the item itself (single item responses)
  if (response.data && !Array.isArray(response.data)) {
    return [response.data] as T[];
  }

  // Return empty array as fallback
  console.warn('Could not extract array data from response:', response);
  return [];
}

/**
 * Checks if an API response indicates success
 */
export function isResponseSuccessful(response: any): boolean {
  // If response has explicit success property
  if (typeof response?.success === 'boolean') {
    return response.success;
  }

  // If response has data, consider it successful
  if (response?.data) {
    return true;
  }

  // If response is an array, consider it successful
  if (Array.isArray(response)) {
    return true;
  }

  return false;
}

/**
 * Extracts error message from API response
 */
export function extractErrorMessage(error: any): string {
  // Check for various error format patterns
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Handles common API response patterns and provides consistent data extraction
 */
export function handleAPIResponse<T>(response: any) {
  const data = extractResponseData<T>(response);
  const success = isResponseSuccessful(response);
  const error = success ? null : extractErrorMessage(response);

  return {
    data,
    success,
    error,
    count: data.length
  };
} 