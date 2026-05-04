import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const AuthContext = createContext(null);

const MISSING_CONFIG_MESSAGE =
  'Supabase configuration is missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local.';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setError(MISSING_CONFIG_MESSAGE);
      setLoading(false);
      return undefined;
    }

    const bootstrapSession = async () => {
      try {
        const {
          data: { session: activeSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        setSession(activeSession || null);
        setUser(activeSession?.user || null);
      } catch (err) {
        console.error('Error checking auth session:', err);
        setError(err.message || 'Unable to check auth session');
      } finally {
        setLoading(false);
      }
    };

    bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setUser(nextSession?.user || null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const requireConfiguredClient = () => {
    if (!supabase) {
      setError(MISSING_CONFIG_MESSAGE);
      return null;
    }
    return supabase;
  };

  const signUp = async (email, password) => {
    try {
      const client = requireConfiguredClient();
      if (!client) return { success: false, error: MISSING_CONFIG_MESSAGE };

      setError(null);
      const { data, error: signUpError } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;
      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Signup failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const signIn = async (email, password) => {
    try {
      const client = requireConfiguredClient();
      if (!client) return { success: false, error: MISSING_CONFIG_MESSAGE };

      setError(null);
      const { data, error: signInError } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      setSession(data.session || null);
      setUser(data.user || data.session?.user || null);
      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const client = requireConfiguredClient();
      if (!client) return { success: false, error: MISSING_CONFIG_MESSAGE };

      setError(null);
      const { data, error: googleError } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (googleError) throw googleError;
      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Google login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    try {
      const client = requireConfiguredClient();
      if (!client) return { success: false, error: MISSING_CONFIG_MESSAGE };

      setError(null);
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) throw signOutError;

      setSession(null);
      setUser(null);
      return { success: true };
    } catch (err) {
      const message = err.message || 'Logout failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const getAccessToken = async () => {
    const client = requireConfiguredClient();
    if (!client) return null;

    const {
      data: { session: activeSession },
    } = await client.auth.getSession();

    return activeSession?.access_token || null;
  };

  const value = {
    user,
    session,
    loading,
    error,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    getAccessToken,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
