import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ThreatVerdict } from '../../threat/dto/threat-verdict.enum';

const VERDICT_VALUES = Object.values(ThreatVerdict);

export class TrafficLogsQueryDto {
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
  @IsIn(VERDICT_VALUES)
  verdict?: ThreatVerdict;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  urlSearch?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
