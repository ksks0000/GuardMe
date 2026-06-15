import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import {
  SIEM_EVENT_SEVERITIES,
  SIEM_EVENT_TYPES,
} from '../../../config/siem.config';

const EVENT_TYPES = Object.values(SIEM_EVENT_TYPES);
const EVENT_SEVERITIES = Object.values(SIEM_EVENT_SEVERITIES);

export class SecurityEventsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 15;

  @IsOptional()
  @IsIn(EVENT_TYPES)
  type?: (typeof EVENT_TYPES)[number];

  @IsOptional()
  @IsIn(EVENT_SEVERITIES)
  severity?: (typeof EVENT_SEVERITIES)[number];

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
