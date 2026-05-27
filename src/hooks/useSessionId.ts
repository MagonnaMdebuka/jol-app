import { useState } from 'react';

const SESSION_KEY = 'jol-session';

const generateId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for older browsers
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
};

/**
 * Returns a stable anonymous session ID persisted in localStorage.
 * Used to track listing views for unauthenticated users.
 * When a user later signs up, their session_id views can be linked to their profile.
 */
export const useSessionId = (): string => {
  const [sessionId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) return stored;
      const id = generateId();
      localStorage.setItem(SESSION_KEY, id);
      return id;
    } catch {
      return generateId();
    }
  });

  return sessionId;
};
