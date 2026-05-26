import React, { useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { GAUTENG_CENTER, DEFAULT_ZOOM } from '../../constants/mapConfig';
import type { IListingWithDistance } from '../../types/listing.types';

interface IMapViewProps {
  listings: IListingWithDistance[];
  onSelectListing: (listing: IListingWithDistance) => void;
}

// CartoDB Voyager — OSM data, colourful streets, free, no API key required
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

const MapView: React.FC<IMapViewProps> = ({ listings, onSelectListing }) => {
  const handleSelect = useCallback(
    (listing: IListingWithDistance) => onSelectListing(listing),
    [onSelectListing],
  );

  return (
    <MapContainer
      center={GAUTENG_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      zoomControl={false}
      attributionControl
    >
      <TileLayer
        url={TILE_URL}
        attribution={TILE_ATTRIBUTION}
        subdomains="abcd"
        maxZoom={20}
      />

      {listings.map((listing) => {
        const isEvent = listing.type === 'event';
        const fill = isEvent ? '#ff7a3d' : '#d9a85c';
        const ring = isEvent ? 'rgba(255,122,61,0.35)' : 'rgba(217,168,92,0.35)';
        return (
          <CircleMarker
            key={listing.id}
            center={[listing.location.lat, listing.location.lng]}
            radius={11}
            pathOptions={{
              fillColor: fill,
              fillOpacity: 0.95,
              color: ring,
              weight: 5,
            }}
            eventHandlers={{ click: () => handleSelect(listing) }}
          >
            <Tooltip direction="top" offset={[0, -14]} className="jol-tooltip">
              {listing.title}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default MapView;
