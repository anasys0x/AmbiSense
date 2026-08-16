import { apiRequest } from './api';

const PUBLIC_DATA_TTL = 30_000;

export function getHistory(location, last, options = {}) {
  const params = new URLSearchParams();
  if (last) params.set('last', last);
  params.set('summary', 'true');

  return apiRequest(`/ambiance/${encodeURIComponent(location)}/history?${params.toString()}`, {
    cacheTtl: PUBLIC_DATA_TTL,
    ...options
  });
}

export function getQuietHours(location, options = {}) {
  return apiRequest(`/ambiance/${encodeURIComponent(location)}/quiet-hours`, {
    cacheTtl: PUBLIC_DATA_TTL,
    ...options
  });
}
