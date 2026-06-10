import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { authConfig } from '../../config/auth.config';
import { AuthenticatedUser, JwtPayload } from '../../common/types/auth.types';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class WsAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
  ) {}

  async authenticateSocket(client: Socket): Promise<AuthenticatedUser> {
    const token = this.extractCookieToken(client.handshake.headers.cookie);
    if (!token) {
      throw new UnauthorizedException('Missing session cookie');
    }

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

    const fakeRequest = {
      headers: client.handshake.headers,
      ip: client.handshake.address,
      socket: { remoteAddress: client.handshake.address },
    };

    const { fingerprintMatched } =
      await this.sessionsService.verifySessionForRequest(session, fakeRequest as never);

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

  private extractCookieToken(cookieHeader: string | undefined): string | null {
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
