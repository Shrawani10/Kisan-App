import { useState, useRef, useCallback } from 'react';
import { sendChat, clearChatHistory } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * useChat Hook - Chat management with Vercel backend
 * 
 * Handles:
 * - Message state management
 * - Streaming state
 * - Authentication token retrieval
 * - API calls with proper error handling
 * - Message cancellation
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const { getAccessToken } = useAuth();

  /**
   * Send a user message and get AI response with products
   */
  const sendMessage = useCallback(
    async (text) => {
      // Validate input
      if (!text.trim() || isStreaming) return;
      setError(null);

      // Add user message to conversation
      const userMsg = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text.trim(),
        displayText: text.trim(),
      };

      // Create placeholder for assistant response
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        products: [],
      };

      // Update UI with new messages
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      // Setup abort controller for cancellation
      abortRef.current = new AbortController();

      try {
        // Get current session token from Supabase
        const accessToken = await getAccessToken();
        
        if (!accessToken) {
          throw new Error('Not authenticated. Please log in.');
        }

        // Send request to Vercel backend with authentication
        const response = await sendChat({
          message: text.trim(),
          signal: abortRef.current.signal,
          accessToken,
        });

        // Extract response and products
        const responseText = response.message || '';
        const products = response.products || [];

        // Update last message with response content
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = {
            ...last,
            content: responseText,
            products,
          };
          return copy;
        });
      } catch (err) {
        // Ignore user cancellations
        if (err.name === 'AbortError') {
          return;
        }

        // Set error and clean up incomplete message
        setError(err.message || 'Failed to get response. Please try again.');
        setMessages((prev) => {
          // Remove incomplete assistant message if response was empty
          const last = prev[prev.length - 1];
          return last?.content === '' ? prev.slice(0, -1) : prev;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [getAccessToken, isStreaming]
  );

  /**
   * Clear all messages and notify backend
   */
  const clearChat = useCallback(() => {
    // Cancel any pending requests
    abortRef.current?.abort();

    // Reset local state
    setMessages([]);
    setError(null);
    setIsStreaming(false);

    // Notify backend (fire-and-forget)
    void (async () => {
      try {
        const accessToken = await getAccessToken();
        if (accessToken) {
          await clearChatHistory({ accessToken });
        }
      } catch (err) {
        console.error('Failed to clear backend chat history:', err);
      }
    })();
  }, [getAccessToken]);

  /**
   * Stop current streaming response
   */
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    stopStreaming,
  };
}
