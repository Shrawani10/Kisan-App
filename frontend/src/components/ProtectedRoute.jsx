import { useAuth } from '../contexts/AuthContext';
import Login from './Login';
import Signup from './Signup';
import { useState } from 'react';

export default function ProtectedRoute({ children }) {
  const { user, loading, isConfigured } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, #c8e6c9 0%, #e8f5e9 40%, #f5fbf5 70%, #ffffff 100%)',
      }}>
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Supabase Setup Required</h2>
          <p className="text-gray-600 mb-4">
            Authentication is enabled, but the environment variables are missing.
          </p>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 overflow-x-auto">
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
          </pre>
          <p className="text-sm text-gray-500 mt-3">
            Add these in <code>frontend/.env.local</code> and restart the frontend dev server.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #c8e6c9 0%, #e8f5e9 40%, #f5fbf5 70%, #ffffff 100%)',
      }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🌾</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h2>
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return showSignup ? (
      <Signup onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <Login onSwitchToSignup={() => setShowSignup(true)} />
    );
  }

  return children;
}
