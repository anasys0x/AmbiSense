import React, { useCallback, useState } from 'react';

import AsyncState from './AsyncState';
import HistoryChart from './HistoryChart';
import useApi from '../hooks/useApi';
import { getHistory } from '../services/ambiance';

// Choix de periodes pour l'historique (en heures, le format attendu par ?last=)
const PERIODS = [
  { last: '3', label: '3 h' },
  { last: '24', label: '24 h' },
  { last: '48', label: '48 h' },
  { last: '', label: 'Tout' }
];

export default function HistoryPanel({ location }) {
  const [last, setLast] = useState('24');
  const fetchHistory = useCallback((place) => getHistory(place, last), [last]);
  const { data, loading, error } = useApi(fetchHistory, location);

  // Un 404 veut juste dire qu'il n'y a aucune mesure sur la periode choisie :
  // on affiche l'etat vide plutot qu'un message d'erreur
  const noData = error?.status === 404 || data?.meta?.count === 0;

  return (
    <section className="portrait-section">
      <div className="section-heading">
        <h2>Historique</h2>
        <div className="period-picker" role="group" aria-label="Période de l'historique">
          {PERIODS.map((period) => (
            <button
              key={period.label}
              type="button"
              className={`btn btn-sm ${last === period.last ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setLast(period.last)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      <AsyncState
        loading={loading}
        error={noData ? null : error}
        empty={noData}
        emptyMessage="Aucune mesure sur cette période."
      >
        {data && !noData && (
          <>
            <HistoryChart measurements={data.slices || data.data} meta={data.meta} />
            <p className="text-secondary">
              {data.meta.count} tranche{data.meta.count > 1 ? 's' : ''} horaire{data.meta.count > 1 ? 's' : ''},{' '}
              calculée{data.meta.count > 1 ? 's' : ''} à partir de {data.meta.measurementCount} mesure{data.meta.measurementCount > 1 ? 's' : ''}.{' '}
              ({data.meta.scale.calm} : calme,{' '}
              {data.meta.scale.moderate} : modéré, {data.meta.scale.animated} : animé)
            </p>
          </>
        )}
      </AsyncState>
    </section>
  );
}
