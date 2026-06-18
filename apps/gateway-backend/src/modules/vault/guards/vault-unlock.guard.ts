import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../../common/types/auth.types';
import { VaultKeyCacheService } from '../vault-key-cache.service';

const VAULT_LOCKED_MESSAGE = 'Vault is locked';

@Injectable()
export class VaultUnlockGuard implements CanActivate {
  constructor(private readonly vaultKeyCache: VaultKeyCacheService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!this.vaultKeyCache.isUnlocked(request.user.userId)) {
      throw new UnauthorizedException(VAULT_LOCKED_MESSAGE);
    }

    return true;
  }
}
