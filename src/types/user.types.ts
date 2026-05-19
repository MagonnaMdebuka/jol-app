export type UserRole = 'user' | 'venue_owner';

export interface IUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
}
