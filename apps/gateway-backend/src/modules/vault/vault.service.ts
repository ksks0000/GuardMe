import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { VaultCredential } from '@prisma/client';
import { Request } from 'express';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { verifyPassword } from '../../common/utils/password.util';
import { extractClientIp, extractUserAgent } from '../../common/utils/request-context.util';
import { SIEM_EVENT_TYPES } from '../../config/siem.config';
import { PrismaService } from '../../database/prisma.service';
import { SiemService } from '../siem/siem.service';
import { UsersService } from '../users/users.service';
import { CryptoService } from './crypto.service';
import { CreateVaultCredentialDto } from './dto/create-vault-credential.dto';
import { UpdateVaultCredentialDto } from './dto/update-vault-credential.dto';
import {
  VaultCredentialDetailPayload,
  VaultCredentialSummaryPayload,
  VaultLockResponsePayload,
  VaultStatusPayload,
  VaultUnlockResponsePayload,
} from './dto/vault.payload';
import { VaultKeyCacheService } from './vault-key-cache.service';

const GENERIC_UNLOCK_FAILURE = 'Invalid password';

@Injectable()
export class VaultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly cryptoService: CryptoService,
    private readonly vaultKeyCache: VaultKeyCacheService,
    private readonly siemService: SiemService,
  ) {}

  getStatus(userId: string): VaultStatusPayload {
    return { locked: !this.vaultKeyCache.isUnlocked(userId) };
  }

  async unlock(
    user: AuthenticatedUser,
    password: string,
    req: Request,
  ): Promise<VaultUnlockResponsePayload> {
    const dbUser = await this.usersService.findById(user.userId);
    if (!dbUser) {
      throw new UnauthorizedException(GENERIC_UNLOCK_FAILURE);
    }

    const passwordValid = await verifyPassword(password, dbUser.passwordHash);
    if (!passwordValid) {
      void this.siemService.logSecurityEvent({
        type: SIEM_EVENT_TYPES.VAULT_UNLOCK_FAILURE,
        message: 'Vault unlock failed',
        metadata: {
          userId: user.userId,
          username: user.username,
          clientIp: extractClientIp(req),
          userAgent: extractUserAgent(req),
        },
      });
      throw new UnauthorizedException(GENERIC_UNLOCK_FAILURE);
    }

    const vaultKey = await this.cryptoService.deriveVaultKey(
      password,
      dbUser.kdfSalt,
    );
    this.vaultKeyCache.setKey(user.userId, vaultKey);

    await this.usersService.updateLastAuthAt(user.userId);

    void this.siemService.logSecurityEvent({
      type: SIEM_EVENT_TYPES.VAULT_UNLOCKED,
      message: 'Vault unlocked',
      metadata: {
        userId: user.userId,
        username: user.username,
      },
    });

    return {
      message: 'Vault unlocked',
      locked: false,
    };
  }

  lock(userId: string): VaultLockResponsePayload {
    this.vaultKeyCache.clearKey(userId);

    return {
      message: 'Vault locked',
      locked: true,
    };
  }

  async listCredentials(userId: string): Promise<VaultCredentialSummaryPayload[]> {
    const rows = await this.prisma.vaultCredential.findMany({
      where: { userId },
      orderBy: [{ serviceName: 'asc' }, { updatedAt: 'desc' }],
    });

    return rows.map(toSummaryPayload);
  }

  async getCredential(
    userId: string,
    credentialId: string,
  ): Promise<VaultCredentialDetailPayload> {
    const row = await this.findOwnedCredential(userId, credentialId);
    const vaultKey = this.requireVaultKey(userId);

    let password: string;
    try {
      password = this.cryptoService.decrypt(
        {
          ciphertext: row.encryptedPassword,
          iv: row.iv,
          authTag: row.authTag,
        },
        vaultKey,
      );
    } catch {
      void this.siemService.logSecurityEvent({
        type: SIEM_EVENT_TYPES.VAULT_DECRYPT_FAILURE,
        message: 'Vault credential failed to decrypt',
        userId,
        metadata: { userId, credentialId },
      });
      throw new UnprocessableEntityException(
        'Stored credential could not be decrypted',
      );
    }

    return {
      ...toSummaryPayload(row),
      password,
    };
  }

  async createCredential(
    userId: string,
    dto: CreateVaultCredentialDto,
  ): Promise<VaultCredentialSummaryPayload> {
    const vaultKey = this.requireVaultKey(userId);
    const encrypted = this.cryptoService.encrypt(dto.password, vaultKey);

    const row = await this.prisma.vaultCredential.create({
      data: {
        userId,
        serviceName: dto.serviceName.trim(),
        username: dto.username.trim(),
        encryptedPassword: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      },
    });

    return toSummaryPayload(row);
  }

  async updateCredential(
    userId: string,
    credentialId: string,
    dto: UpdateVaultCredentialDto,
  ): Promise<VaultCredentialSummaryPayload> {
    const existing = await this.findOwnedCredential(userId, credentialId);
    const vaultKey = this.requireVaultKey(userId);

    let encryptedPassword = existing.encryptedPassword;
    let iv = existing.iv;
    let authTag = existing.authTag;

    if (dto.password !== undefined) {
      const encrypted = this.cryptoService.encrypt(dto.password, vaultKey);
      encryptedPassword = encrypted.ciphertext;
      iv = encrypted.iv;
      authTag = encrypted.authTag;
    }

    const row = await this.prisma.vaultCredential.update({
      where: { id: credentialId },
      data: {
        ...(dto.serviceName !== undefined && {
          serviceName: dto.serviceName.trim(),
        }),
        ...(dto.username !== undefined && { username: dto.username.trim() }),
        ...(dto.password !== undefined && {
          encryptedPassword,
          iv,
          authTag,
        }),
      },
    });

    return toSummaryPayload(row);
  }

  async deleteCredential(userId: string, credentialId: string): Promise<void> {
    await this.findOwnedCredential(userId, credentialId);
    await this.prisma.vaultCredential.delete({ where: { id: credentialId } });
  }

  clearVaultKey(userId: string): void {
    this.vaultKeyCache.clearKey(userId);
  }

  private requireVaultKey(userId: string): Buffer {
    const key = this.vaultKeyCache.getKey(userId);
    if (!key) {
      throw new UnauthorizedException('Vault is locked');
    }

    return key;
  }

  private async findOwnedCredential(
    userId: string,
    credentialId: string,
  ): Promise<VaultCredential> {
    const row = await this.prisma.vaultCredential.findFirst({
      where: { id: credentialId, userId },
    });

    if (!row) {
      throw new NotFoundException('Vault credential not found');
    }

    return row;
  }
}

function toSummaryPayload(row: VaultCredential): VaultCredentialSummaryPayload {
  return {
    id: row.id,
    serviceName: row.serviceName,
    username: row.username,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
