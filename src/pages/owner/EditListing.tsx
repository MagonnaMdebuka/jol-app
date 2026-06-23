import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getListing, updateListing } from '../../services/listing.service';
import { isSupabaseEnabled } from '../../config/env';
import { useToast } from '../../components/ui/Toast';
import Spinner from '../../components/ui/Spinner';
import MonoLabel from '../../components/ui/MonoLabel';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ImageUploader from '../../components/listings/ImageUploader';
import ListingPreviewModal from '../../components/listings/ListingPreviewModal';
import ListingFormHeader from '../../components/listings/ListingFormHeader';
import EventFormSection from '../../components/listings/EventFormSection';
import FoodFormSection from '../../components/listings/FoodFormSection';
import type { IListingWithDistance, DressCode, PriceRange } from '../../types/listing.types';

const EditListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [listing, setListing] = useState<IListingWithDistance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<string[]>([]);

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

  const previewData = useMemo(
    () => ({
      type: listing?.type ?? 'event',
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
      venueName: listing?.venue_name,
    }),
    [
      listing?.type,
      listing?.venue_name,
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

  useEffect(() => {
    if (!id) return;
    const load = async (): Promise<void> => {
      const data = await getListing(id);
      if (!data) {
        setLoading(false);
        return;
      }

      if (isSupabaseEnabled() && data.owner_id !== authUser?.id) {
        toast('You do not have permission to edit this listing', 'error');
        navigate('/owner/dashboard');
        return;
      }

      setListing(data);
      setTitle(data.title);
      setDescription(data.description ?? '');
      setAddress(data.address ?? '');
      setImages(data.images ?? []);
      setEventDate(data.event_date ?? '');
      setEventEndDate(data.event_end_date ?? '');
      setEntryFee(data.entry_fee ?? '');
      setDressCode((data.dress_code as DressCode) ?? 'Smart Casual');
      setArtist(data.artist ?? '');
      setAgeRestriction(data.age_restriction ?? '');
      setSelectedTags(data.tags ?? []);
      setCapacity(data.capacity ? String(data.capacity) : '');
      setCuisineType(data.cuisine_type ?? '');
      setOpeningHours(data.opening_hours ?? '');
      setPriceRange((data.price_range as PriceRange) ?? 'RR');
      setSpecial(data.special ?? '');
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    if (!id || !listing) return;
    if (!title.trim()) {
      toast('Title is required', 'error');
      return;
    }

    setSaving(true);
    const patch = {
      title,
      description: description || null,
      address,
      images,
      ...(listing.type === 'event'
        ? {
            event_date: eventDate || null,
            event_end_date: eventEndDate || null,
            entry_fee: entryFee || null,
            dress_code: dressCode,
            artist: artist || null,
            age_restriction: ageRestriction || null,
            tags: selectedTags,
            capacity: parseInt(capacity) || null,
          }
        : {
            cuisine_type: cuisineType || null,
            opening_hours: openingHours || null,
            price_range: priceRange,
            special: special || null,
          }),
    };

    const { error } = await updateListing(id, patch);
    if (error) toast(error, 'error');
    else {
      toast('Listing updated', 'success');
      navigate('/owner/dashboard');
    }
    setSaving(false);
  }, [
    id,
    listing,
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
    toast,
    navigate,
  ]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  if (!listing) return <p className="text-nz-muted text-center py-20">Listing not found.</p>;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <ListingFormHeader
        label="EDIT LISTING"
        actionLabel="Save"
        onClose={() => navigate('/owner/dashboard')}
        onAction={handleSave}
      />

      <h1
        className="text-nz-text leading-[0.92] tracking-[-0.04em]"
        style={{
          fontFamily: '"Bricolage Grotesque", system-ui',
          fontWeight: 900,
          fontSize: '32px',
        }}
      >
        Edit {listing.type === 'event' ? 'Event' : 'Food Spot'}
      </h1>

      <div>
        <MonoLabel className="mb-2">PHOTOS</MonoLabel>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {images.map((src, i) => (
              <div
                key={src}
                className="relative h-20 w-20 rounded-[12px] overflow-hidden border border-nz-border"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  type="button"
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <ImageUploader
          bucket="listing-images"
          ownerId={authUser?.id ?? ''}
          onUpload={(urls) => setImages((prev) => [...prev, ...urls])}
        />
      </div>

      <div className="flex flex-col gap-4">
        <MonoLabel className="mb-2">LISTING DETAILS</MonoLabel>
        <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} />
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
            placeholder="Tell people what to expect..."
            className="w-full bg-nz-elevated/80 border border-nz-border/60 hover:border-nz-border rounded-xl px-4 py-3 text-nz-text text-sm placeholder:text-nz-muted/60 outline-none transition-all duration-200 focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40 resize-none"
          />
        </div>
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, suburb, city"
        />
      </div>

      {listing.type === 'event' && (
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
        />
      )}

      {listing.type === 'food' && (
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
        <Button variant="secondary" onClick={() => navigate('/owner/dashboard')} className="flex-1">
          Cancel
        </Button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-nz-elevated border border-nz-border rounded-2xl text-nz-text text-sm font-semibold hover:bg-nz-surface transition-colors"
        >
          <Eye size={16} /> Preview
        </button>
        <Button onClick={handleSave} loading={saving} className="flex-1">
          Save
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

export default EditListing;
