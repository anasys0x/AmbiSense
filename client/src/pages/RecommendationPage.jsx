import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import AmbianceBadge from '../components/AmbianceBadge';
import AsyncState from '../components/AsyncState';
import { getRecommendations } from '../services/recommendations';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export default function RecommendationPage() {
  const [ambiance, setAmbiance] = useState('calm');
  const [hour, setHour] = useState(String(new Date().getHours()));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await getRecommendations(ambiance, Number(hour));
      setResults(response);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="recommendation-page">
      <div className="section-heading recommendation-heading">
        <div>
          <p className="eyebrow">Planifier une visite</p>
          <h1>Trouver le bon lieu</h1>
          <p className="recommendation-intro">
            Choisissez une ambiance et une heure. AmbiSense compare les moyennes historiques
            enregistrées à cette heure pour proposer les lieux les plus adaptés.
          </p>
        </div>
      </div>

      <form className="recommendation-form" onSubmit={handleSubmit}>
        <div>
          <label className="form-label" htmlFor="desired-ambiance">Ambiance recherchée</label>
          <select
            className="form-select"
            id="desired-ambiance"
            value={ambiance}
            onChange={(event) => setAmbiance(event.target.value)}
          >
            <option value="calm">Calme</option>
            <option value="moderate">Modérée</option>
            <option value="animated">Animée</option>
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="planned-hour">Heure prévue</label>
          <select
            className="form-select"
            id="planned-hour"
            value={hour}
            onChange={(event) => setHour(event.target.value)}
          >
            {HOURS.map((value) => (
              <option key={value} value={value}>{String(value).padStart(2, '0')} h</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Recherche…' : 'Chercher'}
        </button>
      </form>

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
    </section>
  );
}
