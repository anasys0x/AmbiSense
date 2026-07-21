import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { addFavorite, getFavorites, removeFavorite } from '../services/account';

export default function FavoriteButton({ place, token }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setIsFavorite(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    setFeedback('');
    getFavorites(token)
      .then(({ favorites }) => {
        if (!cancelled) {
          setIsFavorite(favorites.some((favorite) => favorite.id === place.id));
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [place.id, token]);

  async function handleFavorite() {
    setSubmitting(true);
    setError('');
    setFeedback('');
    try {
      const result = isFavorite
        ? await removeFavorite(place.id, token)
        : await addFavorite(place.id, token);
      const nextValue = result.favorites.some((favorite) => favorite.id === place.id);
      setIsFavorite(nextValue);
      setFeedback(nextValue ? 'Lieu ajouté aux favoris.' : 'Lieu retiré des favoris.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Link
        className="btn btn-outline-primary btn-sm"
        to="/connexion"
        state={{ from: `/lieux/${place.slug}` }}
      >
        Se connecter pour ajouter aux favoris
      </Link>
    );
  }

  if (loading) {
    return <button className="btn btn-outline-primary btn-sm" disabled>Vérification du favori…</button>;
  }

  return (
    <div className="favorite-action">
      <button
        className={isFavorite ? 'btn btn-primary btn-sm' : 'btn btn-outline-primary btn-sm'}
        type="button"
        aria-pressed={isFavorite}
        disabled={submitting}
        onClick={handleFavorite}
      >
        {submitting
          ? 'Enregistrement…'
          : isFavorite ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'}
      </button>
      {feedback && <small className="text-success" role="status">{feedback}</small>}
      {error && <small className="text-danger" role="alert">{error}</small>}
    </div>
  );
}
