import { useEffect, useState } from 'react';

import { API_URL } from '../services/api';

/*
Bonus temps reel : on s'abonne au flux SSE du serveur et on retourne la
derniere ambiance recue pour le lieu. La page se met a jour toute seule,
sans rechargement.
 */
export default function useAmbianceStream(location) {
  const [live, setLive] = useState(null);

  useEffect(() => {
    if (!location) {
      return undefined;
    }

    setLive(null);
    const source = new EventSource(
      `${API_URL}/ambiance/stream?location=${encodeURIComponent(location)}`
    );

    source.addEventListener('ambiance', (event) => {
      try {
        setLive(JSON.parse(event.data));
      } catch {
        // evenement illisible, on l'ignore et on attend le prochain
      }
    });

    return () => source.close();
  }, [location]);

  return live;
}
