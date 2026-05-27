import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { isSupabaseEnabled } from '../config/env';
import { signOut as authSignOut } from '../services/auth.service';
import type { IUser } from '../types/user.types';

interface IAuthContext {
  session:   Session | null;
  user:      IUser | null;     // profile row from public.profiles
  authUser:  User | null;      // raw Supabase auth user
  isGuest:   boolean;          // true when not authenticated
  isOwner:   boolean;          // true when role === 'owner'
  loading:   boolean;
  signOut:   () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | null>(null);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session,  setSession]  = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user,     setUser]     = useState<IUser | null>(null);
  const [loading,  setLoading]  = useState(true);

  const isGuest = !isSupabaseEnabled() || authUser === null;
  // Check DB profile first; fall back to sign-up metadata for immediate post-login UX
  const isOwner =
    user?.role === 'owner' ||
    authUser?.user_metadata?.role === 'owner';

  const signOut = useCallback(async () => {
    await authSignOut();
  }, []);

  // Defined before useEffect so it can be referenced in the effect closure
  const fetchUserProfile = useCallback(async (uid: string): Promise<void> => {
    if (!supabase) return;
    // Queries public.profiles (created by handle_new_user trigger on sign-up)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    setUser(data as IUser | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseEnabled() || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthUser(data.session?.user ?? null);
      if (data.session?.user) {
        void fetchUserProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthUser(newSession?.user ?? null);
      if (newSession?.user) {
        void fetchUserProfile(newSession.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchUserProfile]);

  return (
    <AuthContext.Provider
      value={{ session, user, authUser, isGuest, isOwner, loading, signOut }}
    >
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
