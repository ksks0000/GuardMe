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
import { PolicyDecision } from '../../proxy/dto/policy-decision.enum';
import { ThreatVerdict } from '../../threat/dto/threat-verdict.enum';

const THREAT_VERDICT_VALUES = Object.values(ThreatVerdict);
const POLICY_DECISION_VALUES = Object.values(PolicyDecision);

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
  @IsIn(THREAT_VERDICT_VALUES)
  threatVerdict?: ThreatVerdict;

  @IsOptional()
  @IsIn(POLICY_DECISION_VALUES)
  policyDecision?: PolicyDecision;

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
