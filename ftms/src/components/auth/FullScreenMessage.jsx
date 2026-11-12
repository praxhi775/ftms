import AppLogo from '../common/AppLogo';

export default function FullScreenMessage({ children }) {
  return (
    <div className="auth-fullscreen" role="status" aria-live="polite">
      <AppLogo size={56} />
      <p>{children}</p>
    </div>
  );
}
