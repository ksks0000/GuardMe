import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  FIREWALL_RULE_ACTIONS,
  FIREWALL_RULE_TYPES,
} from '../../../config/policy.config';

const RULE_TYPES = Object.values(FIREWALL_RULE_TYPES);
const RULE_ACTIONS = Object.values(FIREWALL_RULE_ACTIONS);

export class CreateFirewallRuleDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsIn(RULE_TYPES)
  ruleType!: (typeof RULE_TYPES)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(253)
  pattern!: string;

  @IsIn(RULE_ACTIONS)
  action!: (typeof RULE_ACTIONS)[number];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
