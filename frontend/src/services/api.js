/**
 * Kisan API Service - Vercel Backend Integration (Azure Foundry Agent)
 * 
 * This service communicates with the Vercel serverless backend.
 * All requests include Supabase JWT authentication via Bearer token.
 * 
 * The backend acts as a BFF (Backend-For-Frontend) proxy:
 * - Verifies JWT for security
 * - Calls Azure AI Foundry Agent (keeps credentials private)
 * - Returns formatted response with message + products
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Build fully qualified API URL
 * @param {string} path - API path (e.g., '/chat')
 * @returns {string} Full API URL
 */
function buildApiUrl(path) {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const nextPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${nextPath}`;
}

/**
 * Build HTTP headers with Supabase JWT
 * @param {string} accessToken - Supabase JWT from session
 * @returns {Object} HTTP headers
 */
function buildHeaders(accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    // Include Supabase JWT for server-side authentication
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

/**
 * Send chat message to Vercel backend
 * 
 * The backend will:
 * 1. Verify the Supabase JWT
 * 2. Call the Azure AI Foundry Agent
 * 3. Parse Agent's JSON response
 * 4. Return formatted response with products
 * 
 * @param {Object} params
 * @param {string} params.message - User message (farming question)
 * @param {AbortSignal} params.signal - AbortController signal (for cancellation)
 * @param {string} params.accessToken - Supabase JWT token
 * @returns {Promise<{message: string, products: Array}>}
 */
export async function sendChat({ message, signal, accessToken }) {
  try {
    // Validate input
    if (!accessToken) {
      throw new Error('Authentication required. Please log in.');
    }

    if (!message || !message.trim()) {
      throw new Error('Message cannot be empty');
    }

    // Send request to Vercel backend
    const response = await fetch(buildApiUrl('/chat'), {
      method: 'POST',
      headers: buildHeaders(accessToken),
      body: JSON.stringify({ message: message.trim() }),
      signal,
    });

    // Handle HTTP errors
    if (!response.ok) {
      let errorDetail = `API error ${response.status}`;
      try {
        const errBody = await response.json();
        errorDetail = errBody.error || errorDetail;
      } catch (e) {
        // Ignore JSON parse errors
      }

      // Map HTTP status to user-friendly messages
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (response.status === 504) {
        throw new Error('Request took too long. Please try again.');
      }

      throw new Error(errorDetail);
    }

    // Parse successful response
    const data = await response.json();

    // Validate response structure
    if (!data.message) {
      throw new Error('Invalid response format from server');
    }

    return {
      message: data.message,
      products: data.products || [],
    };
  } catch (err) {
    // Re-throw AbortError as-is (for cancellation handling)
    if (err.name === 'AbortError') {
      throw err;
    }

    // Wrap other errors with context
    throw new Error(err.message || 'Failed to send message');
  }
}

/**
 * Optional: Clear chat history
 * Note: Current stateless architecture doesn't require this,
 * but keeping for future compatibility
 * 
 * @param {Object} params
 * @param {string} params.accessToken - Supabase JWT token
 * @returns {Promise<Object>}
 */
export async function clearChatHistory({ accessToken } = {}) {
  if (!accessToken) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(buildApiUrl('/clear'), {
      method: 'POST',
      headers: buildHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    return response.json().catch(() => ({}));
  } catch (err) {
    console.error('Failed to clear chat history:', err);
    throw new Error(`Network error: ${err.message}`);
  }
}
