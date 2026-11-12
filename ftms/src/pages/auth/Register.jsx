import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { friendlyAuthError } from '../../firebase/authErrors';
import { AuthShell, AuthField, AuthError, AuthLink } from './AuthLayout';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Register | FTMS';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ name, email, password });
      // the route guard moves you on once your account is created
    } catch (err) {
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up to get started. You can start right away."
      footer={
        <>
          Already registered? <AuthLink to="/login">Log in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <AuthError message={error} />
        <AuthField id="reg-name" label="Full name" value={name} onChange={setName} autoComplete="name" placeholder="Alex Morgan" />
        <AuthField id="reg-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" />
        <AuthField id="reg-password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={6} hint="At least 6 characters" />
        <AuthField id="reg-confirm" label="Confirm password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={6} />
        <button type="submit" className="auth-btn-primary" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
