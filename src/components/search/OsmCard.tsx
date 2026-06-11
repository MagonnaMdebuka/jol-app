import React from 'react';
import { MapPin, ChevronRight, Star } from 'lucide-react';
import Badge from '../ui/Badge';
import { formatOsmCategory } from '../../services/osm.service';
import type { IOsmPlace } from '../../services/osm.service';

export interface IOsmCardProps {
  place: IOsmPlace;
  onClick: (place: IOsmPlace) => void;
}

const fmtDistance = (m: number): string =>
  m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)} km`;

const MonoMeta: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className="text-[10px] text-nz-muted/80 uppercase tracking-wider"
    style={{ fontFamily: '"JetBrains Mono", monospace' }}
  >
    {children}
  </span>
);

const OsmCard: React.FC<IOsmCardProps> = ({ place, onClick }) => (
  <article
    onClick={() => onClick(place)}
    className="flex items-center gap-3 bg-nz-surface border border-nz-border rounded-[18px] p-3 cursor-pointer hover:border-nz-muted/40 transition-all duration-200 opacity-80"
  >
    {/* Photo or icon placeholder */}
    <div className="shrink-0 w-[92px] h-[92px] rounded-[12px] bg-nz-elevated flex items-center justify-center overflow-hidden">
      {place.photo_url ? (
        <img
          src={place.photo_url}
          alt={place.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <MapPin size={28} className="text-nz-muted" />
      )}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="mb-1">
        <Badge variant="neutral">Not on Jol</Badge>
      </div>
      <p
        className="text-nz-text leading-snug line-clamp-2 mb-0.5"
        style={{
          fontFamily: '"Bricolage Grotesque", system-ui',
          fontWeight: 700,
          fontSize: '16px',
        }}
      >
        {place.name}
      </p>
      <p className="text-nz-muted text-[11px] truncate mb-0.5">{place.address}</p>
      <div className="flex items-center gap-1.5">
        {place.rating !== undefined && (
          <>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-nz-apricot">
              <Star size={10} className="fill-nz-apricot" />
              {place.rating.toFixed(1)}
            </span>
            <MonoMeta>·</MonoMeta>
          </>
        )}
        <MonoMeta>{formatOsmCategory(place.amenity, place.cuisine)}</MonoMeta>
        {place.distance_metres !== null && (
          <MonoMeta>· {fmtDistance(place.distance_metres)}</MonoMeta>
        )}
      </div>
    </div>

    <ChevronRight size={18} className="shrink-0 text-nz-muted" />
  </article>
);

export default OsmCard;
