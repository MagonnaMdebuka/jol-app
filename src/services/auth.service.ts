import { supabase } from '../config/supabase';
import { isSupabaseEnabled } from '../config/env';

export const signUpWithEmail = async (
  name: string,
  email: string,
  password: string,
  role: 'user' | 'owner' = 'user',
): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { error: null }; // demo mode
  }
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name, role } },
  });
  return { error: error?.message ?? null };
};

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { error: null }; // demo mode
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
};

export const signInWithPhone = async (phone: string): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { error: null }; // demo mode
  }
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return { error: error?.message ?? null };
};

export const verifyOTP = async (
  phone: string,
  token: string,
): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { error: null }; // demo mode
  }
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  return { error: error?.message ?? null };
};

export const signOut = async (): Promise<void> => {
  if (!isSupabaseEnabled() || !supabase) return;
  await supabase.auth.signOut();
};

export const sendPasswordReset = async (email: string): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { error: null }; // demo mode
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error: error?.message ?? null };
};

export const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { error: null }; // demo mode
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
};

/** Get user's role from profile or auth metadata */
export const getUserRole = async (): Promise<'user' | 'owner' | 'admin' | null> => {
  if (!isSupabaseEnabled() || !supabase) {
    return null; // demo mode
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // First check the profiles table (source of truth)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role) {
    return profile.role as 'user' | 'owner' | 'admin';
  }

  // Fallback to auth metadata (set during sign-up)
  return (user.user_metadata?.role as 'user' | 'owner' | 'admin') ?? 'user';
};

/** Sign in and verify the user has the required role */
export const signInWithEmailAndRole = async (
  email: string,
  password: string,
  requiredRole: 'owner' | 'admin',
): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { error: null }; // demo mode
  }

  // First sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: signInError.message };
  }

  // Check role
  const role = await getUserRole();
  if (role !== requiredRole && role !== 'admin') {
    // Sign out - user doesn't have permission
    await supabase.auth.signOut();
    return {
      error: `This account is not registered as ${requiredRole === 'owner' ? 'a venue owner' : 'an admin'}. Please use the correct login page or register as ${requiredRole === 'owner' ? 'an owner' : 'an admin'}.`,
    };
  }

  return { error: null };
};
