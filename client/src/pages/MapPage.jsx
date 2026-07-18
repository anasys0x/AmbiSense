import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';

import AsyncState from '../components/AsyncState';
import PlaceMarker from '../components/PlaceMarker';
import useApi from '../hooks/useApi';
import { getPlaces } from '../services/places';

export default function MapPage() {
  const { data, loading, error } = useApi(getPlaces);
  const places = data?.places || [];

  return (
    <section>
      <p className="eyebrow">Lecture géographique</p>
      <h1>Carte des ambiances</h1>
      <p className="text-secondary">Les marqueurs gris indiquent une mesure absente ou vieille de plus de 60 minutes.</p>
      <AsyncState loading={loading} error={error} empty={!loading && !error && places.length === 0} emptyMessage="Aucun lieu ne peut encore être placé sur la carte.">
        <div className="map-frame">
          <MapContainer center={[45.5019, -73.5674]} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {places.map((place) => <PlaceMarker key={place.id} place={place} />)}
          </MapContainer>
        </div>
      </AsyncState>
    </section>
  );
}
