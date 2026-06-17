import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FirewallRule } from '@prisma/client';
import { policyConfig } from '../../config/policy.config';
import { PrismaService } from '../../database/prisma.service';
import { CreateFirewallRuleDto } from './dto/create-firewall-rule.dto';
import { FirewallRulePayload, RulesListPayload } from './dto/rules-list.payload';
import { UpdateFirewallRuleDto } from './dto/update-firewall-rule.dto';
import {
  isAllowRule,
  isBlockRule,
  normalizeRulePattern,
  RuleMatchContext,
  RuleMatchResult,
  ruleMatchesContext,
  toRuleMatchResult,
} from './utils/rule-matcher.util';

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<RulesListPayload> {
    const rows = await this.prisma.firewallRule.findMany({
      where: { userId },
      orderBy: [{ enabled: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      systemRules: policyConfig.systemRules(),
      userRules: rows.map(toFirewallRulePayload),
    };
  }

  async createForUser(
    userId: string,
    dto: CreateFirewallRuleDto,
  ): Promise<FirewallRulePayload> {
    const pattern = this.resolvePattern(dto.ruleType, dto.pattern);

    const row = await this.prisma.firewallRule.create({
      data: {
        userId,
        name: dto.name?.trim() || null,
        ruleType: dto.ruleType,
        pattern,
        action: dto.action,
        enabled: dto.enabled ?? true,
      },
    });

    return toFirewallRulePayload(row);
  }

  async updateForUser(
    userId: string,
    ruleId: string,
    dto: UpdateFirewallRuleDto,
  ): Promise<FirewallRulePayload> {
    await this.assertRuleOwnedByUser(userId, ruleId);

    const ruleType = dto.ruleType;
    const pattern =
      dto.pattern !== undefined
        ? this.resolvePattern(ruleType ?? (await this.getRuleType(userId, ruleId)), dto.pattern)
        : undefined;

    const row = await this.prisma.firewallRule.update({
      where: { id: ruleId },
      data: {
        name: dto.name !== undefined ? dto.name.trim() || null : undefined,
        ruleType: dto.ruleType,
        pattern,
        action: dto.action,
        enabled: dto.enabled,
      },
    });

    return toFirewallRulePayload(row);
  }

  async deleteForUser(userId: string, ruleId: string): Promise<void> {
    await this.assertRuleOwnedByUser(userId, ruleId);
    await this.prisma.firewallRule.delete({ where: { id: ruleId } });
  }

 
  async evaluateRules(
    userId: string,
    context: RuleMatchContext,
  ): Promise<RuleMatchResult | null> {
    const rules = await this.prisma.firewallRule.findMany({
      where: { userId, enabled: true },
      orderBy: { createdAt: 'asc' },
    });

    const blockMatch = rules.find(
      (rule) => isBlockRule(rule) && ruleMatchesContext(rule, context),
    );
    if (blockMatch) {
      return toRuleMatchResult(blockMatch);
    }

    const allowMatch = rules.find(
      (rule) => isAllowRule(rule) && ruleMatchesContext(rule, context),
    );
    if (allowMatch) {
      return toRuleMatchResult(allowMatch);
    }

    return null;
  }

  private async assertRuleOwnedByUser(
    userId: string,
    ruleId: string,
  ): Promise<void> {
    const rule = await this.prisma.firewallRule.findFirst({
      where: { id: ruleId, userId },
      select: { id: true },
    });

    if (!rule) {
      throw new NotFoundException('Firewall rule not found');
    }
  }

  private async getRuleType(userId: string, ruleId: string): Promise<string> {
    const rule = await this.prisma.firewallRule.findFirst({
      where: { id: ruleId, userId },
      select: { ruleType: true },
    });

    if (!rule) {
      throw new NotFoundException('Firewall rule not found');
    }

    return rule.ruleType;
  }

  private resolvePattern(ruleType: string, pattern: string): string {
    try {
      return normalizeRulePattern(ruleType, pattern);
    } catch {
      throw new BadRequestException('Invalid rule pattern');
    }
  }
}

function toFirewallRulePayload(row: FirewallRule): FirewallRulePayload {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    ruleType: row.ruleType,
    pattern: row.pattern,
    action: row.action,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
