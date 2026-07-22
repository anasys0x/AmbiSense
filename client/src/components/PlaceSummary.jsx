import React from 'react';
import { Link } from 'react-router-dom';

import AmbianceBadge from './AmbianceBadge';
import useAmbianceStream from '../hooks/useAmbianceStream';
import useLivePulse from '../hooks/useLivePulse';

export default function PlaceSummary({ place }) {
  const live = useAmbianceStream(place.locationKey || place.name);
  const isLive = useLivePulse(live);
  const classification = live
    ? { code: live.code, label: live.label, isRecent: true }
    : place.ambiance?.classification;
  const value = live?.value ?? place.ambiance?.value;

  return (
    <article className={`place-card ${isLive ? 'place-card-live' : ''}`}>
      <div>
        <div className="place-card-kicker">
          <p className="eyebrow">Lieu suivi</p>
          {isLive && <span className="place-live-status" aria-live="polite">● LIVE</span>}
        </div>
        <h2 className="h5 mb-2">{place.name}</h2>
        <AmbianceBadge classification={classification} />
      </div>
      <div className="place-reading">
        {value !== undefined ? <><strong>{value}</strong><span>dB</span></> : <span>Pas encore de mesure</span>}
      </div>
      <Link className="stretched-link" to={`/lieux/${place.slug}`} aria-label={`Voir le portrait de ${place.name}`} />
    </article>
  );
}
