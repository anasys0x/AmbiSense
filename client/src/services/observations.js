import { apiRequest } from './api';

export function createObservation(observation, token) {
  return apiRequest('/observations', {
    method: 'POST',
    token,
    body: observation
  });
}
