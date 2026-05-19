import { supabase } from '../config/supabase';
import { isSupabaseEnabled } from '../config/env';

export const uploadImage = async (
  file: File,
  bucket: 'venue-photos' | 'listing-images',
  path: string,
): Promise<string> => {
  if (!isSupabaseEnabled() || !supabase) {
    return URL.createObjectURL(file);
  }
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const generatePath = (ownerId: string, filename: string): string => {
  const ext = filename.split('.').pop() ?? 'jpg';
  return `${ownerId}/${Date.now()}.${ext}`;
};
