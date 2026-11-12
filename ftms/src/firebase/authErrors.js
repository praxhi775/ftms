// Turns Firebase error codes into messages a manager can understand
const MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/missing-password': 'Please enter your password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Network problem. Check your connection and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled for this project yet.',
  'permission-denied': 'You do not have permission to do that.',
};

export function friendlyAuthError(error) {
  const code = error?.code || '';
  return MESSAGES[code] || error?.message || 'Something went wrong. Please try again.';
}
