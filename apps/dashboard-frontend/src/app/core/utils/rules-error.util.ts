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

export function mapRulesError(error: unknown): string {
  if (isReAuthRequiredError(error)) {
    return 'Re-authentication required. Confirm your password and try again.';
  }

  const message = extractHttpErrorMessage(error);

  if (/invalid rule pattern/i.test(message)) {
    return 'Invalid pattern for the selected rule type.';
  }

  if (/not found/i.test(message)) {
    return 'Firewall rule not found.';
  }

  if (message) {
    return message;
  }

  return 'Rule operation failed. Please try again.';
}
