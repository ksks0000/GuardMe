const GENERIC_AUTH_FAILURE = 'Invalid username or password.';

/** Maps API errors to safe user-facing messages (no credential or stack leakage). */
export function mapAuthError(error: unknown, context: 'login' | 'register' = 'login'): string {
  const message = error instanceof Error ? error.message : '';

  if (context === 'register' && message.toLowerCase().includes('already exists')) {
    return 'Username is already taken.';
  }

  if (context === 'register' && message.toLowerCase().includes('invalid')) {
    return 'Registration failed. Check your username and password.';
  }

  if (context === 'login') {
    return GENERIC_AUTH_FAILURE;
  }

  return 'Something went wrong. Please try again.';
}

export function mapSessionError(): string {
  return 'Your session has expired. Please sign in again.';
}
