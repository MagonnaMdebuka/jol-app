import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getListing, updateListing } from '../../services/listing.service';
import { isSupabaseEnabled } from '../../config/env';
import { EVENT_TAGS, CUISINE_TYPES, PRICE_RANGES } from '../../constants/categories';
import { useToast } from '../../components/ui/Toast';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ImageUploader from '../../components/listings/ImageUploader';
import type { IListingWithDistance, DressCode, PriceRange } from '../../types/listing.types';

const GENRE_VIBES = [
  'Amapiano', 'House', 'Hip Hop', 'Afrobeats', 'RnB', 'Jazz',
  'Live Music', 'Date night', 'Late night', 'Sundowner',
];

const DRESS_CHIP_OPTIONS = ['Casual', 'Smart Casual', 'Formal', 'Any'];

const SELECT_CLASS =
  'w-full bg-nz-elevated/80 border border-nz-border/60 hover:border-nz-border rounded-xl px-4 py-3 text-nz-text text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40';

const MonoLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    className="text-nz-muted mb-2"
    style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em', fontWeight: 500 }}
  >
    {children}
  </p>
);

const EditListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [listing, setListing] = useState<IListingWithDistance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    const load = async (): Promise<void> => {
      const data = await getListing(id);
      if (!data) { setLoading(false); return; }

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
  // authUser?.id and navigate are stable refs; toast is from context
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
    if (!title.trim()) { toast('Title is required', 'error'); return; }
    setSaving(true);
    const patch = {
      title,
      description: description || null,
      address,
      images,
      ...(listing.type === 'event' ? {
        event_date: eventDate || null,
        event_end_date: eventEndDate || null,
        entry_fee: entryFee || null,
        dress_code: dressCode,
        artist: artist || null,
        age_restriction: ageRestriction || null,
        tags: selectedTags,
        capacity: parseInt(capacity) || null,
      } : {
        cuisine_type: cuisineType || null,
        opening_hours: openingHours || null,
        price_range: priceRange,
        special: special || null,
      }),
    };
    const { error } = await updateListing(id, patch);
    if (error) {
      toast(error, 'error');
    } else {
      toast('Listing updated', 'success');
      navigate('/owner/dashboard');
    }
    setSaving(false);
  }, [
    id, listing, title, description, address, images,
    eventDate, eventEndDate, entryFee, dressCode, artist, ageRestriction, selectedTags, capacity,
    cuisineType, openingHours, priceRange, special, toast, navigate,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!listing) {
    return <p className="text-nz-muted text-center py-20">Listing not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/owner/dashboard')}
          className="w-9 h-9 rounded-full bg-nz-elevated border border-nz-border flex items-center justify-center text-nz-muted hover:text-nz-text transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <p
          className="text-nz-muted"
          style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.04em' }}
        >
          EDIT LISTING
        </p>
        <button type="button" onClick={handleSave} className="text-nz-accent text-sm font-bold">
          Save
        </button>
      </div>

      {/* Display heading */}
      <h1
        className="text-nz-text leading-[0.92] tracking-[-0.04em]"
        style={{ fontFamily: '"Bricolage Grotesque", system-ui', fontWeight: 900, fontSize: '32px' }}
      >
        Edit {listing.type === 'event' ? 'Event' : 'Food Spot'}
      </h1>

      {/* Photos */}
      <div>
        <MonoLabel>PHOTOS</MonoLabel>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {images.map((src, i) => (
              <div key={src} className="relative h-20 w-20 rounded-[12px] overflow-hidden border border-nz-border">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"
                  type="button"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <ImageUploader
          bucket="listing-images"
          ownerId={authUser?.id ?? 'demo-owner'}
          onUpload={(urls) => setImages((prev) => [...prev, ...urls])}
        />
      </div>

      {/* Listing details card */}
      <div className="flex flex-col gap-4">
        <MonoLabel>LISTING DETAILS</MonoLabel>
        <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <label
            className="text-nz-muted"
            style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em' }}
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
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, suburb, city" />
      </div>

      {/* Event details */}
      {listing.type === 'event' && (
        <div className="flex flex-col gap-4 bg-nz-surface border border-nz-border/60 rounded-2xl p-4">
          <MonoLabel>EVENT DETAILS</MonoLabel>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date & Time" type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            <Input label="End Time" type="datetime-local" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} />
          </div>
          <Input label="Entry Fee" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} placeholder="e.g. R100 at the door / Free" />
          <div>
            <MonoLabel>DRESS CODE</MonoLabel>
            <div className="flex flex-wrap gap-2">
              {DRESS_CHIP_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDressCode(d as DressCode)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${
                    dressCode === d
                      ? 'bg-nz-text text-nz-bg border-transparent'
                      : 'border-nz-border text-nz-muted hover:text-nz-text'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <Input label="Artist / DJ" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Optional" />
          <Input label="Age Restriction" value={ageRestriction} onChange={(e) => setAgeRestriction(e.target.value)} placeholder="e.g. 18+" />
          <Input label="Capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 200" />
          <div>
            <MonoLabel>GENRE / VIBE TAGS</MonoLabel>
            <div className="flex flex-wrap gap-2">
              {GENRE_VIBES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${
                    selectedTags.includes(tag)
                      ? 'bg-nz-accent text-white border-transparent'
                      : 'border-nz-border text-nz-muted hover:text-nz-text'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {EVENT_TAGS.filter((t) => !GENRE_VIBES.includes(t)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${
                    selectedTags.includes(tag)
                      ? 'bg-nz-accent text-white border-transparent'
                      : 'border-nz-border text-nz-muted hover:text-nz-text'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Food details */}
      {listing.type === 'food' && (
        <div className="flex flex-col gap-4 bg-nz-surface border border-nz-border/60 rounded-2xl p-4">
          <MonoLabel>FOOD DETAILS</MonoLabel>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-nz-muted"
              style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em' }}
            >
              CUISINE TYPE
            </label>
            <select value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} className={SELECT_CLASS}>
              <option value="">Select cuisine...</option>
              {CUISINE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Opening Hours" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} placeholder="e.g. Mon-Sun 10:00-22:00" />
          <div className="flex flex-col gap-1.5">
            <label
              className="text-nz-muted"
              style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em' }}
            >
              PRICE RANGE
            </label>
            <select value={priceRange} onChange={(e) => setPriceRange(e.target.value as PriceRange)} className={SELECT_CLASS}>
              {PRICE_RANGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <Input label="Special / Deal" value={special} onChange={(e) => setSpecial(e.target.value)} placeholder="e.g. R75 lunch special weekdays" />
        </div>
      )}

      {/* Bottom buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('/owner/dashboard')} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} className="flex-1">
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default EditListing;
