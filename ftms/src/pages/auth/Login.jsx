import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { friendlyAuthError } from '../../firebase/authErrors';
import { AuthShell, AuthField, AuthError, AuthLink } from './AuthLayout';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue."
      footer={
        <>
          New here? <AuthLink to="/register">Create an account</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate={false}>
        <AuthError message={error} />
        <AuthField id="login-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" />
        <AuthField id="login-password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="auth-row-end">
          <AuthLink to="/forgot-password">Forgot password?</AuthLink>
        </div>
        <button type="submit" className="auth-btn-primary" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}
