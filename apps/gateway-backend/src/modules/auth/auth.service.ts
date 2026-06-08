import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedUser, JwtPayload } from '../../common/types/auth.types';
import { verifyJwtPayload } from '../../common/utils/jwt.util';
import { extractClientIp, extractUserAgent } from '../../common/utils/request-context.util';
import { verifyPassword } from '../../common/utils/password.util';
import { authConfig } from '../../config/auth.config';
import { PublicUserProfileDto } from '../users/dto/public-user-profile.dto';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { AuthProfileDto } from './dto/auth-profile.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUserProfileDto> {
    const user = await this.usersService.create({
      username: dto.username,
      password: dto.password,
    });
    return this.usersService.toPublicProfile(user);
  }

  async login(
    dto: LoginDto,
    req: Request,
    res: Response,
  ): Promise<PublicUserProfileDto> {
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

  async logout(req: Request, res: Response): Promise<LogoutResponseDto> {
    const token = req.cookies?.[authConfig.cookieName()];
    if (token) {
      const payload = await verifyJwtPayload(this.jwtService, token, {
        ignoreExpiration: true,
      });
      if (payload?.jti) {
        await this.sessionsService.revokeByJwtId(payload.jti);
      }
    }

    this.clearSessionCookie(res);
    return { message: 'Logged out successfully' };
  }

  getProfile(user: AuthenticatedUser): AuthProfileDto {
    return {
      id: user.userId,
      username: user.username,
      fingerprintMatched: user.fingerprintMatched,
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
      ipAddress: extractClientIp(req),
      userAgent: extractUserAgent(req),
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
