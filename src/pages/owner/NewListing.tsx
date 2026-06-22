import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createListing } from '../../services/listing.service';
import { getOwnerVenues } from '../../services/venue.service';
import { isSupabaseEnabled } from '../../config/env';
import { useToast } from '../../components/ui/Toast';
import MonoLabel from '../../components/ui/MonoLabel';
import Button from '../../components/ui/Button';
import ImageUploader from '../../components/listings/ImageUploader';
import ListingPreviewModal from '../../components/listings/ListingPreviewModal';
import ListingFormHeader from '../../components/listings/ListingFormHeader';
import ListingTypeToggle from '../../components/listings/ListingTypeToggle';
import ListingBasicFields from '../../components/listings/ListingBasicFields';
import VenueSelector from '../../components/listings/VenueSelector';
import EventFormSection from '../../components/listings/EventFormSection';
import FoodFormSection from '../../components/listings/FoodFormSection';
import { validateRequired, validateFutureDate, validateDateRange } from '../../utils/validation';
import type { IVenue } from '../../types/venue.types';
import type { ListingType, DressCode, PriceRange } from '../../types/listing.types';

const NewListing: React.FC = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const ownerId = authUser?.id ?? '';

  // Core fields
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [venueId, setVenueId] = useState('');
  const [type, setType] = useState<ListingType>('event');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Event fields
  const [eventDate, setEventDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [dressCode, setDressCode] = useState<DressCode>('Smart Casual');
  const [artist, setArtist] = useState('');
  const [ageRestriction, setAgeRestriction] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [capacity, setCapacity] = useState('');

  // Food fields
  const [cuisineType, setCuisineType] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange>('RR');
  const [special, setSpecial] = useState('');

  const selectedVenue = useMemo(() => venues.find((v) => v.id === venueId), [venues, venueId]);

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // Validation errors
  const errors = useMemo(() => {
    const errs: Record<string, string | undefined> = {};
    const titleResult = validateRequired(title, 'Title');
    errs.title = titleResult.valid ? undefined : titleResult.error;
    const addressResult = validateRequired(address, 'Address');
    errs.address = addressResult.valid ? undefined : addressResult.error;

    if (type === 'event') {
      const dateResult = validateFutureDate(eventDate, false);
      errs.eventDate = dateResult.valid ? undefined : dateResult.error;
      const rangeResult = validateDateRange(eventDate, eventEndDate);
      errs.eventEndDate = rangeResult.valid ? undefined : rangeResult.error;
    }
    return errs;
  }, [title, address, type, eventDate, eventEndDate]);

  const isValid = useMemo(() => !errors.title && !errors.address, [errors.title, errors.address]);

  const previewData = useMemo(
    () => ({
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
      venueName: selectedVenue?.name,
    }),
    [
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
      selectedTags,
      capacity,
      cuisineType,
      openingHours,
      priceRange,
      special,
      selectedVenue?.name,
    ],
  );

  useEffect(() => {
    getOwnerVenues(ownerId).then((v) => {
      setVenues(v);
      if (v[0]) setVenueId(v[0].id);
    });
  }, [ownerId]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleTypeChange = useCallback((newType: ListingType) => {
    setType(newType);
    if (newType === 'food') {
      setEventDate('');
      setEventEndDate('');
      setEntryFee('');
      setDressCode('Smart Casual');
      setArtist('');
      setAgeRestriction('');
      setSelectedTags([]);
      setCapacity('');
    } else {
      setCuisineType('');
      setOpeningHours('');
      setPriceRange('RR');
      setSpecial('');
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    // Mark all required fields as touched
    setTouched({ title: true, address: true, eventDate: true, eventEndDate: true });

    if (!isValid) {
      toast('Please fix the errors before publishing', 'error');
      return;
    }

    setLoading(true);
    const venue = venues.find((v) => v.id === venueId);
    const location = venue?.location ?? { lat: -26.0, lng: 28.0 };

    const { id, error } = await createListing({
      venue_id: venueId || 'venue-1',
      owner_id: ownerId,
      type,
      title,
      description: description || null,
      address,
      location,
      images,
      status: 'active',
      event_date: type === 'event' ? eventDate || null : null,
      event_end_date: type === 'event' ? eventEndDate || null : null,
      entry_fee: type === 'event' ? entryFee || null : null,
      dress_code: type === 'event' ? dressCode : null,
      artist: type === 'event' ? artist || null : null,
      age_restriction: type === 'event' ? ageRestriction || null : null,
      tags: type === 'event' ? selectedTags : null,
      capacity: type === 'event' ? parseInt(capacity) || null : null,
      cuisine_type: type === 'food' ? cuisineType || null : null,
      opening_hours: type === 'food' ? openingHours || null : null,
      price_range: type === 'food' ? priceRange : null,
      special: type === 'food' ? special || null : null,
    });

    if (error) toast(error, 'error');
    else {
      toast(
        isSupabaseEnabled() ? 'Listing published!' : `Demo mode: listing created (id: ${id})`,
        'success',
      );
      navigate('/owner/dashboard');
    }
    setLoading(false);
  }, [
    isValid,
    title,
    description,
    address,
    type,
    venueId,
    ownerId,
    images,
    venues,
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
    toast,
    navigate,
  ]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <ListingFormHeader
        label="NEW LISTING"
        actionLabel="Publish"
        onClose={() => navigate(-1)}
        onAction={handleSubmit}
      />

      <h1
        className="text-nz-text leading-[0.92] tracking-[-0.04em]"
        style={{
          fontFamily: '"Bricolage Grotesque", system-ui',
          fontWeight: 900,
          fontSize: '32px',
        }}
      >
        What's the occasion?
      </h1>

      <ListingTypeToggle type={type} onChange={handleTypeChange} />

      <div>
        <MonoLabel className="mb-2">PHOTOS</MonoLabel>
        <ImageUploader
          bucket="listing-images"
          ownerId={ownerId}
          onUpload={(urls) => setImages((prev) => [...prev, ...urls])}
        />
      </div>

      <ListingBasicFields
        type={type}
        title={title}
        description={description}
        address={address}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onAddressChange={setAddress}
        onTitleBlur={() => markTouched('title')}
        onAddressBlur={() => markTouched('address')}
        titleError={touched.title ? errors.title : undefined}
        addressError={touched.address ? errors.address : undefined}
      >
        <VenueSelector venues={venues} venueId={venueId} onChange={setVenueId} />
      </ListingBasicFields>

      {type === 'event' && (
        <EventFormSection
          eventDate={eventDate}
          eventEndDate={eventEndDate}
          entryFee={entryFee}
          dressCode={dressCode}
          artist={artist}
          ageRestriction={ageRestriction}
          capacity={capacity}
          selectedTags={selectedTags}
          onEventDateChange={setEventDate}
          onEventEndDateChange={setEventEndDate}
          onEntryFeeChange={setEntryFee}
          onDressCodeChange={setDressCode}
          onArtistChange={setArtist}
          onAgeRestrictionChange={setAgeRestriction}
          onCapacityChange={setCapacity}
          onToggleTag={toggleTag}
          eventDateError={touched.eventDate ? errors.eventDate : undefined}
          endDateError={touched.eventEndDate ? errors.eventEndDate : undefined}
          onEventDateBlur={() => markTouched('eventDate')}
          onEndDateBlur={() => markTouched('eventEndDate')}
        />
      )}

      {type === 'food' && (
        <FoodFormSection
          cuisineType={cuisineType}
          openingHours={openingHours}
          priceRange={priceRange}
          special={special}
          onCuisineTypeChange={setCuisineType}
          onOpeningHoursChange={setOpeningHours}
          onPriceRangeChange={setPriceRange}
          onSpecialChange={setSpecial}
        />
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-nz-elevated border border-nz-border rounded-2xl text-nz-text text-sm font-semibold hover:bg-nz-surface transition-colors"
        >
          <Eye size={16} /> Preview
        </button>
        <Button onClick={handleSubmit} loading={loading} size="lg" className="flex-1">
          Publish
        </Button>
      </div>

      <ListingPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        data={previewData}
      />
    </div>
  );
};

export default NewListing;
