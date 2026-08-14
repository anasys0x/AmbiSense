import React from 'react';
import { Link } from 'react-router-dom';

import AmbianceBadge from './AmbianceBadge';
import AsyncState from './AsyncState';

export default function RecommendationResults({ error, hour, loading, results }) {
  return (
    <div className="recommendation-results" aria-live="polite">
      <AsyncState
        loading={loading}
        error={error}
        empty={Boolean(results && results.data.length === 0)}
        emptyMessage={`Aucune mesure enregistrée à ${Number(hour)} h ne permet encore une recommandation.`}
      >
        {results?.data?.length > 0 && (
          <>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Résultats historiques</p>
                <h2>Nos recommandations pour {String(results.meta.hour).padStart(2, '0')} h</h2>
              </div>
            </div>
            <ol className="recommendation-list">
              {results.data.map((recommendation) => (
                <li
                  className={`recommendation-card ${recommendation.rank === 1 ? 'recommendation-best' : ''}`}
                  key={recommendation.place.id || recommendation.place.slug}
                >
                  <div className="recommendation-rank">
                    {recommendation.rank === 1 ? 'Meilleur choix' : `Choix ${recommendation.rank}`}
                  </div>
                  <div className="recommendation-card-heading">
                    <div>
                      <h3>{recommendation.place.name}</h3>
                      <p>{recommendation.explanation}</p>
                    </div>
                    <AmbianceBadge classification={recommendation.classification} />
                  </div>
                  <div className="recommendation-evidence">
                    <strong>{recommendation.averageValue} dB</strong>
                    <span>Moyenne fondée sur {recommendation.sampleCount} mesure(s)</span>
                  </div>
                  <Link to={`/lieux/${recommendation.place.slug}`}>Voir le portrait du lieu →</Link>
                </li>
              ))}
            </ol>
          </>
        )}
      </AsyncState>
    </div>
  );
}
