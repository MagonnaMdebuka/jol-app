import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarPlus,
  Clock3,
  ExternalLink,
  Heart,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  Share2,
  Sparkles,
  Star,
  Store,
  Ticket,
} from 'lucide-react';
import Badge from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { formatOsmCategory, type IOsmPlace } from '../../services/osm.service';
import type { IListingWithDistance } from '../../types/listing.types';

interface ISelectedPlaceSheetProps {
  place: IOsmPlace;
  listings: IListingWithDistance[];
}

const fmtDistance = (m: number): string =>
  m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)} km`;

const normalize = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const buildRegisterUrl = (place: IOsmPlace): string => {
  const params = new URLSearchParams({ name: place.name, address: place.address });
  return `/owner/register?${params.toString()}`;
};

const buildDirectionsUrl = (place: IOsmPlace): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&destination_place_id=${encodeURIComponent(place.name)}`;

const matchingEventsForPlace = (
  place: IOsmPlace,
  listings: IListingWithDistance[],
): IListingWithDistance[] => {
  const placeName = normalize(place.name);
  const placeAddress = normalize(place.address);

  return listings
    .filter((listing) => {
      if (listing.type !== 'event' || listing.status !== 'active') return false;
      const venueName = normalize(listing.venue_name);
      const listingAddress = normalize(listing.address);

      return (
        (venueName.length > 0 && (venueName === placeName || venueName.includes(placeName))) ||
        (placeAddress !== 'address unavailable' &&
          listingAddress.length > 0 &&
          (listingAddress.includes(placeAddress) || placeAddress.includes(listingAddress)))
      );
    })
    .slice(0, 3);
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="font-display text-[18px] font-black text-nz-text tracking-normal">{children}</h3>
);

const PlaceHero: React.FC<{ place: IOsmPlace }> = ({ place }) => {
  const category = formatOsmCategory(place.amenity, place.cuisine);

  return (
    <div className="relative -mx-5 -mt-1 h-[220px] overflow-hidden bg-nz-elevated sm:mx-0 sm:rounded-[24px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,184,138,0.32),transparent_34%),linear-gradient(135deg,#2e2116_0%,#5a2d1d_46%,#17100b_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] bg-[linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a06] via-[#0f0a06]/48 to-black/10" />

      <div className="absolute left-5 right-5 bottom-5">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-black/24 text-white shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <Store size={24} aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">Not on Jol</Badge>
          <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/82">
            {category}
          </span>
        </div>
        <h2 className="mt-2 line-clamp-2 font-display text-[34px] font-black leading-[0.95] tracking-normal text-white">
          {place.name}
        </h2>
      </div>
    </div>
  );
};

const PlaceActions: React.FC<{ place: IOsmPlace }> = ({ place }) => {
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const directionsUrl = buildDirectionsUrl(place);

  const handleSave = (): void => {
    setSaved((prev) => !prev);
    toast(saved ? 'Removed from saved places' : 'Place saved for this session', 'success');
  };

  const handleShare = async (): Promise<void> => {
    const shareText = `${place.name} - ${place.address}`;
    if (navigator.share) {
      await navigator.share({ title: place.name, text: shareText, url: directionsUrl });
      return;
    }
    await navigator.clipboard?.writeText(directionsUrl);
    toast('Directions link copied', 'success');
  };

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
      <a
        href={directionsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-nz-accent px-4 py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(255,122,61,0.22)] transition-all duration-200 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-nz-accent/60 focus:ring-offset-2 focus:ring-offset-nz-bg active:scale-[0.98]"
      >
        <Navigation size={17} aria-hidden="true" />
        Directions
      </a>
      <button
        type="button"
        onClick={handleSave}
        aria-pressed={saved}
        aria-label={saved ? `Unsave ${place.name}` : `Save ${place.name}`}
        className="inline-flex min-h-12 w-12 items-center justify-center rounded-2xl border border-nz-border bg-nz-elevated text-nz-text transition-all duration-200 hover:border-nz-muted/50 focus:outline-none focus:ring-2 focus:ring-nz-accent/50 focus:ring-offset-2 focus:ring-offset-nz-bg active:scale-[0.98]"
      >
        <Heart size={18} className={saved ? 'fill-nz-accent text-nz-accent' : ''} />
      </button>
      <button
        type="button"
        onClick={handleShare}
        aria-label={`Share ${place.name}`}
        className="inline-flex min-h-12 w-12 items-center justify-center rounded-2xl border border-nz-border bg-nz-elevated text-nz-text transition-all duration-200 hover:border-nz-muted/50 focus:outline-none focus:ring-2 focus:ring-nz-accent/50 focus:ring-offset-2 focus:ring-offset-nz-bg active:scale-[0.98]"
      >
        <Share2 size={18} />
      </button>
    </div>
  );
};

const PlaceInfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-nz-border/80 bg-nz-surface p-3.5">
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-nz-elevated text-nz-accent">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-wider text-nz-muted/80">{label}</p>
      <div className="mt-0.5 text-sm leading-snug text-nz-text">{value}</div>
    </div>
  </div>
);

const PlaceAbout: React.FC<{ place: IOsmPlace }> = ({ place }) => (
  <section className="space-y-3">
    <SectionTitle>About</SectionTitle>
    <div className="grid gap-2.5">
      <PlaceInfoCard icon={<MapPin size={17} />} label="Address" value={place.address} />
      <PlaceInfoCard
        icon={<Clock3 size={17} />}
        label="Opening hours"
        value={<span className="text-nz-muted">Not available from this source</span>}
      />
      <PlaceInfoCard
        icon={<Info size={17} />}
        label="Type"
        value={formatOsmCategory(place.amenity, place.cuisine)}
      />
    </div>
  </section>
);

const VenueEventsSection: React.FC<{
  place: IOsmPlace;
  events: IListingWithDistance[];
}> = ({ place, events }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <SectionTitle>Events happening here</SectionTitle>
      <Link
        to="/owner/listings/new"
        className="shrink-0 text-sm font-semibold text-nz-accent focus:outline-none focus:ring-2 focus:ring-nz-accent/50 focus:ring-offset-2 focus:ring-offset-nz-bg"
      >
        Add event
      </Link>
    </div>

    {events.length > 0 ? (
      <div className="space-y-2.5">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/listing/${event.id}`}
            className="flex items-center gap-3 rounded-2xl border border-nz-border bg-nz-surface p-3 transition-all duration-200 hover:border-nz-muted/50 focus:outline-none focus:ring-2 focus:ring-nz-accent/50 focus:ring-offset-2 focus:ring-offset-nz-bg"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-nz-elevated">
              {event.images[0] ? (
                <img src={event.images[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-nz-muted">
                  <Ticket size={20} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 font-display text-[16px] font-bold leading-tight text-nz-text">
                {event.title}
              </p>
              <p className="mt-1 text-xs text-nz-muted">{event.when_chip ?? 'Event details'}</p>
            </div>
            <ExternalLink size={16} className="shrink-0 text-nz-muted" />
          </Link>
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border border-dashed border-nz-border bg-nz-surface/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nz-elevated text-nz-accent">
            <CalendarPlus size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-nz-text">No events listed here yet.</p>
            <p className="mt-1 text-xs leading-relaxed text-nz-muted">
              Add the first event for {place.name} and help people find what is happening nearby.
            </p>
          </div>
        </div>
      </div>
    )}
  </section>
);

const AddVenueCTA: React.FC<{ place: IOsmPlace }> = ({ place }) => (
  <Link
    to={buildRegisterUrl(place)}
    className="flex items-center justify-between gap-4 rounded-[22px] border border-nz-accent/35 bg-nz-accent-soft p-4 transition-all duration-200 hover:border-nz-accent/70 focus:outline-none focus:ring-2 focus:ring-nz-accent/55 focus:ring-offset-2 focus:ring-offset-nz-bg"
  >
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-nz-accent/18 text-nz-accent">
        <Sparkles size={20} />
      </div>
      <div>
        <p className="font-display text-[17px] font-black leading-tight text-nz-text">
          Add venue to Jol
        </p>
        <p className="mt-1 text-sm leading-relaxed text-nz-muted">
          List events and help people discover this spot.
        </p>
      </div>
    </div>
    <ExternalLink size={18} className="shrink-0 text-nz-accent" />
  </Link>
);

const SelectedPlaceSheet: React.FC<ISelectedPlaceSheetProps> = ({ place, listings }) => {
  const events = useMemo(() => matchingEventsForPlace(place, listings), [listings, place]);
  const category = formatOsmCategory(place.amenity, place.cuisine);

  return (
    <div className="space-y-5 pb-4">
      <PlaceHero place={place} />

      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-nz-muted">
            <span className="inline-flex items-center gap-1.5">
              <Star size={15} className="text-nz-apricot" aria-hidden="true" />
              Rating unavailable
            </span>
            <span aria-hidden="true">&bull;</span>
            <span>{category}</span>
          </div>
          {place.distance_metres !== null && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-nz-text">
              <LocateFixed size={15} className="text-nz-accent" aria-hidden="true" />
              {fmtDistance(place.distance_metres)} away
            </p>
          )}
        </div>

        <PlaceActions place={place} />
      </div>

      <PlaceAbout place={place} />
      <VenueEventsSection place={place} events={events} />
      <AddVenueCTA place={place} />

      <p className="pb-1 text-center font-mono text-[9px] uppercase tracking-wider text-nz-muted/45">
        Data (c) OpenStreetMap contributors
      </p>
    </div>
  );
};

export default SelectedPlaceSheet;
