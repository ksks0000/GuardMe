import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { authConfig } from '../../../config/auth.config';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../../common/types/auth.types';
import { SessionsService } from '../../sessions/sessions.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          request?.cookies?.[authConfig.cookieName()] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: authConfig.jwtSecret(),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<AuthenticatedUser> {
    const session = await this.sessionsService.findActiveByJwtId(payload.jti);
    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    const { fingerprintMatched } =
      await this.sessionsService.verifySessionForRequest(session, req);

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.sessionsService.touchLastVerifiedAt(session.id);

    return {
      userId: user.id,
      sessionId: session.id,
      jwtId: payload.jti,
      username: user.username,
      fingerprintMatched,
    };
  }
}
