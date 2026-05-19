import { supabase } from '../config/supabase';
import { isSupabaseEnabled } from '../config/env';

export const signUpWithEmail = async (
  name: string,
  email: string,
  password: string,
): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { error: null }; // demo mode
  }
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: 'venue_owner' } },
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
