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
