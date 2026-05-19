import { useMemo } from 'react';
import type { IListingWithDistance } from '../types/listing.types';
import { GAUTENG_CENTER } from '../constants/mapConfig';

const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const useNearbyListings = (
  listings: IListingWithDistance[],
  userLat: number | null,
  userLng: number | null,
  radiusMetres: number,
): IListingWithDistance[] => {
  return useMemo(() => {
    const centerLat = userLat ?? GAUTENG_CENTER.lat;
    const centerLng = userLng ?? GAUTENG_CENTER.lng;

    return listings
      .map((l) => ({
        ...l,
        distance_metres: haversine(centerLat, centerLng, l.location.lat, l.location.lng),
      }))
      .filter((l) => l.distance_metres <= radiusMetres)
      .sort((a, b) => a.distance_metres - b.distance_metres);
  }, [listings, userLat, userLng, radiusMetres]);
};
