export type UserRole = 'user' | 'owner' | 'admin';

export interface IUser {
  id: string;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
