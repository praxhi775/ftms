// Builds absolute links back into this app (works on localhost and on GitHub Pages,
// because import.meta.env.BASE_URL is '/ftms/' in production and '/ftms/' in dev as set in vite.config.js).
export function appUrl(path = '/') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${base}${clean}`;
}

// Settings sent with the password reset email.
// `url` is where the "Continue" button on Firebase's reset page leads after the password is changed.
// The domain must be listed under Firebase Console > Authentication > Settings > Authorized domains.
export function passwordResetSettings() {
  return {
    url: appUrl('/login?reset=success'),
    handleCodeInApp: false,
  };
}
