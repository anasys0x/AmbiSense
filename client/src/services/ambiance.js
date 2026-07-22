import { apiRequest } from './api';

export function getHistory(location, last) {
  const params = new URLSearchParams();
  if (last) params.set('last', last);
  params.set('summary', 'true');

  return apiRequest(`/ambiance/${encodeURIComponent(location)}/history?${params.toString()}`);
}

export function getQuietHours(location) {
  return apiRequest(`/ambiance/${encodeURIComponent(location)}/quiet-hours`);
}
