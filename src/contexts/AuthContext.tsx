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
  isReseller: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(() => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        supabase.auth.signOut().catch(() => {});
        setSession(null); setUser(null);
      } else {
        setSession(session); setUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch(() => {
      setSession(null); setUser(null); setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const isAdmin = !!user && (
    user.user_metadata?.role === 'admin' ||
    user.email === 'admin@shielacomcell.com'
  );

  const isReseller = !!user && user.user_metadata?.role === 'reseller';

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, isAdmin, isReseller }}>
      {children}
    </AuthContext.Provider>
  );
}
