import { Prisma } from '@prisma/client';

export function buildSecurityEventUserScope(
  userId: string,
  username: string,
): Prisma.SecurityEventWhereInput {
  return {
    OR: [
      {
        metadata: {
          path: ['userId'],
          equals: userId,
        },
      },
      {
        metadata: {
          path: ['attemptedUsername'],
          equals: username,
        },
      },
      {
        metadata: {
          path: ['username'],
          equals: username,
        },
      },
    ],
  };
}

export function readSecurityEventMetadata(
  metadata: Prisma.JsonValue,
): { userId: string | null; username: string | null } {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { userId: null, username: null };
  }

  const record = metadata as Record<string, unknown>;
  const userId = typeof record.userId === 'string' ? record.userId : null;
  const username =
    typeof record.attemptedUsername === 'string'
      ? record.attemptedUsername
      : typeof record.username === 'string'
        ? record.username
        : null;

  return { userId, username };
}
