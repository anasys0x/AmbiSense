import { useCallback, useState } from 'react';

import { getRecommendations } from '../services/recommendations';

export default function useRecommendations(initialHour = new Date().getHours()) {
  const [ambiance, setAmbiance] = useState('calm');
  const [hour, setHour] = useState(String(initialHour));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (
    selectedAmbiance = ambiance,
    selectedHour = Number(hour)
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getRecommendations(selectedAmbiance, selectedHour);
      setResults(response);
      return response;
    } catch (requestError) {
      setError(requestError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [ambiance, hour]);

  return {
    ambiance,
    error,
    hour,
    loading,
    results,
    search,
    setAmbiance,
    setHour
  };
}
