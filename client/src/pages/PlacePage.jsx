import React from 'react';
import { Link, useParams } from 'react-router-dom';

import AmbianceBadge from '../components/AmbianceBadge';
import AsyncState from '../components/AsyncState';
import FavoriteButton from '../components/FavoriteButton';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { getPlace } from '../services/places';

export default function PlacePage() {
  const { slug } = useParams();
  const { token } = useAuth();
  const { data, loading, error } = useApi(getPlace, slug);

  return (
    <AsyncState loading={loading} error={error}>
      {data && (
        <section className="portrait-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Portrait d’ambiance</p><h1>{data.place.name}</h1></div>
            <div className="portrait-actions">
              <AmbianceBadge classification={data.ambiance?.classification} />
              <FavoriteButton place={data.place} token={token} />
            </div>
          </div>
          {!data.ambiance ? (
            <div className="state-card">Aucune mesure n’a encore été reçue pour ce lieu.</div>
          ) : (
            <>
              <div className="current-reading"><strong>{data.ambiance.value}</strong><span>dB</span></div>
              <p className="lead">{data.ambiance.classification.description}</p>
              <dl className="scale-list">
                <div><dt>Calme</dt><dd>{data.ambiance.scale.calm}</dd></div>
                <div><dt>Modéré</dt><dd>{data.ambiance.scale.moderate}</dd></div>
                <div><dt>Animé</dt><dd>{data.ambiance.scale.animated}</dd></div>
              </dl>
              <p className="text-secondary">Dernière mesure : {new Date(data.ambiance.timestamp).toLocaleString('fr-CA')}</p>
            </>
          )}
          <Link to="/carte">← Retour à la carte</Link>
        </section>
      )}
    </AsyncState>
  );
}
