import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { authConfig } from '../../config/auth.config';
import { AuthenticatedUser } from '../types/auth.types';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class ReAuthGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

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
      throw new UnauthorizedException('Re-authentication required');
    }

    const timeoutMs = authConfig.reAuthTimeoutMinutes() * 60 * 1000;
    const elapsed = Date.now() - user.lastAuthAt.getTime();

    if (elapsed > timeoutMs) {
      throw new UnauthorizedException('Re-authentication required');
    }

    return true;
  }
}
