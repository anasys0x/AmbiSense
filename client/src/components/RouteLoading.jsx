import React from 'react';

export default function RouteLoading() {
  return (
    <div className="state-card route-loading" role="status" aria-live="polite">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>Chargement de la page…</span>
    </div>
  );
}
