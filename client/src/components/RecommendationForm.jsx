import React from 'react';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export default function RecommendationForm({
  ambiance,
  hour,
  loading,
  onAmbianceChange,
  onHourChange,
  onSubmit
}) {
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="recommendation-form" onSubmit={handleSubmit}>
      <div>
        <label className="form-label" htmlFor="desired-ambiance">Ambiance recherchée</label>
        <select
          className="form-select"
          id="desired-ambiance"
          value={ambiance}
          onChange={(event) => onAmbianceChange(event.target.value)}
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
          onChange={(event) => onHourChange(event.target.value)}
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
  );
}
