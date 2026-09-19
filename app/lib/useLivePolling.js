'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Runs `load` immediately, then every `intervalMs` — and, critically, also
 * the moment the tab regains focus or visibility. Browsers throttle
 * setInterval in backgrounded tabs, so relying on the timer alone means a
 * dashboard left open in another tab for a while can silently show data
 * that's far staler than the interval suggests, with nothing on screen to
 * indicate it. Returns `lastFetchedAt` so the page can show a plain "last
 * updated" timestamp instead of asking the viewer to just trust it.
 *
 * Pass `enabled: false` to stop polling entirely (used for closed historical
 * days, which can't change and don't need refreshing).
 */
export function useLivePolling(load, { intervalMs = 30000, enabled = true, deps = [] } = {}) {
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    async function run() {
      await loadRef.current();
      if (!cancelled) setLastFetchedAt(new Date());
    }

    run();
    const timer = setInterval(run, intervalMs);
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);

  return lastFetchedAt;
}
