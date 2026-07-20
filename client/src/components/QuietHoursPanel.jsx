import React from 'react';

import AsyncState from './AsyncState';
import QuietHours from './QuietHours';
import useApi from '../hooks/useApi';
import { getQuietHours } from '../services/ambiance';

export default function QuietHoursPanel({ location }) {
  const { data, loading, error } = useApi(getQuietHours, location);

  // Un 404 veut juste dire qu'il n'y a pas encore de mesures pour ce lieu :
  // on affiche l'etat vide plutot qu'un message d'erreur
  const noData = error?.status === 404;

  return (
    <section className="portrait-section">
      <div className="section-heading">
        <h2>Créneaux calmes</h2>
      </div>
      <AsyncState
        loading={loading}
        error={noData ? null : error}
        empty={noData}
        emptyMessage="Pas assez de mesures pour identifier les créneaux calmes de ce lieu."
      >
        {data && <QuietHours hours={data.data} meta={data.meta} />}
      </AsyncState>
    </section>
  );
}
