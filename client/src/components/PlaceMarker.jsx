import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';

import AmbianceBadge from './AmbianceBadge';
import useAmbianceStream from '../hooks/useAmbianceStream';
import useLivePulse from '../hooks/useLivePulse';

const MARKER_COLORS = {
  calm: '#2A9D8F',
  moderate: '#D49A22',
  animated: '#E76F51',
  unknown: '#718096'
};

export default function PlaceMarker({ place }) {
  const navigate = useNavigate();
  const live = useAmbianceStream(place.locationKey || place.name);
  const isLive = useLivePulse(live);

  const classification = live
    ? { code: live.code, label: live.label, isRecent: true }
    : place.ambiance?.classification;
  const markerCode = classification?.isRecent ? classification.code : 'unknown';

  return (
    <>
      {isLive && (
        <CircleMarker
          center={[place.latitude, place.longitude]}
          radius={18}
          interactive={false}
          pathOptions={{ className: 'map-marker-live-halo', color: MARKER_COLORS[markerCode], fillOpacity: 0 }}
        />
      )}
      <CircleMarker
        center={[place.latitude, place.longitude]}
        radius={11}
        pathOptions={{ color: '#ffffff', weight: 3, fillColor: MARKER_COLORS[markerCode], fillOpacity: 1 }}
        eventHandlers={{ click: () => navigate(`/lieux/${place.slug}`) }}
      >
        <Tooltip direction="top" offset={[0, -10]} opacity={1} sticky>
          <div className="map-popup">
            <strong>{place.name}</strong>
            {isLive && <span className="map-live-label">● mesure en direct</span>}
            <AmbianceBadge classification={classification} />
            <div className="map-preview-section">
              <span className="map-preview-label">Dernière observation</span>
              {place.latestObservation ? (
                <>
                  <time dateTime={place.latestObservation.timestamp}>
                    {new Date(place.latestObservation.timestamp).toLocaleString('fr-CA', {
                      dateStyle: 'medium', timeStyle: 'short'
                    })}
                  </time>
                  <span>{place.latestObservation.notes}</span>
                </>
              ) : <span>Aucune observation.</span>}
            </div>
            <div className="map-preview-section">
              <span className="map-preview-label">30 dernières minutes</span>
              {place.recentAverage
                ? <span>{place.recentAverage.value} dB en moyenne ({place.recentAverage.count} mesures)</span>
                : <span>Aucune mesure récente.</span>}
            </div>
            <span className="map-preview-hint">Cliquez pour voir le portrait</span>
          </div>
        </Tooltip>
      </CircleMarker>
    </>
  );
}
