import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return argon2.verify(passwordHash, password);
}

let dummyHashPromise: Promise<string> | null = null;

function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword(randomBytes(32).toString('hex'));
  }
  return dummyHashPromise;
}

export async function verifyPasswordTimingSafe(
  password: string,
  passwordHash: string | null | undefined,
): Promise<boolean> {
  if (!passwordHash) {
    const dummy = await getDummyHash();
    await argon2.verify(dummy, password).catch(() => undefined);
    return false;
  }

  return verifyPassword(password, passwordHash);
}
