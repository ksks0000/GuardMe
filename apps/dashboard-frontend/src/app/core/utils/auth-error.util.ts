import { HttpErrorResponse } from '@angular/common/http';
import { extractHttpErrorMessage } from './http-error.util';

const GENERIC_AUTH_FAILURE = 'Invalid username or password.';
const GENERIC_VERIFY_PASSWORD_FAILURE = 'Invalid password.';
const VERIFY_PASSWORD_THROTTLE_FAILURE =
  'Too many attempts. Please wait a minute and try again.';

export function mapAuthError(
  error: unknown,
  context: 'login' | 'register' | 'verifyPassword' = 'login',
): string {
  if (context === 'verifyPassword') {
    if (error instanceof HttpErrorResponse && error.status === 429) {
      return VERIFY_PASSWORD_THROTTLE_FAILURE;
    }

    return GENERIC_VERIFY_PASSWORD_FAILURE;
  }

  const message = extractHttpErrorMessage(error);

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
