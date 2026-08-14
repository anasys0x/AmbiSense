import React, { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import AsyncState from '../components/AsyncState';
import PlaceMarker from '../components/PlaceMarker';
import useApi from '../hooks/useApi';
import { getMapPlaces } from '../services/places';

const FILTERS = [
  { code: 'all', label: 'Tous' },
  { code: 'calm', label: 'Calmes' },
  { code: 'moderate', label: 'Modérés' },
  { code: 'animated', label: 'Animés' }
];

export function filterPlaces(places, filter) {
  if (filter === 'all') return places;

  return places.filter((place) => {
    const classification = place.ambiance?.classification;
    return classification?.isRecent && classification.code === filter;
  });
}

export default function MapPage() {
  const [filter, setFilter] = useState('all');
  const { data, loading, error } = useApi(getMapPlaces);
  const places = data?.places || [];
  const visiblePlaces = filterPlaces(places, filter);

  return (
    <section>
      <p className="eyebrow">Lecture géographique</p>
      <h1>Carte des ambiances</h1>
      <p className="text-secondary">Les marqueurs gris indiquent une mesure absente ou vieille de plus de 60 minutes.</p>
      <div className="map-filters" role="group" aria-label="Filtrer les lieux par ambiance">
        {FILTERS.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            className={`map-filter map-filter-${code}`}
            aria-pressed={filter === code}
            onClick={() => setFilter(code)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="map-filter-help">Ouvrez le portrait d’un lieu pour consulter ses créneaux calmes.</p>
      <AsyncState loading={loading} error={error} empty={!loading && !error && places.length === 0} emptyMessage="Aucun lieu ne peut encore être placé sur la carte.">
        {places.length > 0 && visiblePlaces.length === 0 && (
          <p className="state-card">Aucun lieu ne correspond à ce filtre.</p>
        )}
        <div className="map-frame">
          <MapContainer center={[45.5019, -73.5674]} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {visiblePlaces.map((place) => <PlaceMarker key={place.id} place={place} />)}
          </MapContainer>
        </div>
      </AsyncState>
    </section>
  );
}
