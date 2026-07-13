import { Action } from '@ngrx/store';

const REDACTED = '[REDACTED]';

type ActionRecord = Action & Record<string, unknown>;

/**
 * Strip passwords and credential secrets from actions shown in Store DevTools.
 * Reducers already avoid persisting reveal passwords in state; this covers the
 * action stream itself (login, register, verify-password, vault unlock/create/reveal).
 */
export function sanitizeStoreAction(action: Action): Action {
  const typed = action as ActionRecord;
  const type = typed.type;

  if (type === '[Auth] Login' || type === '[Auth] Register') {
    const credentials = typed['credentials'];
    if (!credentials || typeof credentials !== 'object') {
      return action;
    }
    return {
      ...typed,
      credentials: {
        ...(credentials as Record<string, unknown>),
        password: REDACTED,
      },
    } as Action;
  }

  if (type === '[Auth] Verify Password' || type === '[Vault] Unlock Vault') {
    return { ...typed, password: REDACTED } as Action;
  }

  if (type === '[Vault] Create Credential' || type === '[Vault] Update Credential') {
    const input = typed['input'];
    if (!input || typeof input !== 'object') {
      return action;
    }
    const inputRecord = input as Record<string, unknown>;
    if (inputRecord['password'] === undefined) {
      return action;
    }
    return {
      ...typed,
      input: {
        ...inputRecord,
        password: REDACTED,
      },
    } as Action;
  }

  if (type === '[Vault] Reveal Credential Success') {
    return { ...typed, password: REDACTED } as Action;
  }

  return action;
}
