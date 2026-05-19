import React, { useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { GAUTENG_CENTER, DEFAULT_ZOOM } from '../../constants/mapConfig';
import type { IListingWithDistance } from '../../types/listing.types';

interface IMapViewProps {
  listings: IListingWithDistance[];
  onSelectListing: (listing: IListingWithDistance) => void;
}

// CartoDB Dark Matter — OSM data, dark-themed, free, no API key required
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
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

      {listings.map((listing) => (
        <CircleMarker
          key={listing.id}
          center={[listing.location.lat, listing.location.lng]}
          radius={10}
          pathOptions={{
            fillColor: listing.type === 'event' ? '#f97316' : '#22c55e',
            fillOpacity: 1,
            color: '#ffffff',
            weight: 2,
          }}
          eventHandlers={{ click: () => handleSelect(listing) }}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            {listing.title}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default MapView;
