import { HttpErrorResponse } from '@angular/common/http';

const GENERIC_AUTH_FAILURE = 'Invalid username or password.';
const GENERIC_VERIFY_PASSWORD_FAILURE = 'Invalid password.';

function extractHttpErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;

    if (typeof body === 'string' && body.length > 0) {
      return body;
    }

    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message: unknown }).message;

      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message)) {
        return message.filter((part): part is string => typeof part === 'string').join(' ');
      }
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '';
}

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
