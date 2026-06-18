import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { vaultConfig } from '../../config/vault.config';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

@Injectable()
export class CryptoService {
  generateKdfSalt(): string {
    return randomBytes(32).toString('base64');
  }

  async deriveVaultKey(password: string, kdfSaltBase64: string): Promise<Buffer> {
    const salt = Buffer.from(kdfSaltBase64, 'base64');
    const key = await argon2.hash(password, {
      type: argon2.argon2id,
      salt,
      hashLength: vaultConfig.keyLengthBytes(),
      raw: true,
      memoryCost: vaultConfig.kdfMemoryCost(),
      timeCost: vaultConfig.kdfTimeCost(),
      parallelism: 1,
    });

    return Buffer.from(key);
  }

  encrypt(plaintext: string, key: Buffer): EncryptedPayload {
    const iv = randomBytes(vaultConfig.ivLengthBytes());
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
    };
  }

  decrypt(payload: EncryptedPayload, key: Buffer): string {
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
