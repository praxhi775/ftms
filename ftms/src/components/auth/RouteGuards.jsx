import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import FullScreenMessage from './FullScreenMessage';
import BlockedScreen from './BlockedScreen';

// Login / register pages: logged-in people are sent on to their own area
export function PublicOnly({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenMessage>Loading…</FullScreenMessage>;
  if (user) {
    const from = location.state?.from;
    return <Navigate to={isAdmin ? '/admin' : from || '/'} replace />;
  }
  return children;
}

// The squad app: active managers only
export function RequireManager({ children }) {
  const { user, isAdmin, loading, blocked, dbReady, error } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenMessage>Loading…</FullScreenMessage>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (blocked) return <BlockedScreen />;
  if (!dbReady) {
    return <FullScreenMessage>{error || 'Preparing your data…'}</FullScreenMessage>;
  }
  return children;
}

// The admin area: the admin account only
export function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenMessage>Loading…</FullScreenMessage>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
