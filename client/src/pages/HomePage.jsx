import React from 'react';
import { Link } from 'react-router-dom';

import AsyncState from '../components/AsyncState';
import PlaceSummary from '../components/PlaceSummary';
import useApi from '../hooks/useApi';
import { getPlaces } from '../services/places';

export default function HomePage() {
  const { data, loading, error } = useApi(getPlaces);
  const places = data?.places || [];

  return (
    <>
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Portrait sonore des lieux</p>
          <h1>Choisir un endroit qui sonne juste.</h1>
          <p className="hero-copy">Consultez l’ambiance actuelle avant de vous déplacer, sans transformer des décibels en devinettes.</p>
          <Link className="btn btn-primary" to="/carte">Explorer la carte</Link>
        </div>
        <div className="hero-meter" aria-label="Échelle des ambiances">
          <span className="meter-calm">Calme</span>
          <span className="meter-moderate">Modéré</span>
          <span className="meter-animated">Animé</span>
        </div>
      </section>

      <section className="mt-5" aria-labelledby="places-title">
        <div className="section-heading">
          <div><p className="eyebrow">En un coup d’œil</p><h2 id="places-title">Lieux observés</h2></div>
          <Link to="/carte">Tout voir sur la carte</Link>
        </div>
        <AsyncState loading={loading} error={error} empty={!loading && !error && places.length === 0} emptyMessage="Aucun lieu n’est encore configuré.">
          <div className="places-grid">{places.map((place) => <PlaceSummary key={place.id} place={place} />)}</div>
        </AsyncState>
      </section>
    </>
  );
}
