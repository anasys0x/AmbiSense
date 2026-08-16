import { apiRequest } from './api';

const PUBLIC_DATA_TTL = 30_000;

export function getRecommendations(ambiance, hour, options = {}) {
  const params = new URLSearchParams({ ambiance, hour: String(hour) });
  return apiRequest(`/recommendations?${params.toString()}`, {
    cacheTtl: PUBLIC_DATA_TTL,
    ...options
  });
}
