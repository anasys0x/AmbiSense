import React from 'react';

export default function AmbianceBadge({ classification }) {
  if (!classification) {
    return <span className="ambiance-badge ambiance-unknown">Aucune mesure</span>;
  }

  return (
    <span className={`ambiance-badge ambiance-${classification.code}`}>
      {classification.label}
      {!classification.isRecent && <small> · mesure ancienne</small>}
    </span>
  );
}
