import React, { useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { GAUTENG_CENTER, DEFAULT_ZOOM } from '../../constants/mapConfig';
import type { IListingWithDistance } from '../../types/listing.types';

interface IMarkerCluster {
  getChildCount(): number;
}

const createClusterIcon = (cluster: IMarkerCluster) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div class="jol-cluster">${count}</div>`,
    className: 'jol-cluster-wrapper',
    iconSize: L.point(36, 36),
  });
};

const createMarkerIcon = (isEvent: boolean) =>
  L.divIcon({
    html: `<div class="jol-marker" style="background:${isEvent ? '#ff7a3d' : '#d9a85c'};box-shadow:0 0 0 4px ${isEvent ? 'rgba(255,122,61,0.35)' : 'rgba(217,168,92,0.35)'}"></div>`,
    className: 'jol-marker-wrapper',
    iconSize: L.point(22, 22),
    iconAnchor: L.point(11, 11),
  });

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

  const eventIcon = useMemo(() => createMarkerIcon(true), []);
  const foodIcon = useMemo(() => createMarkerIcon(false), []);

  return (
    <MapContainer
      center={GAUTENG_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      zoomControl={false}
      attributionControl
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abcd" maxZoom={20} />

      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterIcon}
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
        {listings.map((listing) => {
          const isEvent = listing.type === 'event';
          return (
            <Marker
              key={listing.id}
              position={[listing.location.lat, listing.location.lng]}
              icon={isEvent ? eventIcon : foodIcon}
              eventHandlers={{ click: () => handleSelect(listing) }}
            >
              <Tooltip direction="top" offset={[0, -14]} className="jol-tooltip">
                {listing.title}
              </Tooltip>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default MapView;
