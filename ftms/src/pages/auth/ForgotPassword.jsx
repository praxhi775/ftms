import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { friendlyAuthError } from '../../firebase/authErrors';
import { AuthShell, AuthField, AuthError, AuthLink } from './AuthLayout';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const queryEmail = searchParams.get('email');
  const stateEmail = location.state?.email;
  const sessionEmail = sessionStorage.getItem('ftms_last_login_email');

  // The email of the user who was trying to log in (if any)
  const initialAttemptedEmail = (queryEmail || stateEmail || sessionEmail || '').trim();

  const [attemptedEmail, setAttemptedEmail] = useState(initialAttemptedEmail);
  const [manualEmail, setManualEmail] = useState('');
  const [error, setError] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [manualMode, setManualMode] = useState(!initialAttemptedEmail);

  const autoSendTriggeredRef = useRef(false);

  useEffect(() => {
    document.title = 'Reset password | FTMS';
  }, []);

  // When an email exists for the user who was trying to log in, send the link automatically
  useEffect(() => {
    if (!attemptedEmail || manualMode || autoSendTriggeredRef.current) return;
    autoSendTriggeredRef.current = true;

    let cancelled = false;
    setSending(true);
    setError('');

    resetPassword(attemptedEmail)
      .then(() => {
        if (!cancelled) {
          setSentEmail(attemptedEmail);
          setSending(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setSending(false);
        if (err?.code === 'auth/user-not-found') {
          // If the account doesn't exist, ask for the email ID
          setError(`No account found for "${attemptedEmail}". Please enter the email ID you want the reset password link to be sent to.`);
          setManualMode(true);
        } else {
          setError(friendlyAuthError(err));
          setManualMode(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attemptedEmail, manualMode, resetPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = manualEmail.trim();
    if (!clean) {
      setError('Please enter your email ID.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await resetPassword(clean);
      setSentEmail(clean);
    } catch (err) {
      if (err?.code === 'auth/user-not-found') {
        setError(`No account found for "${clean}". Please check the spelling or enter a different email ID.`);
      } else {
        setError(friendlyAuthError(err));
      }
    } finally {
      setSending(false);
    }
  };

  const handleUseDifferentEmail = () => {
    sessionStorage.removeItem('ftms_last_login_email');
    setAttemptedEmail('');
    setSentEmail('');
    setManualEmail('');
    setError('');
    setManualMode(true);
  };

  // State 1: Reset link was sent successfully
  if (sentEmail) {
    return (
      <AuthShell
        title="Reset link sent"
        subtitle={`Password reset instructions have been sent to ${sentEmail}.`}
        footer={<AuthLink to="/login">Back to log in</AuthLink>}
      >
        <div className="auth-success" role="status">
          A password reset link is on its way to <strong>{sentEmail}</strong>.
          <br />
          Check your inbox (and spam folder). The link works once and expires after about an hour.
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to="/login"
              className="auth-btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Back to log in
            </Link>
            <button
              type="button"
              className="auth-btn-secondary"
              onClick={handleUseDifferentEmail}
            >
              Use a different email
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  // State 2: Automatically sending reset link for the user who was trying to log in
  if (sending && !manualMode) {
    return (
      <AuthShell
        title="Resetting password"
        subtitle={`Sending password reset link to ${attemptedEmail}…`}
        footer={<AuthLink to="/login">Back to log in</AuthLink>}
      >
        <div className="auth-success" role="status">
          Sending password reset link to <strong>{attemptedEmail}</strong>…
        </div>
      </AuthShell>
    );
  }

  // State 3: Email didn't exist or account was not found -> ask for the email ID
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Which email ID do you want the reset password link to be sent to?"
      footer={<AuthLink to="/login">Back to log in</AuthLink>}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <AuthError message={error} />
        <AuthField
          id="reset-email"
          label="Email ID"
          type="email"
          value={manualEmail}
          onChange={setManualEmail}
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <button type="submit" className="auth-btn-primary" disabled={sending}>
          {sending ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  );
}
