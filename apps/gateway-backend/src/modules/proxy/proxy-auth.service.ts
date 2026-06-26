import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IncomingMessage } from 'node:http';
import { Request } from 'express';
import { authConfig } from '../../config/auth.config';
import { SIEM_EVENT_TYPES } from '../../config/siem.config';
import { AuthenticatedUser, JwtPayload } from '../../common/types/auth.types';
import { verifyPasswordTimingSafe } from '../../common/utils/password.util';
import { extractClientIp, extractUserAgent } from '../../common/utils/request-context.util';
import { SiemService } from '../siem/siem.service';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { ProxyRateLimitService } from './proxy-rate-limit.service';
import { parseProxyAuthorizationBasic } from './utils/proxy-basic-auth.util';

const GENERIC_PROXY_AUTH_FAILURE = 'Invalid proxy credentials';
const PROXY_SESSION_REQUIRED = 'Sign in to the dashboard before using the proxy';
const PROXY_RATE_LIMITED = 'Too many failed proxy authentication attempts';

@Injectable()
export class ProxyAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
    private readonly siemService: SiemService,
    private readonly rateLimit: ProxyRateLimitService,
  ) {}

  async authenticate(req: Request | IncomingMessage): Promise<AuthenticatedUser> {
    const cookieToken = this.extractCookieToken(req);
    if (cookieToken) {
      return this.authenticateWithSessionToken(cookieToken, req);
    }

    const basicCredentials = parseProxyAuthorizationBasic(
      req.headers['proxy-authorization'],
    );
    if (basicCredentials) {
      return this.authenticateWithBasicCredentials(basicCredentials, req);
    }

    throw new UnauthorizedException('Proxy authentication required');
  }

  private async authenticateWithSessionToken(
    token: string,
    req: Request | IncomingMessage,
  ): Promise<AuthenticatedUser> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid session token');
    }

    const session = await this.sessionsService.findActiveByJwtId(payload.jti);
    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    const expressReq = req as Request;
    const { fingerprintMatched } =
      await this.sessionsService.verifySessionForRequest(session, expressReq);

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.sessionsService.updateLastVerifiedAt(session.id);

    return {
      userId: user.id,
      sessionId: session.id,
      jwtId: payload.jti,
      username: user.username,
      fingerprintMatched,
    };
  }

  private async authenticateWithBasicCredentials(
    credentials: { username: string; password: string },
    req: Request | IncomingMessage,
  ): Promise<AuthenticatedUser> {
    const rateKey = extractClientIp(req as Request);
    if (this.rateLimit.isBlocked(rateKey)) {
      throw new UnauthorizedException(PROXY_RATE_LIMITED);
    }

    const user = await this.usersService.findByUsername(credentials.username);
    const passwordValid = await verifyPasswordTimingSafe(
      credentials.password,
      user?.passwordHash,
    );

    if (!user) {
      this.rateLimit.recordFailure(rateKey);
      this.logProxyAuthFailure(credentials.username, null, req, 'unknown_user');
      throw new UnauthorizedException(GENERIC_PROXY_AUTH_FAILURE);
    }

    if (!passwordValid) {
      this.rateLimit.recordFailure(rateKey);
      this.logProxyAuthFailure(
        credentials.username,
        user.id,
        req,
        'invalid_password',
      );
      throw new UnauthorizedException(GENERIC_PROXY_AUTH_FAILURE);
    }

    const session = await this.sessionsService.findLatestActiveForUser(user.id);
    if (!session) {
      this.logProxyAuthFailure(
        credentials.username,
        user.id,
        req,
        'no_active_dashboard_session',
      );
      throw new UnauthorizedException(PROXY_SESSION_REQUIRED);
    }

    this.rateLimit.recordSuccess(rateKey);
    await this.sessionsService.updateLastVerifiedAt(session.id);

    return {
      userId: user.id,
      sessionId: session.id,
      jwtId: session.jwtId,
      username: user.username,
      fingerprintMatched: true,
    };
  }

  private logProxyAuthFailure(
    attemptedUsername: string,
    userId: string | null,
    req: Request | IncomingMessage,
    reason: 'unknown_user' | 'invalid_password' | 'no_active_dashboard_session',
  ): void {
    const expressReq = req as Request;
    void this.siemService.logSecurityEvent({
      type: SIEM_EVENT_TYPES.AUTH_FAILURE,
      message: 'Proxy authentication failed',
      userId,
      metadata: {
        reason,
        attemptedUsername,
        clientIp: extractClientIp(expressReq),
        userAgent: extractUserAgent(expressReq),
      },
    });
  }

  private extractCookieToken(req: Request | IncomingMessage): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const cookieName = authConfig.cookieName();
    const cookies = cookieHeader.split(';');
    for (const part of cookies) {
      const [name, ...valueParts] = part.trim().split('=');
      if (name === cookieName) {
        return decodeURIComponent(valueParts.join('='));
      }
    }

    return null;
  }
}
