import { apiRequest } from './api';

export function createObservation(observation, token) {
  return apiRequest('/observations', {
    method: 'POST',
    token,
    body: observation,
    // Une nouvelle observation peut modifier les apercus publics des lieux.
    invalidatePublicCacheOnSuccess: true
  });
}
