import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Session } from '@prisma/client';
import { Request } from 'express';
import { authConfig } from '../../config/auth.config';
import { SecurityAuditService } from '../../common/services/security-audit.service';
import {
  extractClientIp,
  extractUserAgent,
} from '../../common/utils/request-context.util';
import { PrismaService } from '../../database/prisma.service';
import { CreateSessionInput } from './dto/create-session.input';
import { SessionVerificationResult } from './dto/session-verification.result';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityAudit: SecurityAuditService,
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

  async verifySessionForRequest(
    session: Session,
    req: Request,
  ): Promise<SessionVerificationResult> {
    const currentIp = extractClientIp(req);
    const currentUserAgent = extractUserAgent(req);
    const ipMatches = session.ipAddress === currentIp;
    const userAgentMatches = session.userAgent === currentUserAgent;
    const fingerprintMatched = ipMatches && userAgentMatches;

    if (fingerprintMatched) {
      return { fingerprintMatched: true };
    }

    this.securityAudit.log({
      type: 'FINGERPRINT_MISMATCH',
      message: 'Session device fingerprint mismatch',
      metadata: {
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
      this.securityAudit.log({
        type: 'SESSION_REVOKED',
        message: 'Session revoked due to fingerprint mismatch',
        metadata: { sessionId: session.id, jwtId: session.jwtId },
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

  async updateLastVerifiedAt(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastVerifiedAt: new Date() },
    });
  }
}
