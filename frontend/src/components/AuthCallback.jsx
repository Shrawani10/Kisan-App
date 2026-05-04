import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { supabase, isConfigured } = useAuth();

  useEffect(() => {
    let redirectTimeout;

    const redirectToHome = (delayMs = 0) => {
      redirectTimeout = window.setTimeout(() => {
        window.location.replace('/');
      }, delayMs);
    };

    const handleCallback = async () => {
      if (!isConfigured || !supabase) {
        setError('Supabase is not configured. Add frontend/.env.local values and retry.');
        setLoading(false);
        return;
      }

      try {
        const callbackUrl = new URL(window.location.href);
        const callbackError =
          callbackUrl.searchParams.get('error_description') ||
          callbackUrl.searchParams.get('error');

        if (callbackError) {
          throw new Error(decodeURIComponent(callbackError));
        }

        const authCode = callbackUrl.searchParams.get('code');
        if (authCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exchangeError) throw exchangeError;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) {
          throw new Error('No active session was created. Please try signing in again.');
        }

        redirectToHome(300);
      } catch (err) {
        setError(err.message || 'An error occurred during authentication');
        redirectToHome(2200);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();

    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [isConfigured, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #c8e6c9 0%, #e8f5e9 40%, #f5fbf5 70%, #ffffff 100%)',
    }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
        {loading ? (
          <>
            <div className="text-5xl mb-4">🌾</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Completing sign in...
            </h2>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </>
        ) : error ? (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Sign in successful!
            </h2>
            <p className="text-gray-600">Redirecting to chat...</p>
          </>
        )}
      </div>
    </div>
  );
}
