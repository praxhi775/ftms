import { Link } from 'react-router-dom';
import AppLogo from '../../components/common/AppLogo';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <AppLogo size={44} />
          <span className="brand-title">FTMS</span>
        </div>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthField({ id, label, type = 'text', value, onChange, autoComplete, placeholder, hint, minLength, required = true }) {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">{label}</label>
      <input
        id={id}
        className="auth-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        required={required}
      />
      {hint && <span className="auth-hint">{hint}</span>}
    </div>
  );
}

export function AuthError({ message }) {
  if (!message) return null;
  return (
    <div className="auth-error" role="alert">
      {message}
    </div>
  );
}

export function AuthLink({ to, children }) {
  return (
    <Link to={to} className="auth-link">
      {children}
    </Link>
  );
}
