import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedUser, JwtPayload } from '../../common/types/auth.types';
import { verifyJwtPayload } from '../../common/utils/jwt.util';
import { extractClientIp, extractUserAgent } from '../../common/utils/request-context.util';
import { verifyPasswordHash, verifyPasswordTimingSafe } from '../../common/utils/password.util';
import { authConfig } from '../../config/auth.config';
import { SIEM_EVENT_TYPES } from '../../config/siem.config';
import { PublicUserProfileDto } from '../users/dto/public-user-profile.dto';
import { SiemService } from '../siem/siem.service';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { VaultKeyCacheService } from '../vault/vault-key-cache.service';
import { ProxyRealmService } from '../proxy/proxy-realm.service';
import { AuthProfileDto } from './dto/auth-profile.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyPasswordResponseDto } from './dto/verify-password-response.dto';
import { WEBSOCKET_INTERNAL_EVENTS } from '../../config/websocket.config';
import { SessionEventPayload } from '../websocket/dto/session-event.payload';

const GENERIC_PASSWORD_FAILURE = 'Invalid password';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly siemService: SiemService,
    private readonly vaultKeyCache: VaultKeyCacheService,
    private readonly proxyRealmService: ProxyRealmService
  ) {}

  async register(dto: RegisterDto): Promise<PublicUserProfileDto> {
    const user = await this.usersService.create({
      username: dto.username,
      password: dto.password
    });
    return this.usersService.toPublicProfile(user);
  }

  async login(
    dto: LoginDto,
    req: Request,
    res: Response
  ): Promise<PublicUserProfileDto> {
    const user = await this.usersService.findByUsername(dto.username);
    const passwordValid = await verifyPasswordTimingSafe(dto.password, user?.passwordHash);
    if (!user || !passwordValid) {
      this.logLoginFailure(
        dto.username,
        user?.id ?? null, 
        req, 
        !user ? 'unknown_user' : 'invalid_password'
      );
      throw new UnauthorizedException('Invalid username or password');
    }

    await this.usersService.updateLastAuthAt(user.id);
    await this.issueSessionCookie(user.id, req, res);
    this.proxyRealmService.rotate();
    this.emitSessionEvent('LOGIN', user.id, user.username);

    return this.usersService.toPublicProfile({
      ...user,
      lastAuthAt: new Date()
    });
  }

  async logout(req: Request, res: Response): Promise<LogoutResponseDto> {
    const token = req.cookies?.[authConfig.cookieName()];
    let logoutUserId: string | null = null;
    let logoutUsername: string | null = null;

    if (token) {
      const payload = await verifyJwtPayload(this.jwtService, token, {
        ignoreExpiration: true
      });
      if (payload?.jti) {
        await this.sessionsService.revokeByJwtId(payload.jti);
      }
      if (payload?.sub) {
        const user = await this.usersService.findById(payload.sub);
        if (user) {
          logoutUserId = user.id;
          logoutUsername = user.username;
        }
      }
    }

    this.clearSessionCookie(res);
    this.proxyRealmService.rotate();

    if (logoutUserId) {
      this.vaultKeyCache.clearKey(logoutUserId);
    }

    if (logoutUserId && logoutUsername) {
      this.emitSessionEvent('LOGOUT', logoutUserId, logoutUsername);
    }
    return { message: 'Logged out successfully' };
  }

  async getProfile(user: AuthenticatedUser): Promise<AuthProfileDto> {
    const dbUser = await this.usersService.findById(user.userId);

    return {
      id: user.userId,
      username: user.username,
      fingerprintMatched: user.fingerprintMatched,
      lastAuthAt: dbUser?.lastAuthAt?.toISOString() ?? null
    };
  }

  async verifyPassword(
    user: AuthenticatedUser,
    password: string,
    req: Request
  ): Promise<VerifyPasswordResponseDto> {
    const dbUser = await this.usersService.findById(user.userId);
    if (!dbUser) {
      throw new UnauthorizedException(GENERIC_PASSWORD_FAILURE);
    }

    const passwordValid = await verifyPasswordHash(password, dbUser.passwordHash);
    if (!passwordValid) {
      void this.siemService.logSecurityEvent({
        type: SIEM_EVENT_TYPES.REAUTH_FAILURE,
        message: 'Re-authentication failed',
        metadata: {
          userId: user.userId,
          username: user.username,
          clientIp: extractClientIp(req),
          userAgent: extractUserAgent(req)
        }
      });
      throw new UnauthorizedException(GENERIC_PASSWORD_FAILURE);
    }

    const lastAuthAt = new Date();
    await this.usersService.updateLastAuthAt(user.userId);

    return {
      message: 'Password verified',
      lastAuthAt: lastAuthAt.toISOString()
    };
  }

  private async issueSessionCookie(
    userId: string,
    req: Request,
    res: Response
  ): Promise<void> {
    const jwtId = uuidv4();
    const expiresIn = authConfig.jwtExpiresIn() as StringValue;
    const expiresAt = this.resolveExpiryDate(expiresIn);

    await this.sessionsService.create({
      userId,
      jwtId,
      ipAddress: extractClientIp(req),
      userAgent: extractUserAgent(req),
      expiresAt
    });

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, jti: jwtId } satisfies JwtPayload,
      { expiresIn }
    );

    this.setSessionCookie(res, accessToken, expiresAt);
  }

  private setSessionCookie(
    res: Response,
    accessToken: string,
    expiresAt: Date
  ): void {
    res.cookie(authConfig.cookieName(), accessToken, {
      httpOnly: true,
      secure: authConfig.cookieSecure(),
      sameSite: authConfig.cookieSameSite(),
      domain: authConfig.cookieDomain(),
      path: authConfig.cookiePath(),
      expires: expiresAt
    });
  }

  private clearSessionCookie(res: Response): void {
    res.clearCookie(authConfig.cookieName(), {
      httpOnly: true,
      secure: authConfig.cookieSecure(),
      sameSite: authConfig.cookieSameSite(),
      domain: authConfig.cookieDomain(),
      path: authConfig.cookiePath()
    });
  }

  private logLoginFailure(
    attemptedUsername: string,
    userId: string | null,
    req: Request,
    reason: 'unknown_user' | 'invalid_password',
  ): void {
    void this.siemService.logSecurityEvent({
      type: SIEM_EVENT_TYPES.AUTH_FAILURE,
      message: 'Dashboard login failed',
      userId,
      metadata: {
        source: 'dashboard',
        reason,
        attemptedUsername,
        clientIp: extractClientIp(req),
        userAgent: extractUserAgent(req),
      },
    });
  }

  private emitSessionEvent(
    type: SessionEventPayload['type'],
    userId: string,
    username: string
  ): void {
    this.eventEmitter.emit(WEBSOCKET_INTERNAL_EVENTS.SESSION_EVENT, {
      type,
      userId,
      username,
      timestamp: new Date().toISOString()
    } satisfies SessionEventPayload);
  }

  private resolveExpiryDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      return new Date(Date.now() + 15 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}
