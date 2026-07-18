import React from 'react';
import { Link } from 'react-router-dom';

import AmbianceBadge from './AmbianceBadge';

export default function PlaceSummary({ place }) {
  return (
    <article className="place-card">
      <div>
        <p className="eyebrow">Lieu suivi</p>
        <h2 className="h5 mb-2">{place.name}</h2>
        <AmbianceBadge classification={place.ambiance?.classification} />
      </div>
      <div className="place-reading">
        {place.ambiance ? <><strong>{place.ambiance.value}</strong><span>dB</span></> : <span>Pas encore de mesure</span>}
      </div>
      <Link className="stretched-link" to={`/lieux/${place.slug}`} aria-label={`Voir le portrait de ${place.name}`} />
    </article>
  );
}
