import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Pages that already render their own back button
const HIDDEN_ON = ['/', '/teams', '/team-generator'];

// Where to go when there is no in-app history (e.g. page opened directly / refreshed)
function getFallbackPath(pathname) {
  if (pathname.startsWith('/players/')) return '/players';
  if (pathname.startsWith('/matches/')) return '/matches';
  return '/';
}

export default function BackButton() {
  const navigate = useNavigate();
  const { pathname, key } = useLocation();

  if (HIDDEN_ON.includes(pathname)) return null;

  const handleBack = () => {
    // location.key === 'default' means this is the first entry in the app's history
    if (key !== 'default') {
      navigate(-1);
    } else {
      navigate(getFallbackPath(pathname), { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="global-back-btn"
      aria-label="Go back"
    >
      <ArrowLeft size={16} strokeWidth={2.4} />
     
    </button>
  );
}