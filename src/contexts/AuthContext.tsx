import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { isSupabaseEnabled } from '../config/env';
import type { IUser } from '../types/user.types';

interface IAuthContext {
  session: Session | null;
  user: IUser | null;
  authUser: User | null;
  isGuest: boolean;
  loading: boolean;
}

const AuthContext = createContext<IAuthContext | null>(null);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isGuest = !isSupabaseEnabled() || authUser === null;

  useEffect(() => {
    if (!isSupabaseEnabled() || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchUserProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthUser(newSession?.user ?? null);
      if (newSession?.user) {
        fetchUserProfile(newSession.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string): Promise<void> => {
    if (!supabase) return;
    const { data } = await supabase.from('users').select('*').eq('id', uid).single();
    setUser(data as IUser | null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, authUser, isGuest, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = (): IAuthContext => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
