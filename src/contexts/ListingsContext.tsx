import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { getNearbyListings } from '../services/listing.service';
import { GAUTENG_CENTER } from '../constants/mapConfig';
import type { IListingWithDistance } from '../types/listing.types';
import type { VibeFilterId } from '../constants/categories';
import { useGeolocation } from '../hooks/useGeolocation';

export type SortBy = 'nearest' | 'latest';

interface IListingFilters {
  vibe: VibeFilterId;
  radius: number;
  sortBy: SortBy;
}

interface IListingsContext {
  listings: IListingWithDistance[];
  filteredListings: IListingWithDistance[];
  filters: IListingFilters;
  setFilters: (partial: Partial<IListingFilters>) => void;
  loading: boolean;
  userLat: number | null;
  userLng: number | null;
  getListingById: (id: string) => IListingWithDistance | null;
  addEphemeralListings: (listings: IListingWithDistance[]) => void;
}

const DEFAULT_FILTERS: IListingFilters = { vibe: 'all', radius: 20000, sortBy: 'nearest' };

const ListingsContext = createContext<IListingsContext | null>(null);

const isToday = (dateStr: string): boolean => {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const isThisWeekend = (dateStr: string): boolean => {
  const d = new Date(dateStr);
  const now = new Date();
  const day = now.getDay();
  const sat = new Date(now);
  sat.setDate(now.getDate() + ((6 - day + 7) % 7));
  sat.setHours(0, 0, 0, 0);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  sun.setHours(23, 59, 59, 999);
  return d >= sat && d <= sun;
};

const applyClientFilters = (
  listings: IListingWithDistance[],
  filters: IListingFilters,
): IListingWithDistance[] => {
  const active = listings.filter((l) => l.status === 'active');

  switch (filters.vibe) {
    case 'all':
      return active;
    case 'tonight':
      return active.filter((l) => l.type === 'event' && l.event_date && isToday(l.event_date));
    case 'weekend':
      return active.filter(
        (l) => l.type === 'event' && l.event_date && isThisWeekend(l.event_date),
      );
    case 'food':
      return active.filter((l) => l.type === 'food');
    case 'events':
      return active.filter((l) => l.type === 'event');
    case 'free':
      return active.filter(
        (l) =>
          l.type !== 'food' && (l.entry_fee === null || l.entry_fee.toLowerCase().includes('free')),
      );
    case 'chill':
      return active.filter((l) => l.vibe?.includes('Chill'));
    case 'date':
      return active.filter((l) => l.vibe?.includes('Date night'));
    default:
      return active;
  }
};

const ListingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<IListingWithDistance[]>([]);
  const [ephemeralListings, setEphemeralListings] = useState<IListingWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFiltersState] = useState<IListingFilters>(DEFAULT_FILTERS);
  const { lat, lng } = useGeolocation();

  const setFilters = useCallback((partial: Partial<IListingFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    const fetchListings = async (): Promise<void> => {
      setLoading(true);
      const centerLat = lat ?? GAUTENG_CENTER.lat;
      const centerLng = lng ?? GAUTENG_CENTER.lng;

      // Fetch listings from Supabase (includes seeded OSM venues)
      const listings = await getNearbyListings(centerLat, centerLng, filters.radius);
      setListings(listings);
      setLoading(false);
    };
    fetchListings();
  }, [lat, lng, filters.radius]);

  const filteredListings = useMemo(
    () => applyClientFilters(listings, filters),
    [listings, filters],
  );

  const getListingById = useCallback(
    (id: string): IListingWithDistance | null => {
      // Check main listings first, then ephemeral (OSM/Google search results)
      return (
        listings.find((l) => l.id === id) ?? ephemeralListings.find((l) => l.id === id) ?? null
      );
    },
    [listings, ephemeralListings],
  );

  const addEphemeralListings = useCallback((newListings: IListingWithDistance[]) => {
    setEphemeralListings((prev) => {
      const existingIds = new Set(prev.map((l) => l.id));
      const toAdd = newListings.filter((l) => !existingIds.has(l.id));
      if (toAdd.length === 0) return prev;
      // Keep max 100 ephemeral listings to prevent memory bloat
      const combined = [...toAdd, ...prev];
      return combined.slice(0, 100);
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      listings,
      filteredListings,
      filters,
      setFilters,
      loading,
      userLat: lat,
      userLng: lng,
      getListingById,
      addEphemeralListings,
    }),
    [
      listings,
      filteredListings,
      filters,
      setFilters,
      loading,
      lat,
      lng,
      getListingById,
      addEphemeralListings,
    ],
  );

  return <ListingsContext.Provider value={contextValue}>{children}</ListingsContext.Provider>;
};

export default ListingsProvider;

export const useListings = (): IListingsContext => {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error('useListings must be used within ListingsProvider');
  return ctx;
};
