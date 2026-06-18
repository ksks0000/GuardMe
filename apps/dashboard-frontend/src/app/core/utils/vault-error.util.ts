import { HttpErrorResponse } from '@angular/common/http';
import { isReAuthRequiredError } from './auth-error.util';

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

export function isVaultLockedError(error: unknown): boolean {
  const message = extractHttpErrorMessage(error).toLowerCase();
  return message.includes('vault is locked');
}

export function mapVaultError(error: unknown): string {
  if (isReAuthRequiredError(error)) {
    return 'Re-authentication required. Confirm your password and try again.';
  }

  if (isVaultLockedError(error)) {
    return 'Vault is locked. Unlock with your account password first.';
  }

  const message = extractHttpErrorMessage(error);

  if (/invalid password/i.test(message)) {
    return 'Invalid password.';
  }

  if (/not found/i.test(message)) {
    return 'Vault credential not found.';
  }

  if (message) {
    return message;
  }

  return 'Vault operation failed. Please try again.';
}
