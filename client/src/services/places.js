import { apiRequest } from './api';

// Les mesures en direct continuent d'arriver par SSE. Ce TTL court evite les
// appels repetes pendant la navigation sans conserver longtemps un portrait.
const PUBLIC_DATA_TTL = 30_000;

export function getPlaces(options = {}) {
  return apiRequest('/places', { cacheTtl: PUBLIC_DATA_TTL, ...options });
}

export function getMapPlaces(options = {}) {
  return apiRequest('/places?preview=true', { cacheTtl: PUBLIC_DATA_TTL, ...options });
}

export function getPlace(slug, options = {}) {
  return apiRequest(`/places/${encodeURIComponent(slug)}`, {
    cacheTtl: PUBLIC_DATA_TTL,
    ...options
  });
}
