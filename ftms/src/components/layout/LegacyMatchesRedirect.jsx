import { Navigate, useParams, useLocation } from 'react-router-dom';

// Old links (/matches, /matches/12) keep working and land on the new /sessions pages
export default function LegacyMatchesRedirect() {
  const { id } = useParams();
  const { search } = useLocation();
  return <Navigate to={id ? `/sessions/${id}${search}` : `/sessions${search}`} replace />;
}