import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AsyncState from '../components/AsyncState';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { getFavorites, getMyObservations, removeFavorite } from '../services/account';

const VALUE_LABELS = {
  calme: 'Calme',
  moderee: 'Modérée',
  animee: 'Animée',
  focused: 'Concentrée',
  busy: 'Animée',
  proche: 'Proche',
  moyenne: 'À moyenne distance',
  lointaine: 'Lointaine',
  near: 'Proche',
  far: 'Lointaine'
};

function observationTime(observation) {
  const value = new Date(observation.receivedAt || observation.timestamp).getTime();
  return Number.isNaN(value) ? 0 : value;
}

export function sortObservations(observations) {
  return [...observations].sort((first, second) => (
    observationTime(second) - observationTime(first)
  ));
}

export function getVisitedPlaces(observations) {
  const places = new Map();
  for (const observation of observations) {
    const location = observation.location?.trim();
    const normalizedLocation = location?.toLocaleLowerCase('fr-CA');
    if (normalizedLocation && !places.has(normalizedLocation)) {
      places.set(normalizedLocation, location);
    }
  }
  return [...places.values()];
}

function formatValue(value) {
  if (!value) return 'Non précisée';
  return VALUE_LABELS[value] || value.replaceAll('_', ' ');
}

function formatDate(observation) {
  const date = new Date(observation.receivedAt || observation.timestamp);
  return Number.isNaN(date.getTime()) ? 'Date inconnue' : date.toLocaleString('fr-CA');
}

export default function AccountPage() {
  const { user, token, logout } = useAuth();
  const observationsRequest = useApi(getMyObservations, token);
  const favoritesRequest = useApi(getFavorites, token);
  const [pageError, setPageError] = useState('');
  const [removingFavoriteId, setRemovingFavoriteId] = useState(null);
  const navigate = useNavigate();
  const observations = useMemo(() => (
    sortObservations(observationsRequest.data?.observations || [])
  ), [observationsRequest.data]);
  const visitedPlaces = useMemo(() => getVisitedPlaces(observations), [observations]);
  const favorites = favoritesRequest.data?.favorites || [];

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (requestError) {
      setPageError(requestError.message);
    }
  }

  async function handleRemoveFavorite(placeId) {
    setPageError('');
    setRemovingFavoriteId(placeId);
    try {
      await removeFavorite(placeId, token);
      favoritesRequest.reload();
    } catch (requestError) {
      setPageError(requestError.message);
    } finally {
      setRemovingFavoriteId(null);
    }
  }

  return (
    <section>
      <p className="eyebrow">Espace compte</p>
      <h1>Bonjour, {user.name}</h1>
      {pageError && <div className="alert alert-danger" role="alert">{pageError}</div>}
      <div className="account-grid">
        <article className="account-card"><h2>Identité</h2><p><strong>Nom</strong><br />{user.name}</p><p><strong>Courriel</strong><br />{user.email}</p></article>
        <article className="account-card"><h2>Contribuer</h2><p>Partagez ce que vous entendez dans un lieu suivi.</p><Link className="btn btn-primary" to="/observations/nouvelle">Ajouter une observation</Link></article>
      </div>

      <section className="account-section" aria-label="Lieux favoris">
        <div className="section-heading">
          <div><p className="eyebrow">À retrouver facilement</p><h2>Mes lieux favoris</h2></div>
          {!favoritesRequest.loading && !favoritesRequest.error && <span>{favorites.length} lieu{favorites.length === 1 ? '' : 'x'}</span>}
        </div>
        <AsyncState
          loading={favoritesRequest.loading}
          error={favoritesRequest.error}
          empty={!favoritesRequest.loading && !favoritesRequest.error && favorites.length === 0}
          emptyMessage="Vous n’avez pas encore de lieu favori."
        >
          <div className="favorite-grid">
            {favorites.map((favorite) => (
              <article className="favorite-card" key={favorite.id}>
                <div>
                  <h3>{favorite.name}</h3>
                  <Link to={`/lieux/${favorite.slug}`}>Voir le portrait</Link>
                </div>
                <button
                  className="btn btn-outline-danger btn-sm"
                  type="button"
                  disabled={removingFavoriteId === favorite.id}
                  onClick={() => handleRemoveFavorite(favorite.id)}
                >
                  {removingFavoriteId === favorite.id ? 'Retrait…' : 'Retirer'}
                </button>
              </article>
            ))}
          </div>
        </AsyncState>
      </section>

      <section className="account-section" aria-label="Contributions et lieux visités">
        <div className="section-heading">
          <div><p className="eyebrow">Votre activité</p><h2>Contributions et lieux visités</h2></div>
          {!observationsRequest.loading && !observationsRequest.error && <span>{observations.length} contribution{observations.length === 1 ? '' : 's'}</span>}
        </div>
        <AsyncState
          loading={observationsRequest.loading}
          error={observationsRequest.error}
          empty={!observationsRequest.loading && !observationsRequest.error && observations.length === 0}
          emptyMessage="Vous n’avez pas encore soumis d’observation."
        >
          <div>
            <section className="visited-block" aria-label="Lieux visités">
              <h3>Lieux visités</h3>
              <ul className="visited-list">
                {visitedPlaces.map((location) => <li key={location.toLocaleLowerCase('fr-CA')}>{location}</li>)}
              </ul>
            </section>
            <div className="contribution-list">
              {observations.map((observation, index) => (
                <article
                  className="contribution-card"
                  key={observation._id || `${observation.location}-${observation.receivedAt || observation.timestamp}-${index}`}
                >
                  <div className="contribution-heading">
                    <h3>{observation.location}</h3>
                    <time>{formatDate(observation)}</time>
                  </div>
                  <dl className="contribution-details">
                    <div><dt>Impression</dt><dd>{formatValue(observation.vibe)}</dd></div>
                    <div><dt>Proximité</dt><dd>{formatValue(observation.proximity)}</dd></div>
                    <div className="contribution-note"><dt>Note</dt><dd>{observation.notes || 'Aucune note'}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </AsyncState>
      </section>

      <button className="btn btn-outline-danger mt-4" onClick={handleLogout}>Se déconnecter</button>
    </section>
  );
}
