import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';
import { verifyPassword } from '../../common/utils/password.util';
import { authConfig } from '../../config/auth.config';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser, JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto.username, dto.password);
    return this.usersService.toPublicProfile(user);
  }

  async login(dto: LoginDto, req: Request, res: Response) {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordValid = await verifyPassword(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    await this.usersService.updateLastAuthAt(user.id);
    await this.issueSessionCookie(user.id, req, res);

    return this.usersService.toPublicProfile({
      ...user,
      lastAuthAt: new Date(),
    });
  }

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[authConfig.cookieName()];
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
        await this.sessionsService.revokeByJwtId(payload.jti);
      } catch {
        // Token may be expired or invalid; still clear the cookie.
      }
    }

    this.clearSessionCookie(res);
    return { message: 'Logged out successfully' };
  }

  getProfile(user: AuthenticatedUser) {
    return {
      id: user.userId,
      username: user.username,
    };
  }

  private async issueSessionCookie(
    userId: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    const jwtId = uuidv4();
    const expiresIn = authConfig.jwtExpiresIn() as StringValue;
    const expiresAt = this.resolveExpiryDate(expiresIn);

    await this.sessionsService.create({
      userId,
      jwtId,
      ipAddress: this.extractIp(req),
      userAgent: req.headers['user-agent'] ?? 'unknown',
      expiresAt,
    });

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, jti: jwtId } satisfies JwtPayload,
      { expiresIn },
    );

    this.setSessionCookie(res, accessToken, expiresAt);
  }

  private setSessionCookie(
    res: Response,
    accessToken: string,
    expiresAt: Date,
  ): void {
    res.cookie(authConfig.cookieName(), accessToken, {
      httpOnly: true,
      secure: authConfig.cookieSecure(),
      sameSite: authConfig.cookieSameSite(),
      domain: authConfig.cookieDomain(),
      path: authConfig.cookiePath(),
      expires: expiresAt,
    });
  }

  private clearSessionCookie(res: Response): void {
    res.clearCookie(authConfig.cookieName(), {
      httpOnly: true,
      secure: authConfig.cookieSecure(),
      sameSite: authConfig.cookieSameSite(),
      domain: authConfig.cookieDomain(),
      path: authConfig.cookiePath(),
    });
  }

  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
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
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}
