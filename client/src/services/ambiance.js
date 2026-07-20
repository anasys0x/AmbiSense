import { apiRequest } from './api';

export function getHistory(location, last) {
  const query = last ? `?last=${encodeURIComponent(last)}` : '';
  return apiRequest(`/ambiance/${encodeURIComponent(location)}/history${query}`);
}

export function getQuietHours(location) {
  return apiRequest(`/ambiance/${encodeURIComponent(location)}/quiet-hours`);
}
