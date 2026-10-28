import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Pages that already render their own back button
const HIDDEN_ON = ['/', '/teams', '/team-generator'];

// The page "above" the current one
function getParentPath(pathname) {
  if (pathname.startsWith('/players/')) return '/players';
  if (pathname.startsWith('/matches/')) return '/matches';
  return '/';
}

export default function BackButton() {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { pathname, key } = useLocation();

  // Remember where we came from and how we got here
  const currentPathRef = useRef(null);
  const arrivalRef = useRef({ from: null, type: 'POP' });

  useEffect(() => {
    arrivalRef.current = { from: currentPathRef.current, type: navigationType };
    currentPathRef.current = pathname;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (HIDDEN_ON.includes(pathname)) return null;

  const handleBack = () => {
    const { from, type } = arrivalRef.current;

    // We arrived by a normal link/click from a different page: that page is the
    // entry right before this one in history, so going back is safe.
    if (type === 'PUSH' && from && from !== pathname) {
      navigate(-1);
      return;
    }

    // Page was opened directly, refreshed, reached by replace (e.g. after deleting
    // something), or via the browser buttons: history can't be trusted, so go to the
    // parent page and replace this entry instead of stacking more routes.
    navigate(getParentPath(pathname), { replace: true });
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