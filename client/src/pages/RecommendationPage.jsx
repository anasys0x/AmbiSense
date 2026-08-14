import React from 'react';

import RecommendationForm from '../components/RecommendationForm';
import RecommendationResults from '../components/RecommendationResults';
import useRecommendations from '../hooks/useRecommendations';

export default function RecommendationPage() {
  const recommendation = useRecommendations();

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

      <RecommendationForm
        ambiance={recommendation.ambiance}
        hour={recommendation.hour}
        loading={recommendation.loading}
        onAmbianceChange={recommendation.setAmbiance}
        onHourChange={recommendation.setHour}
        onSubmit={recommendation.search}
      />
      <RecommendationResults
        error={recommendation.error}
        hour={recommendation.hour}
        loading={recommendation.loading}
        results={recommendation.results}
      />
    </section>
  );
}
