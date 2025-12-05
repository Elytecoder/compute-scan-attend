/**
 * API Configuration for Computing Society Attendance System
 * 
 * This file contains the base configuration for making HTTP requests
 * to the backend REST API using the native fetch() API.
 * 
 * Backend API URL: https://lojxwobotbkwwiccxnwk.supabase.co/rest/v1
 */

// Base URL for the REST API
export const API_BASE_URL = 'https://lojxwobotbkwwiccxnwk.supabase.co/rest/v1';

// API Key for authentication
export const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvanh3b2JvdGJrd3dpY2N4bndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTU3ODcsImV4cCI6MjA3NDk5MTc4N30.I44Mmo3bWgVugskLf4XTLkZ6tPQYOApyTxQyCVBOiN4';

/**
 * Get the authorization token from local storage
 * This retrieves the JWT access token for authenticated requests
 */
export const getAuthToken = (): string | null => {
  const storageKey = 'sb-lojxwobotbkwwiccxnwk-auth-token';
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.access_token || null;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Generate headers for API requests
 * Includes API key and Authorization token for authenticated requests
 */
export const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
    'Prefer': 'return=representation',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handle API response and throw error if not ok
 */
export const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP Error: ${response.status}`);
  }
  return response.json();
};

/**
 * Handle API errors consistently
 */
export const handleError = (error: unknown): never => {
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('An unexpected error occurred');
};
