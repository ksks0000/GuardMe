export const VAULT_GENERATED_PASSWORD_LENGTH = 16;

const CHARSET_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARSET_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const CHARSET_NUMBERS = '0123456789';
const CHARSET_SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';

const VAULT_PASSWORD_CHARSETS = [
  CHARSET_UPPER,
  CHARSET_LOWER,
  CHARSET_NUMBERS,
  CHARSET_SYMBOLS,
] as const;

const VAULT_PASSWORD_CHARSET = VAULT_PASSWORD_CHARSETS.join('');

export function generateVaultPassword(): string {
  const chars: string[] = [];

  for (const set of VAULT_PASSWORD_CHARSETS) {
    chars.push(pickRandomChar(set));
  }

  while (chars.length < VAULT_GENERATED_PASSWORD_LENGTH) {
    chars.push(pickRandomChar(VAULT_PASSWORD_CHARSET));
  }

  shuffleInPlace(chars);
  return chars.join('');
}

function pickRandomChar(charset: string): string {
  const index = secureRandomInt(charset.length);
  return charset.charAt(index);
}

function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error('max must be a positive integer.');
  }

  const buffer = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / max) * max;

  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return value % max;
}

function shuffleInPlace(items: string[]): void {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomInt(index + 1);
    const current = items[index];
    items[index] = items[swapIndex];
    items[swapIndex] = current;
  }
}
