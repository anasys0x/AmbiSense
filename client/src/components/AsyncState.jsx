import React from 'react';

export default function AsyncState({
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'Aucune donnée disponible.',
  children
}) {
  if (loading) {
    return (
      <div className="state-card" aria-live="polite">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        <span>Chargement…</span>
      </div>
    );
  }

  if (error) {
    return <div className="state-card state-error" role="alert">{error.message}</div>;
  }

  if (empty) {
    return <div className="state-card">{emptyMessage}</div>;
  }

  return children;
}
