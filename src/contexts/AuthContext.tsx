import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    localStorage.removeItem('admin_login_timestamp');
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check for 24-hour timeout
        const loginTimestamp = localStorage.getItem('admin_login_timestamp');
        if (loginTimestamp) {
          const hoursSinceLogin = (Date.now() - parseInt(loginTimestamp)) / (1000 * 60 * 60);
          if (hoursSinceLogin >= 24) {
            console.log('Session expired (24h). Logging out.');
            await signOut();
            return;
          }
        }

        // Verify admin role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userError || userData?.role !== 'admin') {
          console.log('Access denied: Not an admin.');
          await signOut();
          return;
        }

        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkSession();

    // Periodic check for session timeout (every minute)
    const interval = setInterval(() => {
      const loginTimestamp = localStorage.getItem('admin_login_timestamp');
      if (loginTimestamp) {
        const hoursSinceLogin = (Date.now() - parseInt(loginTimestamp)) / (1000 * 60 * 60);
        if (hoursSinceLogin >= 24) {
          signOut();
        }
      }
    }, 60000);

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Double check role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userData?.role !== 'admin') {
          await signOut();
          return;
        }
        
        if (event === 'SIGNED_IN') {
          localStorage.setItem('admin_login_timestamp', Date.now().toString());
        }
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
