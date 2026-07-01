import { isReAuthRequiredError } from './auth-error.util';
import { extractHttpErrorMessage } from './http-error.util';

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
