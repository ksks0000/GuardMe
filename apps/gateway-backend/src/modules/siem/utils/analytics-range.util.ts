import { BadRequestException } from '@nestjs/common';
import { AnalyticsBucketHours } from '../dto/analytics-summary-query.dto';

const DEFAULT_RANGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_RANGE_MS = 90 * 24 * 60 * 60 * 1000;

export interface ResolvedAnalyticsRange {
  from: Date;
  to: Date;
  bucketHours: AnalyticsBucketHours;
}

export function resolveAnalyticsRange(input: {
  from?: string;
  to?: string;
  bucketHours?: AnalyticsBucketHours;
}): ResolvedAnalyticsRange {
  const to = input.to ? new Date(input.to) : new Date();
  const from = input.from
    ? new Date(input.from)
    : new Date(to.getTime() - DEFAULT_RANGE_MS);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new BadRequestException('Invalid analytics date range');
  }

  if (from > to) {
    throw new BadRequestException('`from` must be before `to`');
  }

  if (to.getTime() - from.getTime() > MAX_RANGE_MS) {
    throw new BadRequestException('Analytics range cannot exceed 90 days');
  }

  return {
    from,
    to,
    bucketHours: input.bucketHours ?? resolveDefaultBucketHours(from, to),
  };
}

function resolveDefaultBucketHours(from: Date, to: Date): AnalyticsBucketHours {
  const rangeHours = (to.getTime() - from.getTime()) / 3600000;

  if (rangeHours <= 48) {
    return 1;
  }

  if (rangeHours <= 14 * 24) {
    return 6;
  }

  return 24;
}
