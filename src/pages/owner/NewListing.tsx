import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, UtensilsCrossed, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createListing } from '../../services/listing.service';
import { getOwnerVenues } from '../../services/venue.service';
import { isSupabaseEnabled } from '../../config/env';
import { EVENT_TAGS, CUISINE_TYPES, PRICE_RANGES } from '../../constants/categories';
import { useToast } from '../../components/ui/Toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import MonoLabel from '../../components/ui/MonoLabel';
import ImageUploader from '../../components/listings/ImageUploader';
import ListingPreviewModal from '../../components/listings/ListingPreviewModal';
import type { IVenue } from '../../types/venue.types';
import type { ListingType, DressCode, PriceRange } from '../../types/listing.types';

const GENRE_VIBES = [
  'Amapiano',
  'House',
  'Hip Hop',
  'Afrobeats',
  'RnB',
  'Jazz',
  'Live Music',
  'Date night',
  'Late night',
  'Sundowner',
];

const DRESS_CHIP_OPTIONS = ['Casual', 'Smart Casual', 'Formal', 'Any'];

const SELECT_CLASS =
  'w-full bg-nz-elevated/80 border border-nz-border/60 hover:border-nz-border rounded-xl px-4 py-3 text-nz-text text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40';

const NewListing: React.FC = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // AuthGuard ensures authUser exists; fallback to empty string prevents creating orphaned listings
  const ownerId = authUser?.id ?? '';

  const [venues, setVenues] = useState<IVenue[]>([]);
  const [venueId, setVenueId] = useState('');
  const [type, setType] = useState<ListingType>('event');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);

  const selectedVenue = useMemo(() => venues.find((v) => v.id === venueId), [venues, venueId]);

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

  const getVenueLocation = useCallback((): { lat: number; lng: number } => {
    const venue = venues.find((v) => v.id === venueId);
    return venue?.location ?? { lat: -26.0, lng: 28.0 };
  }, [venues, venueId]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !address.trim()) {
      toast('Title and address are required', 'error');
      return;
    }
    setLoading(true);
    const location = getVenueLocation();
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

    if (error) {
      toast(error, 'error');
    } else {
      toast(
        isSupabaseEnabled() ? 'Listing published!' : `Demo mode: listing created (id: ${id})`,
        'success',
      );
      navigate('/owner/dashboard');
    }
    setLoading(false);
  }, [
    title,
    description,
    address,
    type,
    venueId,
    ownerId,
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
    getVenueLocation,
    toast,
    navigate,
  ]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-nz-elevated border border-nz-border flex items-center justify-center text-nz-muted hover:text-nz-text transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <p
          className="text-nz-muted"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '10px',
            letterSpacing: '0.04em',
          }}
        >
          NEW LISTING
        </p>
        <button type="button" onClick={handleSubmit} className="text-nz-accent text-sm font-bold">
          Publish
        </button>
      </div>

      {/* Display headline */}
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

      {/* Type toggle — 2 large card buttons */}
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            {
              value: 'event' as const,
              icon: <Calendar size={20} />,
              title: 'Event',
              sub: 'Party, DJ night, live music',
            },
            {
              value: 'food' as const,
              icon: <UtensilsCrossed size={20} />,
              title: 'Food Spot',
              sub: 'Restaurant, market, cafe',
            },
          ] as const
        ).map(({ value, icon, title: t, sub }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setType(value);
              if (value === 'food') {
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
            }}
            className={`
              flex flex-col items-start gap-2 p-4 rounded-2xl border text-left
              transition-all duration-200 active:scale-[0.98]
              ${
                type === value
                  ? 'bg-nz-accent/10 border-nz-accent/50'
                  : 'bg-nz-surface border-nz-border hover:border-nz-muted/40'
              }
            `}
          >
            <span className={type === value ? 'text-nz-accent' : 'text-nz-muted'}>{icon}</span>
            <div>
              <p
                className={`font-bold text-sm ${type === value ? 'text-nz-text' : 'text-nz-muted'}`}
              >
                {t}
              </p>
              <p className="text-nz-subtle text-xs mt-0.5">{sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Photos */}
      <div>
        <MonoLabel className="mb-2">PHOTOS</MonoLabel>
        <ImageUploader
          bucket="listing-images"
          ownerId={ownerId}
          onUpload={(urls) => setImages((prev) => [...prev, ...urls])}
        />
      </div>

      {/* Core details */}
      <div className="flex flex-col gap-4">
        <MonoLabel className="mb-2">LISTING DETAILS</MonoLabel>

        {/* Venue selector */}
        {venues.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <label
              className="text-nz-muted"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '9px',
                letterSpacing: '0.04em',
              }}
            >
              VENUE
            </label>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className={SELECT_CLASS}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="bg-nz-elevated/60 border border-nz-border/40 rounded-xl px-4 py-3">
            <p className="text-nz-muted text-xs leading-relaxed">
              No venue registered. Set up your venue first to publish listings.
            </p>
          </div>
        )}

        <Input
          label="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'event' ? 'e.g. Amapiano Friday Night' : 'e.g. Marble Rosebank'}
        />

        <div className="flex flex-col gap-1.5">
          <label
            className="text-nz-muted"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '9px',
              letterSpacing: '0.04em',
            }}
          >
            DESCRIPTION ({description.length}/300)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="Tell people what to expect…"
            className="w-full bg-nz-elevated/80 border border-nz-border/60 hover:border-nz-border rounded-xl px-4 py-3 text-nz-text text-sm placeholder:text-nz-muted/60 outline-none transition-all duration-200 focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40 resize-none"
          />
        </div>

        <Input
          label="Address *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, suburb, city"
        />
      </div>

      {/* Event-specific section */}
      {type === 'event' && (
        <div className="flex flex-col gap-4 bg-nz-surface border border-nz-border/60 rounded-2xl p-4">
          <MonoLabel className="mb-2">EVENT DETAILS</MonoLabel>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date & Time"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <Input
              label="End Time"
              type="datetime-local"
              value={eventEndDate}
              onChange={(e) => setEventEndDate(e.target.value)}
            />
          </div>

          <Input
            label="Entry Fee"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            placeholder="e.g. R100 at the door / Free"
          />

          <div>
            <MonoLabel className="mb-2">DRESS CODE</MonoLabel>
            <div className="flex flex-wrap gap-2">
              {DRESS_CHIP_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDressCode(d as DressCode)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-semibold border
                    transition-all duration-200 active:scale-95
                    ${
                      dressCode === d
                        ? 'bg-nz-text text-nz-bg border-transparent'
                        : 'border-nz-border text-nz-muted hover:text-nz-text'
                    }
                  `}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Artist / DJ"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Optional"
          />
          <Input
            label="Age Restriction"
            value={ageRestriction}
            onChange={(e) => setAgeRestriction(e.target.value)}
            placeholder="e.g. 18+"
          />
          <Input
            label="Capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="e.g. 200"
          />

          <div>
            <MonoLabel className="mb-2">GENRE / VIBE TAGS</MonoLabel>
            <div className="flex flex-wrap gap-2">
              {GENRE_VIBES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-semibold border
                    transition-all duration-200 active:scale-95
                    ${
                      selectedTags.includes(tag)
                        ? 'bg-nz-accent text-white border-transparent'
                        : 'border-nz-border text-nz-muted hover:text-nz-text'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
              {EVENT_TAGS.filter((t) => !GENRE_VIBES.includes(t)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-semibold border
                    transition-all duration-200 active:scale-95
                    ${
                      selectedTags.includes(tag)
                        ? 'bg-nz-accent text-white border-transparent'
                        : 'border-nz-border text-nz-muted hover:text-nz-text'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Food-specific section */}
      {type === 'food' && (
        <div className="flex flex-col gap-4 bg-nz-surface border border-nz-border/60 rounded-2xl p-4">
          <MonoLabel className="mb-2">FOOD DETAILS</MonoLabel>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-nz-muted"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '9px',
                letterSpacing: '0.04em',
              }}
            >
              CUISINE TYPE
            </label>
            <select
              value={cuisineType}
              onChange={(e) => setCuisineType(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Select cuisine…</option>
              {CUISINE_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Opening Hours"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="e.g. Mon–Sun 10:00–22:00"
          />

          <div className="flex flex-col gap-1.5">
            <label
              className="text-nz-muted"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '9px',
                letterSpacing: '0.04em',
              }}
            >
              PRICE RANGE
            </label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as PriceRange)}
              className={SELECT_CLASS}
            >
              {PRICE_RANGES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Special / Deal"
            value={special}
            onChange={(e) => setSpecial(e.target.value)}
            placeholder="e.g. R75 lunch special weekdays"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-nz-elevated border border-nz-border rounded-2xl text-nz-text text-sm font-semibold hover:bg-nz-surface transition-colors"
        >
          <Eye size={16} />
          Preview
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
