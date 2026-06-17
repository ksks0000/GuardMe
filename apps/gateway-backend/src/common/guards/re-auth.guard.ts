import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { authConfig } from '../../config/auth.config';
import { SIEM_EVENT_TYPES } from '../../config/siem.config';
import { AuthenticatedUser } from '../types/auth.types';
import { SiemService } from '../../modules/siem/siem.service';
import { UsersService } from '../../modules/users/users.service';

const REAUTH_REQUIRED_MESSAGE = 'Re-authentication required';

@Injectable()
export class ReAuthGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly siemService: SiemService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const authUser = request.user;

    if (!authUser) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.usersService.findById(authUser.userId);
    if (!user?.lastAuthAt) {
      this.logReAuthRequired(authUser, null);
      throw new UnauthorizedException(REAUTH_REQUIRED_MESSAGE);
    }

    const timeoutMs = authConfig.reAuthTimeoutMinutes() * 60 * 1000;
    const elapsed = Date.now() - user.lastAuthAt.getTime();

    if (elapsed > timeoutMs) {
      this.logReAuthRequired(authUser, elapsed);
      throw new UnauthorizedException(REAUTH_REQUIRED_MESSAGE);
    }

    return true;
  }

  private logReAuthRequired(
    authUser: AuthenticatedUser,
    elapsedMs: number | null,
  ): void {
    void this.siemService.logSecurityEvent({
      type: SIEM_EVENT_TYPES.REAUTH_REQUIRED,
      message: 'Re-authentication required for sensitive action',
      metadata: {
        userId: authUser.userId,
        username: authUser.username,
        elapsedMs,
        timeoutMinutes: authConfig.reAuthTimeoutMinutes(),
      },
    });
  }
}
