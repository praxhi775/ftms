import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { friendlyAuthError } from '../../firebase/authErrors';
import AppLogo from '../../components/common/AppLogo';
import { AuthError, AuthLink } from './AuthLayout';
import LoginPitch from './LoginPitch';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Log in | FTMS';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      // the route guard moves you on once your account is loaded
    } catch (err) {
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="login-split">
      {/* Left: brand and message (hidden on small screens) */}
      <aside className="login-hero">
        <div className="login-brand">
          <AppLogo size={44} className="login-logo" />
          <span className="login-brand-name">FTMS</span>
        </div>

        <div className="login-hero-copy">
          <h2 className="login-hero-title">
            <span className="login-hero-line">Manage your team.</span>{' '}
            <span className="login-hero-line">Own the game.</span>
          </h2>
          <p className="login-hero-text">
            Your squad, matchday plans and performance — all in one place.
          </p>
        </div>

        {/* sits in the space between the message and the footer, so it never overlaps either */}
        <div className="login-visual">
          <LoginPitch />
        </div>

        <p className="login-hero-footer">FOOTBALL TEAM MANAGEMENT SYSTEM</p>
      </aside>

      {/* Right: the login form */}
      <main className="login-main">
        <div className="login-mobile-brand">
          <AppLogo size={44} className="login-logo" />
          <span className="login-brand-name login-brand-name-dark">FTMS</span>
        </div>

        <section className="login-card" aria-labelledby="login-heading">
          <p className="login-eyebrow">MANAGER ACCESS</p>
          <h1 id="login-heading" className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to manage your squad.</p>

          <form onSubmit={handleSubmit} className="login-form">
            <AuthError message={error} />

            <div className="login-field">
              <label htmlFor="login-email" className="login-label">Email</label>
              <div className="login-input-wrap">
                <Mail className="login-input-icon" size={17} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password" className="login-label">Password</label>
              <div className="login-input-wrap">
                <Lock className="login-input-icon" size={17} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input login-input-with-toggle"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="login-row-end">
              <AuthLink to="/forgot-password">Forgot password?</AuthLink>
            </div>

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="login-footer-text">
            New here? <AuthLink to="/register">Create an account</AuthLink>
          </p>
        </section>
      </main>
    </div>
  );
}
