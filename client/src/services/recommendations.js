import { apiRequest } from './api';

export function getRecommendations(ambiance, hour) {
  const params = new URLSearchParams({ ambiance, hour: String(hour) });
  return apiRequest(`/recommendations?${params.toString()}`);
}
