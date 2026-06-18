import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

const BUCKET_HOUR_OPTIONS = [1, 6, 24] as const;

export type AnalyticsBucketHours = (typeof BUCKET_HOUR_OPTIONS)[number];

export class AnalyticsSummaryQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(BUCKET_HOUR_OPTIONS)
  bucketHours?: AnalyticsBucketHours;
}
