import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Pages that already render their own back button
const HIDDEN_ON = ['/', '/teams', '/team-generator'];

// The page "above" the current one
function getParentPath(pathname) {
  if (pathname.startsWith('/players/')) return '/players';
  if (pathname.startsWith('/sessions/')) {
    let tab = null;
    try {
      tab = sessionStorage.getItem('ftms.matchesTab');
    } catch {
      /* storage unavailable: ignore */
    }
    return tab === 'completed' ? '/sessions?tab=completed' : '/sessions';
  }
  return '/';
}

export default function BackButton() {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { pathname, search, key } = useLocation();
  const fullPath = pathname + search;

  // Our own record of the history stack for this visit (one entry per router history entry),
  // so we always know which page is right before the current one, even after going back.
  const historyRef = useRef({ entries: [], index: -1 });

  useEffect(() => {
    const h = historyRef.current;
    const entry = { key, path: fullPath };

    if (navigationType === 'PUSH') {
      h.entries = h.entries.slice(0, h.index + 1);
      h.entries.push(entry);
      h.index = h.entries.length - 1;
    } else if (navigationType === 'REPLACE') {
      if (h.index < 0) {
        h.entries = [entry];
        h.index = 0;
      } else {
        h.entries[h.index] = entry;
      }
    } else {
      // POP: browser back/forward, our own back, or the very first page load
      const idx = h.entries.findIndex((e) => e.key === key);
      if (idx >= 0) {
        h.index = idx;
        h.entries[idx] = entry;
      } else {
        h.entries = [entry];
        h.index = 0;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (HIDDEN_ON.includes(pathname)) return null;

  const handleBack = () => {
    const h = historyRef.current;
    const previous = h.index > 0 ? h.entries[h.index - 1] : null;
    const parent = getParentPath(pathname);

    // A match always goes back to the Matches list on the right tab (Upcoming / Completed),
    // no matter where it was opened from (Dashboard, player profile, a link...).
    if (pathname.startsWith('/sessions/')) {
      if (previous && previous.path === parent) {
        navigate(-1); // came straight from that list: keeps its scroll position
      } else {
        navigate(parent, { replace: true });
      }
      return;
    }

    // There is a different page right before this one in our own record: go back to it.
    if (previous && previous.path !== fullPath) {
      navigate(-1);
      return;
    }

    // Opened directly, refreshed, or the entry before is unknown / the same page (e.g. after a
    // delete): go up to the parent page, replacing this entry so routes don't pile up.
    navigate(parent, { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="global-back-btn"
      aria-label="Go back"
    >
      <ArrowLeft size={16} strokeWidth={2.4} />
      <span>Back</span>
    </button>
  );
}