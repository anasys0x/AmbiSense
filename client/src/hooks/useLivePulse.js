import { useEffect, useState } from 'react';

export default function useLivePulse(live, duration = 12000) {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!live) return undefined;

    setIsLive(true);
    const timeout = setTimeout(() => setIsLive(false), duration);
    return () => clearTimeout(timeout);
  }, [duration, live]);

  return isLive;
}
