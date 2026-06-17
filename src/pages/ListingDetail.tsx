import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, MapPin, ShieldCheck, ExternalLink, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { getListing, incrementViewCount } from '../services/listing.service';
import type { IListingWithDistance } from '../types/listing.types';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import ReportButton from '../components/listings/ReportButton';
import ClaimVenueButton from '../components/listings/ClaimVenueButton';
import { useSaved } from '../contexts/SavedContext';
import { useInterested } from '../contexts/InterestedContext';
import { useAuth } from '../contexts/AuthContext';
import { useListings } from '../contexts/ListingsContext';

const fmtDate = (s: string): string =>
  new Date(s).toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const fmtTime = (s: string): string =>
  new Date(s).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

interface IFactRowProps {
  label: string;
  value: string;
  accent?: boolean;
}

const FactRow: React.FC<IFactRowProps> = ({ label, value, accent }) => (
  <div
    className={`rounded-2xl px-4 py-3 flex flex-col gap-0.5 ${
      accent
        ? 'bg-nz-accent-soft border border-nz-accent/30'
        : 'bg-nz-surface border border-nz-border'
    }`}
  >
    <span
      className="text-nz-muted"
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        letterSpacing: '0.04em',
      }}
    >
      {label.toUpperCase()}
    </span>
    <span className={`text-sm font-semibold ${accent ? 'text-nz-accent-text' : 'text-nz-text'}`}>
      {value}
    </span>
  </div>
);

const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<IListingWithDistance | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [localInterestedCount, setLocalInterestedCount] = useState<number>(0);
  const { isSaved, toggleSave } = useSaved();
  const { isInterested, toggleInterested } = useInterested();
  const { isGuest } = useAuth();
  const { getListingById } = useListings();

  useEffect(() => {
    if (!id) return;
    const load = async (): Promise<void> => {
      // Try to get from context first (handles both Supabase and ephemeral OSM/Google listings)
      let data = getListingById(id);

      // If not in context, try Supabase (for deep links to owner listings)
      if (!data) {
        data = await getListing(id);
      }

      setListing(data);
      setLocalInterestedCount(data?.interested_count ?? 0);
      setLoading(false);
    };
    load();
    // Only increment view count for Supabase listings (not ephemeral ones)
    if (id && !id.startsWith('osm-')) {
      incrementViewCount(id);
    }
  }, [id, getListingById]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);
  const handleSave = useCallback(() => {
    if (listing) toggleSave(listing.id);
  }, [listing, toggleSave]);

  const handleShare = useCallback(async () => {
    if (!listing) return;
    const shareData = {
      title: listing.title,
      text: `Check out ${listing.title} at ${listing.venue_name ?? listing.address} — via Jol`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed silently
      }
    } else {
      // Fallback: WhatsApp
      const text = encodeURIComponent(`${shareData.text} ${shareData.url}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  }, [listing]);

  const handleWhatsApp = useCallback(() => {
    if (!listing) return;
    const text = encodeURIComponent(
      `Check out ${listing.title} at ${listing.address} — via Jol ${window.location.href}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [listing]);

  const handleDirections = useCallback(() => {
    if (!listing) return;
    const { lat, lng } = listing.location;
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  }, [listing]);

  const handleInterested = useCallback(async () => {
    if (!listing) return;
    if (isGuest) {
      navigate('/sign-in');
      return;
    }
    const wasInterested = isInterested(listing.id);
    setLocalInterestedCount((prev) => (wasInterested ? Math.max(0, prev - 1) : prev + 1));
    await toggleInterested(listing.id);
  }, [listing, isGuest, isInterested, toggleInterested, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-nz-bg gap-4">
        <Spinner size="lg" />
        <p className="text-nz-muted text-sm">Loading listing…</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-nz-bg gap-5 px-8">
        <div className="w-16 h-16 rounded-3xl bg-nz-elevated border border-nz-border flex items-center justify-center">
          <MapPin size={28} className="text-nz-muted opacity-50" />
        </div>
        <div className="text-center">
          <p className="text-nz-text font-bold text-lg">Listing not found</p>
          <p className="text-nz-muted text-sm mt-1">This spot may have been removed.</p>
        </div>
        <Button onClick={() => navigate('/')} variant="secondary">
          Back to Map
        </Button>
      </div>
    );
  }

  const isEvent = listing.type === 'event';
  const saved = isSaved(listing.id);
  const photos = listing.images;

  return (
    <div className="h-full overflow-y-auto bg-nz-bg pb-28">
      {/* Hero — 380px photo gallery */}
      <div className="relative h-[380px] shrink-0">
        {photos[photoIndex] ? (
          <img
            src={photos[photoIndex]}
            alt={listing.title}
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.05) contrast(1.02)' }}
          />
        ) : (
          <div className="w-full h-full bg-nz-elevated" />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(22,17,12,0) 30%, rgba(22,17,12,0.96) 100%)',
          }}
        />

        {/* Back button — top-left */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-all duration-200"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Save + Share — top-right */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleSave}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-200"
            aria-label={saved ? 'Remove from saved' : 'Save'}
          >
            <Heart size={16} className={saved ? 'text-nz-accent fill-nz-accent' : 'text-white'} />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all duration-200"
            aria-label="Share"
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* Dot nav */}
        {photos.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === photoIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Bottom overlay content */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-16">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={listing.type} />
            {listing.status === 'active' && <Badge variant="active">Verified</Badge>}
          </div>
          <h1
            className="text-white leading-[0.92] tracking-[-0.04em] mb-1"
            style={{
              fontFamily: '"Bricolage Grotesque", system-ui',
              fontWeight: 900,
              fontSize: '36px',
            }}
          >
            {listing.title}
          </h1>
          <div className="flex items-center gap-1.5 flex-wrap">
            {listing.venue_name && (
              <span className="text-white/60 text-sm font-medium">{listing.venue_name}</span>
            )}
            {listing.distance_metres !== undefined && (
              <>
                <span className="text-white/30 text-xs">·</span>
                <span
                  className="text-white/50"
                  style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px' }}
                >
                  {(listing.distance_metres / 1000).toFixed(1)} km away
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4 mt-4">
        {/* Fact grid */}
        {isEvent ? (
          <div className="grid grid-cols-2 gap-2">
            {listing.event_date && <FactRow label="When" value={fmtDate(listing.event_date)} />}
            {listing.event_date && (
              <FactRow
                label="Time"
                value={`${fmtTime(listing.event_date)}${listing.event_end_date ? ` – ${fmtTime(listing.event_end_date)}` : ''}`}
              />
            )}
            {listing.entry_fee && <FactRow label="Entry fee" value={listing.entry_fee} accent />}
            {listing.dress_code && <FactRow label="Dress code" value={listing.dress_code} />}
            {listing.artist && <FactRow label="Artist" value={listing.artist} />}
            {listing.age_restriction && <FactRow label="Age" value={listing.age_restriction} />}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {listing.opening_hours && <FactRow label="Hours" value={listing.opening_hours} />}
            {listing.price_range && (
              <FactRow label="Price range" value={listing.price_range} accent />
            )}
            {listing.cuisine_type && <FactRow label="Cuisine" value={listing.cuisine_type} />}
            {listing.special && <FactRow label="Special" value={listing.special} />}
          </div>
        )}

        {/* Interested button for events */}
        {isEvent && (
          <button
            onClick={handleInterested}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border transition-all ${
              isInterested(listing.id)
                ? 'bg-nz-accent/20 border-nz-accent/40 text-nz-accent'
                : 'bg-nz-surface border-nz-border text-nz-muted hover:text-nz-text'
            }`}
          >
            <Star size={16} className={isInterested(listing.id) ? 'fill-nz-accent' : ''} />
            <span className="font-semibold text-sm">
              {isInterested(listing.id) ? 'Interested' : 'Interested'}
              {localInterestedCount > 0 && ` · ${localInterestedCount}`}
            </span>
          </button>
        )}

        {/* Description */}
        {listing.description && (
          <p className="text-nz-muted text-sm leading-relaxed" style={{ lineHeight: 1.6 }}>
            {listing.description}
          </p>
        )}

        {/* Vibe tags */}
        {listing.vibe && listing.vibe.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {listing.vibe.map((v) => (
              <span
                key={v}
                className="px-3 py-1 rounded-full text-xs font-medium bg-nz-elevated border border-nz-border text-nz-muted"
              >
                {v}
              </span>
            ))}
          </div>
        )}

        {/* Genre tags (events) */}
        {isEvent && listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {listing.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(255,122,61,0.16)',
                  color: '#ffb88a',
                  border: '1px solid rgba(255,122,61,0.3)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Address mini-map */}
        <div className="rounded-2xl overflow-hidden border border-nz-border">
          <div className="h-[140px]">
            <MapContainer
              center={[listing.location.lat, listing.location.lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[listing.location.lat, listing.location.lng]} />
            </MapContainer>
          </div>
          <div className="px-4 py-3 bg-nz-surface flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {listing.venue_name && (
                <p className="text-nz-text text-sm font-semibold truncate">{listing.venue_name}</p>
              )}
              <p className="text-nz-muted text-xs mt-0.5 leading-snug">{listing.address}</p>
            </div>
            <button
              onClick={handleDirections}
              className="shrink-0 flex items-center gap-1.5 text-nz-accent text-xs font-semibold"
            >
              <ExternalLink size={12} />
              Directions
            </button>
          </div>
        </div>

        {/* Disclaimer banner */}
        <div
          className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
          style={{
            background: 'rgba(255,122,61,0.1)',
            border: '1px solid rgba(255,122,61,0.3)',
          }}
        >
          <ShieldCheck size={16} className="text-nz-accent shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: '#ffb88a' }}>
            <span className="font-bold text-nz-text">Pay at the door.</span> Jol doesn't sell
            tickets — just find the spot.
          </p>
        </div>

        {/* Claim venue CTA for unclaimed venues */}
        <ClaimVenueButton
          venueId={listing.venue_id}
          venueName={listing.venue_name ?? listing.title}
        />

        <ReportButton listingId={listing.id} />
      </div>

      {/* Sticky bottom action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 flex gap-3"
        style={{
          background: 'rgba(22,17,12,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(58,44,27,0.5)',
        }}
      >
        <Button
          variant="whatsapp"
          size="lg"
          icon={<Share2 size={16} />}
          onClick={handleWhatsApp}
          className="shrink-0"
        >
          Share
        </Button>
        <Button size="lg" onClick={handleDirections} className="flex-1">
          <MapPin size={16} className="mr-1" />
          Take me there
        </Button>
      </div>
    </div>
  );
};

export default ListingDetail;
