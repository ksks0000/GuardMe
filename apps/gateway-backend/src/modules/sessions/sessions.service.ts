import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Session } from '@prisma/client';
import { Request } from 'express';
import { authConfig } from '../../config/auth.config';
import { SIEM_EVENT_TYPES } from '../../config/siem.config';
import {
  extractClientIp,
  extractUserAgent,
} from '../../common/utils/request-context.util';
import { PrismaService } from '../../database/prisma.service';
import { buildSecurityEventActorMetadata } from '../siem/dto/security-event.input';
import { SiemService } from '../siem/siem.service';
import { UsersService } from '../users/users.service';
import { CreateSessionInput } from './dto/create-session.input';
import { SessionVerificationResult } from './dto/session-verification.result';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siemService: SiemService,
    private readonly usersService: UsersService,
  ) {}

  create(input: CreateSessionInput): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId: input.userId,
        jwtId: input.jwtId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        expiresAt: input.expiresAt,
        lastVerifiedAt: new Date(),
      },
    });
  }

  findActiveByJwtId(jwtId: string): Promise<Session | null> {
    return this.prisma.session.findFirst({
      where: {
        jwtId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  findLatestActiveForUser(userId: string): Promise<Session | null> {
    return this.prisma.session.findFirst({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifySessionForRequest(
    session: Session,
    req: Request
  ): Promise<SessionVerificationResult> {
    const currentIp = extractClientIp(req);
    const currentUserAgent = extractUserAgent(req);
    const ipMatches = session.ipAddress === currentIp;
    const userAgentMatches = session.userAgent === currentUserAgent;
    const fingerprintMatched = ipMatches && userAgentMatches;

    if (fingerprintMatched) {
      return { fingerprintMatched: true };
    }

    const actor = await this.actorMetadata(session.userId);

    void this.siemService.logSecurityEvent({
      type: SIEM_EVENT_TYPES.FINGERPRINT_MISMATCH,
      message: 'Session device fingerprint mismatch',
      metadata: {
        ...actor,
        sessionId: session.id,
        jwtId: session.jwtId,
        expectedIp: session.ipAddress,
        actualIp: currentIp,
        expectedUserAgent: session.userAgent,
        actualUserAgent: currentUserAgent,
      },
    });

    if (authConfig.sessionFingerprintStrict()) {
      await this.revokeByJwtId(session.jwtId);
      void this.siemService.logSecurityEvent({
        type: SIEM_EVENT_TYPES.SESSION_REVOKED,
        message: 'Session revoked due to fingerprint mismatch',
        metadata: {
          ...actor,
          sessionId: session.id,
          jwtId: session.jwtId,
        },
      });
      throw new UnauthorizedException(
        'Session invalidated due to device mismatch',
      );
    }

    return { fingerprintMatched: false };
  }

  async revokeByJwtId(jwtId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { jwtId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async updateLastVerifiedAt(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastVerifiedAt: new Date() },
    });
  }

  private async actorMetadata(
    userId: string,
  ): Promise<ReturnType<typeof buildSecurityEventActorMetadata>> {
    const user = await this.usersService.findById(userId);
    return buildSecurityEventActorMetadata(userId, user?.username);
  }
}
