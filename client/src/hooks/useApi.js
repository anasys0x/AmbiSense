import { useCallback, useEffect, useState } from 'react';

export default function useApi(apiFunction, param) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const requestOptions = { forceRefresh: reloadKey > 0 };
    const request = param === undefined
      ? apiFunction(requestOptions)
      : apiFunction(param, requestOptions);

    request
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiFunction, param, reloadKey]);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);
  return { data, loading, error, reload };
}
