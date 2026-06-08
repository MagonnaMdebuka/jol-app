import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  toggleInterested as toggleInterestedApi,
  getUserInterestedListings,
} from '../services/rsvp.service';

interface IInterestedContextValue {
  interestedIds: Set<string>;
  toggleInterested: (listingId: string) => Promise<void>;
  isInterested: (listingId: string) => boolean;
  loading: boolean;
}

const InterestedContext = createContext<IInterestedContextValue | null>(null);

const InterestedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authUser, isGuest } = useAuth();
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load user's interested listings when they sign in
  useEffect(() => {
    if (isGuest || !authUser?.id) {
      setInterestedIds(new Set());
      return;
    }

    const loadInterested = async (): Promise<void> => {
      setLoading(true);
      const ids = await getUserInterestedListings(authUser.id);
      setInterestedIds(new Set(ids));
      setLoading(false);
    };
    loadInterested();
  }, [authUser?.id, isGuest]);

  const toggleInterested = useCallback(
    async (listingId: string): Promise<void> => {
      if (isGuest || !authUser?.id) return;

      // Optimistic update
      setInterestedIds((prev) => {
        const next = new Set(prev);
        if (next.has(listingId)) {
          next.delete(listingId);
        } else {
          next.add(listingId);
        }
        return next;
      });

      // Call API
      const { isInterested, error } = await toggleInterestedApi(authUser.id, listingId);

      // Revert if error
      if (error) {
        setInterestedIds((prev) => {
          const next = new Set(prev);
          if (isInterested) {
            next.delete(listingId);
          } else {
            next.add(listingId);
          }
          return next;
        });
      }
    },
    [authUser?.id, isGuest],
  );

  const isInterested = useCallback(
    (listingId: string) => interestedIds.has(listingId),
    [interestedIds],
  );

  return (
    <InterestedContext.Provider value={{ interestedIds, toggleInterested, isInterested, loading }}>
      {children}
    </InterestedContext.Provider>
  );
};

export default InterestedProvider;

export const useInterested = (): IInterestedContextValue => {
  const ctx = useContext(InterestedContext);
  if (!ctx) throw new Error('useInterested must be used within InterestedProvider');
  return ctx;
};
