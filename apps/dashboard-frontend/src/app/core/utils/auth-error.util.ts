import { extractHttpErrorMessage } from './http-error.util';

const GENERIC_AUTH_FAILURE = 'Invalid username or password.';
const GENERIC_VERIFY_PASSWORD_FAILURE = 'Invalid password.';

export function mapAuthError(
  error: unknown,
  context: 'login' | 'register' | 'verifyPassword' = 'login',
): string {
  const message = extractHttpErrorMessage(error);

  if (context === 'verifyPassword') {
    return GENERIC_VERIFY_PASSWORD_FAILURE;
  }

  if (context === 'register' && /already (exists|taken)/i.test(message)) {
    return 'Username is already taken.';
  }

  if (context === 'register' && /invalid|must|length|characters/i.test(message)) {
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

export function isReAuthRequiredError(error: unknown): boolean {
  const message = extractHttpErrorMessage(error).toLowerCase();
  return message.includes('re-authentication required');
}

export function isInvalidPasswordError(error: unknown): boolean {
  const message = extractHttpErrorMessage(error).toLowerCase();
  return message.includes('invalid password');
}
