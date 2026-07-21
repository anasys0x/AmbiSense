import { apiRequest } from './api';

export function getMyObservations(token) {
  return apiRequest('/users/me/observations', { token });
}

export function getFavorites(token) {
  return apiRequest('/users/me/favorites', { token });
}

export function addFavorite(placeId, token) {
  return apiRequest(`/users/me/favorites/${encodeURIComponent(placeId)}`, {
    method: 'POST',
    token
  });
}

export function removeFavorite(placeId, token) {
  return apiRequest(`/users/me/favorites/${encodeURIComponent(placeId)}`, {
    method: 'DELETE',
    token
  });
}
