import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { friendlyAuthError } from '../../firebase/authErrors';
import { AuthShell, AuthField, AuthError, AuthLink } from './AuthLayout';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Reset password | FTMS';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      // do not reveal whether an email is registered
      if (err?.code === 'auth/user-not-found') setSent(true);
      else setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to choose a new password."
      footer={<AuthLink to="/login">Back to log in</AuthLink>}
    >
      {sent ? (
        <div className="auth-success" role="status">
          If an account exists for <strong>{email.trim()}</strong>, a reset link is on its way.
          Check your inbox (and spam folder).
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <AuthError message={error} />
          <AuthField id="reset-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" />
          <button type="submit" className="auth-btn-primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
