import { isReAuthRequiredError } from './auth-error.util';
import { extractHttpErrorMessage } from './http-error.util';

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
