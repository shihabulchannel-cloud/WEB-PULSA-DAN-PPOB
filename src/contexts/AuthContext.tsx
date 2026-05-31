/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(() => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }, 0);
    });

    // Get existing session, handle invalid refresh token gracefully
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Invalid/expired refresh token — clear bad session silently
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch(() => {
      // Network or unexpected error — clear state
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // isAdmin: user must be authenticated AND have role='admin' in metadata
  const isAdmin = !!user && (
    user.user_metadata?.role === 'admin' ||
    user.email === 'admin@shielacomcell.com'
  );

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
