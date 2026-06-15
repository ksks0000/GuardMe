import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Session } from '@prisma/client';
import { IncomingMessage } from 'node:http';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authConfig } from '../../config/auth.config';
import { AuthenticatedUser, JwtPayload } from '../../common/types/auth.types';
import { verifyPassword } from '../../common/utils/password.util';
import {
  extractClientIp,
  extractUserAgent,
} from '../../common/utils/request-context.util';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { parseProxyAuthorizationBasic } from './utils/proxy-basic-auth.util';

const GENERIC_PROXY_AUTH_FAILURE = 'Invalid proxy credentials';

@Injectable()
export class ProxyAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
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

  /**
   * Browsers do not attach dashboard cookies to proxied third-party URLs.
   * Standard `Proxy-Authorization: Basic` lets Firefox/Chrome send credentials
   * on every proxied request after the user accepts the 407 prompt.
   */
  private async authenticateWithBasicCredentials(
    credentials: { username: string; password: string },
    req: Request | IncomingMessage,
  ): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByUsername(credentials.username);
    if (!user) {
      throw new UnauthorizedException(GENERIC_PROXY_AUTH_FAILURE);
    }

    const passwordValid = await verifyPassword(
      credentials.password,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException(GENERIC_PROXY_AUTH_FAILURE);
    }

    const expressReq = req as Request;
    let session = await this.sessionsService.findLatestActiveForUser(user.id);
    if (!session) {
      session = await this.createProxySession(user.id, expressReq);
    }

    await this.sessionsService.updateLastVerifiedAt(session.id);

    return {
      userId: user.id,
      sessionId: session.id,
      jwtId: session.jwtId,
      username: user.username,
      fingerprintMatched: true,
    };
  }

  private async createProxySession(
    userId: string,
    req: Request,
  ): Promise<Session> {
    const expiresIn = authConfig.jwtExpiresIn();
    const expiresAt = this.resolveExpiryDate(expiresIn);

    return this.sessionsService.create({
      userId,
      jwtId: uuidv4(),
      ipAddress: extractClientIp(req),
      userAgent: extractUserAgent(req),
      expiresAt,
    });
  }

  private resolveExpiryDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      return new Date(Date.now() + 15 * 60 * 1000);
    }

    const value = Number(match[1]);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[match[2]]);
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
