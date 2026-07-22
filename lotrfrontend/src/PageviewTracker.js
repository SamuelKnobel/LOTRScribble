import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview } from './analytics';

// Pages that report their own, finer-grained views (one per tab) so a single
// screen is never counted twice. See BaseData / GameState.
const SELF_TRACKED = new Set(['/', '/gamestate']);

const normalize = (p) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p);

// Renders nothing; only this component re-renders on navigation, so the rest
// of the app (and the QueryClient) is untouched.
export default function PageviewTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = normalize(location.pathname);
    if (SELF_TRACKED.has(path)) return;
    trackPageview(path, document.title);
  }, [location.pathname]);

  return null;
}
