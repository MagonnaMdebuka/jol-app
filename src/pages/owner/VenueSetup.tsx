import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { useAuth } from '../../contexts/AuthContext';
import { createVenue } from '../../services/venue.service';
import { cachePlace } from '../../services/places.service';
import { uploadImage, generatePath } from '../../services/storage.service';
import { VENUE_TYPES, NEIGHBOURHOODS } from '../../constants/categories';
import { isSupabaseEnabled } from '../../config/env';
import { useToast } from '../../components/ui/Toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Chip from '../../components/ui/Chip';
import PlaceSearchInput from '../../components/listings/PlaceSearchInput';
import type { VenueType } from '../../types/venue.types';
import type { IPlaceResult } from '../../types/place.types';

const STEPS = ['Basics', 'Location', 'Photos'];

const StepBar: React.FC<{ current: number }> = ({ current }) => (
  <div className="flex gap-1.5 mb-8">
    {STEPS.map((_, i) => (
      <div
        key={i}
        className="flex-1 h-1 rounded-full transition-all duration-300"
        style={{ background: i <= current ? '#ff7a3d' : '#3a2c1b' }}
      />
    ))}
  </div>
);

const MonoLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    className="text-nz-muted mb-3"
    style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em' }}
  >
    {children}
  </p>
);

const VenueSetup: React.FC = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);

  // Step 1: basics
  const [name, setName] = useState('');
  const [type, setType] = useState<VenueType>('Club');
  const [phone, setPhone] = useState('');

  // Step 2: location
  const [address, setAddress] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [lat, setLat] = useState('-26.2');
  const [lng, setLng] = useState('28.0');

  // Step 3: photos + description
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [loading, setLoading] = useState(false);

  // Place search state
  const [selectedPlace, setSelectedPlace] = useState<IPlaceResult | null>(null);

  const handlePlaceSelect = useCallback(
    (place: IPlaceResult) => {
      setSelectedPlace(place);
      setName(place.name);
      setAddress(place.address);
      setLat(place.lat.toString());
      setLng(place.lng.toString());
      if (place.photo_url && !coverPreview) {
        setCoverPreview(place.photo_url);
      }
    },
    [coverPreview],
  );

  const handleCoverChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }, []);

  const handleNext = useCallback(() => {
    if (step === 0) {
      if (!name.trim()) {
        toast('Venue name is required', 'error');
        return;
      }
      if (phone.trim()) {
        const saPhone = /^(\+27|0)[6-8][0-9]{8}$/;
        if (!saPhone.test(phone.replace(/\s/g, ''))) {
          toast('Enter a valid SA phone number (e.g. 082 000 0000)', 'error');
          return;
        }
      }
    }
    if (step === 1) {
      if (!address.trim()) {
        toast('Address is required', 'error');
        return;
      }
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (
        isNaN(parsedLat) ||
        parsedLat < -35 ||
        parsedLat > -22 ||
        isNaN(parsedLng) ||
        parsedLng < 16 ||
        parsedLng > 33
      ) {
        toast('Coordinates appear to be outside South Africa', 'error');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 2));
  }, [step, name, phone, address, lat, lng, toast]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !address.trim()) {
      toast('Venue name and address are required', 'error');
      return;
    }

    // AuthGuard ensures authUser exists; fallback to empty string prevents orphaned venues
    const ownerId = authUser?.id ?? '';
    setLoading(true);

    let coverPhotoUrl = '';
    if (coverFile) {
      try {
        coverPhotoUrl = await uploadImage(
          coverFile,
          'venue-photos',
          generatePath(ownerId, coverFile.name),
        );
      } catch {
        toast('Image upload failed -- continuing without cover photo', 'error');
      }
    }

    const { id, error } = await createVenue({
      owner_id: ownerId,
      name,
      type,
      phone: phone || null,
      address: `${address}${neighbourhood ? `, ${neighbourhood}` : ''}`,
      location: { lat: parseFloat(lat) || -26.0, lng: parseFloat(lng) || 28.0 },
      description: description || null,
      cover_photo: coverPhotoUrl || null,
    });

    if (error) {
      toast(error, 'error');
    } else {
      // Cache place data if venue was created from search
      if (id && selectedPlace) {
        await cachePlace(id, selectedPlace);
      }
      toast(
        isSupabaseEnabled()
          ? 'Venue created! You can now add listings.'
          : 'Demo mode: venue created (not saved)',
        'success',
      );
      navigate(`/owner/dashboard?venueId=${id}`);
    }
    setLoading(false);
  }, [
    name,
    type,
    phone,
    address,
    neighbourhood,
    lat,
    lng,
    description,
    coverFile,
    authUser,
    toast,
    navigate,
    selectedPlace,
  ]);

  const mapLat = parseFloat(lat) || -26.2;
  const mapLng = parseFloat(lng) || 28.0;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <p
          className="text-nz-muted mb-1"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '9px',
            letterSpacing: '0.04em',
          }}
        >
          STEP {step + 1} OF {STEPS.length} · {STEPS[step].toUpperCase()}
        </p>
        <h1
          className="text-nz-text leading-snug tracking-[-0.03em]"
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontWeight: 900,
            fontSize: '28px',
          }}
        >
          Set Up Your Venue
        </h1>
      </div>

      <StepBar current={step} />

      {/* Step 1: Basics */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <div>
            <MonoLabel>FIND YOUR VENUE</MonoLabel>
            <PlaceSearchInput onSelect={handlePlaceSelect} lat={mapLat} lng={mapLng} />
            <p className="text-nz-muted/60 text-xs mt-2">
              Search to auto-fill details, or enter manually below
            </p>
          </div>

          <Input
            label="Venue Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Level Four Sandton"
          />

          <div>
            <MonoLabel>VENUE TYPE *</MonoLabel>
            <div className="grid grid-cols-2 gap-2">
              {VENUE_TYPES.map((vt) => (
                <button
                  key={vt.value}
                  type="button"
                  onClick={() => setType(vt.value as VenueType)}
                  className={`
                    px-3 py-3 rounded-xl text-sm font-semibold text-left
                    border transition-all duration-200 active:scale-[0.98]
                    ${
                      type === vt.value
                        ? 'bg-nz-accent/10 border-nz-accent/50 text-nz-accent-text'
                        : 'bg-nz-surface border-nz-border text-nz-muted hover:text-nz-text'
                    }
                  `}
                >
                  {vt.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+27 11 000 0000"
            type="tel"
          />
        </div>
      )}

      {/* Step 2: Location */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <Input
            label="Street Address *"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, suburb, city"
          />

          <div>
            <MonoLabel>NEIGHBOURHOOD</MonoLabel>
            <div className="flex flex-wrap gap-2">
              {NEIGHBOURHOODS.map((n) => (
                <Chip key={n} active={neighbourhood === n} onClick={() => setNeighbourhood(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="-26.1234"
              type="number"
            />
            <Input
              label="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="28.0456"
              type="number"
            />
          </div>

          {/* Mini map preview */}
          <div
            className="rounded-2xl overflow-hidden border border-nz-border"
            style={{ height: '180px' }}
          >
            <MapContainer
              center={[mapLat, mapLng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
              dragging={false}
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[mapLat, mapLng]} />
            </MapContainer>
          </div>
        </div>
      )}

      {/* Step 3: Photos + description */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          {/* Cover photo */}
          <div>
            <MonoLabel>COVER PHOTO</MonoLabel>
            {coverPreview ? (
              <div className="relative rounded-2xl overflow-hidden mb-3">
                <img src={coverPreview} alt="" className="w-full h-44 object-cover" />
              </div>
            ) : null}
            <label className="flex items-center justify-center gap-2 h-14 border-2 border-dashed border-nz-border/60 hover:border-nz-accent/50 hover:bg-nz-accent/5 rounded-2xl cursor-pointer text-nz-muted hover:text-nz-accent text-sm font-medium transition-all duration-200">
              <Image size={16} />
              {coverPreview ? 'Change cover photo' : 'Upload a cover photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-nz-muted"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '9px',
                letterSpacing: '0.04em',
              }}
            >
              DESCRIPTION ({description.length}/500)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Tell people about your venue, vibe, and what makes it special…"
              className="w-full bg-nz-elevated/80 border border-nz-border/60 hover:border-nz-border rounded-xl px-4 py-3 text-nz-text text-sm placeholder:text-nz-muted/60 outline-none transition-all duration-200 focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40 resize-none"
            />
          </div>
        </div>
      )}

      {/* Sticky bottom button */}
      <div className="mt-auto">
        {step < 2 ? (
          <Button
            onClick={handleNext}
            size="lg"
            iconRight={<ChevronRight size={16} />}
            className="w-full"
          >
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading} size="lg" className="w-full">
            Submit for Review
          </Button>
        )}
      </div>
    </div>
  );
};

export default VenueSetup;
