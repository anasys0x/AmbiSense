import { apiRequest } from './api';

export function getPlaces() {
  return apiRequest('/places');
}

export function getMapPlaces() {
  return apiRequest('/places?preview=true');
}

export function getPlace(slug) {
  return apiRequest(`/places/${encodeURIComponent(slug)}`);
}
