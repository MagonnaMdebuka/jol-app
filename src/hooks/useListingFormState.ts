/**
 * Custom hook for listing form state management
 * Used by NewListing and EditListing
 */
import { useState, useCallback, useMemo } from 'react';
import type { ListingType, DressCode, PriceRange } from '../types/listing.types';

export interface IListingFormState {
  title: string;
  description: string;
  address: string;
  images: string[];
  // Event fields
  eventDate: string;
  eventEndDate: string;
  entryFee: string;
  dressCode: DressCode;
  artist: string;
  ageRestriction: string;
  selectedTags: string[];
  capacity: string;
  // Food fields
  cuisineType: string;
  openingHours: string;
  priceRange: PriceRange;
  special: string;
}

export interface IListingFormActions {
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setAddress: (value: string) => void;
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  setEventDate: (value: string) => void;
  setEventEndDate: (value: string) => void;
  setEntryFee: (value: string) => void;
  setDressCode: (value: DressCode) => void;
  setArtist: (value: string) => void;
  setAgeRestriction: (value: string) => void;
  setCapacity: (value: string) => void;
  toggleTag: (tag: string) => void;
  setCuisineType: (value: string) => void;
  setOpeningHours: (value: string) => void;
  setPriceRange: (value: PriceRange) => void;
  setSpecial: (value: string) => void;
  resetEventFields: () => void;
  resetFoodFields: () => void;
}

export interface IListingFormHookResult {
  state: IListingFormState;
  actions: IListingFormActions;
  previewData: (type: ListingType, venueName?: string) => Record<string, unknown>;
}

const defaultState: IListingFormState = {
  title: '',
  description: '',
  address: '',
  images: [],
  eventDate: '',
  eventEndDate: '',
  entryFee: '',
  dressCode: 'Smart Casual',
  artist: '',
  ageRestriction: '',
  selectedTags: [],
  capacity: '',
  cuisineType: '',
  openingHours: '',
  priceRange: 'RR',
  special: '',
};

export const useListingFormState = (
  initialState: Partial<IListingFormState> = {},
): IListingFormHookResult => {
  const [title, setTitle] = useState(initialState.title ?? defaultState.title);
  const [description, setDescription] = useState(
    initialState.description ?? defaultState.description,
  );
  const [address, setAddress] = useState(initialState.address ?? defaultState.address);
  const [images, setImages] = useState<string[]>(initialState.images ?? defaultState.images);
  const [eventDate, setEventDate] = useState(initialState.eventDate ?? defaultState.eventDate);
  const [eventEndDate, setEventEndDate] = useState(
    initialState.eventEndDate ?? defaultState.eventEndDate,
  );
  const [entryFee, setEntryFee] = useState(initialState.entryFee ?? defaultState.entryFee);
  const [dressCode, setDressCode] = useState<DressCode>(
    initialState.dressCode ?? defaultState.dressCode,
  );
  const [artist, setArtist] = useState(initialState.artist ?? defaultState.artist);
  const [ageRestriction, setAgeRestriction] = useState(
    initialState.ageRestriction ?? defaultState.ageRestriction,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialState.selectedTags ?? defaultState.selectedTags,
  );
  const [capacity, setCapacity] = useState(initialState.capacity ?? defaultState.capacity);
  const [cuisineType, setCuisineType] = useState(
    initialState.cuisineType ?? defaultState.cuisineType,
  );
  const [openingHours, setOpeningHours] = useState(
    initialState.openingHours ?? defaultState.openingHours,
  );
  const [priceRange, setPriceRange] = useState<PriceRange>(
    initialState.priceRange ?? defaultState.priceRange,
  );
  const [special, setSpecial] = useState(initialState.special ?? defaultState.special);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const resetEventFields = useCallback(() => {
    setEventDate('');
    setEventEndDate('');
    setEntryFee('');
    setDressCode('Smart Casual');
    setArtist('');
    setAgeRestriction('');
    setSelectedTags([]);
    setCapacity('');
  }, []);

  const resetFoodFields = useCallback(() => {
    setCuisineType('');
    setOpeningHours('');
    setPriceRange('RR');
    setSpecial('');
  }, []);

  const state: IListingFormState = useMemo(
    () => ({
      title,
      description,
      address,
      images,
      eventDate,
      eventEndDate,
      entryFee,
      dressCode,
      artist,
      ageRestriction,
      selectedTags,
      capacity,
      cuisineType,
      openingHours,
      priceRange,
      special,
    }),
    [
      title,
      description,
      address,
      images,
      eventDate,
      eventEndDate,
      entryFee,
      dressCode,
      artist,
      ageRestriction,
      selectedTags,
      capacity,
      cuisineType,
      openingHours,
      priceRange,
      special,
    ],
  );

  const actions: IListingFormActions = useMemo(
    () => ({
      setTitle,
      setDescription,
      setAddress,
      setImages,
      setEventDate,
      setEventEndDate,
      setEntryFee,
      setDressCode,
      setArtist,
      setAgeRestriction,
      setCapacity,
      toggleTag,
      setCuisineType,
      setOpeningHours,
      setPriceRange,
      setSpecial,
      resetEventFields,
      resetFoodFields,
    }),
    [toggleTag, resetEventFields, resetFoodFields],
  );

  const previewData = useCallback(
    (type: ListingType, venueName?: string) => ({
      type,
      title,
      description,
      address,
      images,
      eventDate,
      entryFee,
      dressCode,
      artist,
      ageRestriction,
      tags: selectedTags,
      capacity,
      cuisineType,
      openingHours,
      priceRange,
      special,
      venueName,
    }),
    [
      title,
      description,
      address,
      images,
      eventDate,
      entryFee,
      dressCode,
      artist,
      ageRestriction,
      selectedTags,
      capacity,
      cuisineType,
      openingHours,
      priceRange,
      special,
    ],
  );

  return { state, actions, previewData };
};
