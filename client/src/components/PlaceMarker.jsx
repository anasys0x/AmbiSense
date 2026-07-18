import React from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';

import AmbianceBadge from './AmbianceBadge';

const MARKER_COLORS = {
  calm: '#2A9D8F',
  moderate: '#D49A22',
  animated: '#E76F51',
  unknown: '#718096'
};

export default function PlaceMarker({ place }) {
  const classification = place.ambiance?.classification;
  const markerCode = classification?.isRecent ? classification.code : 'unknown';

  return (
    <CircleMarker
      center={[place.latitude, place.longitude]}
      radius={11}
      pathOptions={{ color: '#ffffff', weight: 3, fillColor: MARKER_COLORS[markerCode], fillOpacity: 1 }}
    >
      <Popup>
        <div className="map-popup">
          <strong>{place.name}</strong>
          <AmbianceBadge classification={classification} />
          <Link to={`/lieux/${place.slug}`}>Voir le portrait</Link>
        </div>
      </Popup>
    </CircleMarker>
  );
}
