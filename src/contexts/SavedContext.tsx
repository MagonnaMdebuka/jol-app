import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'jol-saved';

interface ISavedContextValue {
  savedIds: Set<string>;
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
}

const SavedContext = createContext<ISavedContextValue | null>(null);

const SavedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set<string>(JSON.parse(stored) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(savedIds)));
  }, [savedIds]);

  const toggleSave = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const contextValue = useMemo(
    () => ({ savedIds, toggleSave, isSaved }),
    [savedIds, toggleSave, isSaved],
  );

  return <SavedContext.Provider value={contextValue}>{children}</SavedContext.Provider>;
};

export default SavedProvider;

export const useSaved = (): ISavedContextValue => {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used within SavedProvider');
  return ctx;
};
