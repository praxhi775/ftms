import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../firebase/client';
import { friendlyAuthError } from '../../firebase/authErrors';
import { AuthShell, AuthField, AuthError, AuthLink } from './AuthLayout';

// Landing page for the link in the password reset email.
// Firebase adds ?mode=resetPassword&oobCode=... to the URL. To send people here instead of
// Firebase's own page, set the template's action URL (see README note) to <site>/reset-password.
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const code = searchParams.get('oobCode');

  // 'checking' | 'ready' | 'invalid' | 'done'
  const [status, setStatus] = useState(code && (!mode || mode === 'resetPassword') ? 'checking' : 'invalid');
  const [accountEmail, setAccountEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Choose a new password | FTMS';
  }, []);

  // check the link before showing the form, so an expired or used link is explained straight away
  useEffect(() => {
    if (status !== 'checking') return undefined;
    let cancelled = false;
    verifyPasswordResetCode(auth, code)
      .then((email) => {
        if (cancelled) return;
        setAccountEmail(email);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(friendlyAuthError(err));
        setStatus('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [status, code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password is too weak. Use at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, code, password);
      setStatus('done');
    } catch (err) {
      const expired = err?.code === 'auth/expired-action-code' || err?.code === 'auth/invalid-action-code';
      setError(friendlyAuthError(err));
      if (expired) setStatus('invalid');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'checking') {
    return (
      <AuthShell title="Choose a new password" subtitle="Checking your reset link…">
        <div className="auth-success" role="status">One moment…</div>
      </AuthShell>
    );
  }

  if (status === 'invalid') {
    return (
      <AuthShell
        title="Link not valid"
        subtitle="This password reset link can't be used."
        footer={<AuthLink to="/login">Back to log in</AuthLink>}
      >
        <AuthError message={error || 'This reset link is invalid or has expired. Please request a new one.'} />
        <p className="auth-footer">
          <AuthLink to="/forgot-password">Request a new reset link</AuthLink>
        </p>
      </AuthShell>
    );
  }

  if (status === 'done') {
    return (
      <AuthShell
        title="Password updated"
        subtitle="You can now log in with your new password."
        footer={<AuthLink to="/login?reset=success">Go to log in</AuthLink>}
      >
        <div className="auth-success" role="status">
          Your password for <strong>{accountEmail}</strong> has been changed.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={`Setting a new password for ${accountEmail}.`}
      footer={<AuthLink to="/login">Back to log in</AuthLink>}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <AuthError message={error} />
        <AuthField id="new-password" label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={6} hint="At least 6 characters" />
        <AuthField id="confirm-new-password" label="Confirm new password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={6} />
        <button type="submit" className="auth-btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthShell>
  );
}
