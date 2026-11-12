import { ShieldOff } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import AppLogo from '../common/AppLogo';

export default function BlockedScreen() {
  const { logout, profile } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-card" role="alert">
        <div className="auth-brand">
          <AppLogo size={44} />
          <span className="brand-title">FTMS</span>
        </div>
        <div className="auth-icon-circle auth-icon-danger" aria-hidden="true">
          <ShieldOff size={26} />
        </div>
        <h1 className="auth-title">Your account is blocked</h1>
        <p className="auth-subtitle">
          {profile?.email ? `${profile.email} has been blocked by the admin. ` : ''}
          Please contact the admin to get access again.
        </p>
        <button type="button" className="auth-btn-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
