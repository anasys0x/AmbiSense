import React from 'react';
import { Link, useParams } from 'react-router-dom';

import AmbianceBadge from '../components/AmbianceBadge';
import AsyncState from '../components/AsyncState';
import FavoriteButton from '../components/FavoriteButton';
import HistoryPanel from '../components/HistoryPanel';
import QuietHoursPanel from '../components/QuietHoursPanel';
import useAmbianceStream from '../hooks/useAmbianceStream';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { getPlace } from '../services/places';

export default function PlacePage() {
  const { slug } = useParams();
  const { token } = useAuth();
  const { data, loading, error } = useApi(getPlace, slug);
  // Derniere mesure poussee par le serveur en direct (bonus SSE) :
  // si elle existe, elle prend le dessus sur la valeur chargee au depart
  const live = useAmbianceStream(data?.place?.name);

  return (
    <AsyncState loading={loading} error={error}>
      {data && (
        <section className="portrait-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Portrait d’ambiance</p><h1>{data.place.name}</h1></div>
            <div className="portrait-actions">
              <AmbianceBadge
                classification={live
                  ? { code: live.code, label: live.label, isRecent: true }
                  : data.ambiance?.classification}
              />
              <FavoriteButton place={data.place} token={token} />
            </div>
          </div>
          {!data.ambiance && !live ? (
            <div className="state-card">Aucune mesure n’a encore été reçue pour ce lieu.</div>
          ) : (
            <>
              <div className="current-reading">
                <strong>{live ? live.value : data.ambiance.value}</strong><span>dB</span>
                {live && <span className="live-indicator">● en direct</span>}
              </div>
              {data.ambiance && <p className="lead">{data.ambiance.classification.description}</p>}
              {data.ambiance && (
                <dl className="scale-list">
                  <div><dt>Calme</dt><dd>{data.ambiance.scale.calm}</dd></div>
                  <div><dt>Modéré</dt><dd>{data.ambiance.scale.moderate}</dd></div>
                  <div><dt>Animé</dt><dd>{data.ambiance.scale.animated}</dd></div>
                </dl>
              )}
              <p className="text-secondary">
                Dernière mesure : {new Date(live ? live.timestamp : data.ambiance.timestamp).toLocaleString('fr-CA')}
              </p>
            </>
          )}
          <HistoryPanel location={data.place.name} />
          <QuietHoursPanel location={data.place.name} />
          <Link to="/carte">← Retour à la carte</Link>
        </section>
      )}
    </AsyncState>
  );
}
