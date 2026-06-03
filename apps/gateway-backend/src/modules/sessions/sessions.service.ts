import { Injectable } from '@nestjs/common';
import { Session } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface CreateSessionInput {
  userId: string;
  jwtId: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async revokeByJwtId(jwtId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { jwtId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async touchLastVerifiedAt(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastVerifiedAt: new Date() },
    });
  }
}
