import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import {
  CreateFirewallRuleInput,
  FirewallRule,
  RulesListPayload,
  UpdateFirewallRuleInput,
} from '../../models';
import { RulesApi } from '../rules.api';
import { MOCK_SYSTEM_RULES } from './mock-system-rules';

const LATENCY_MS = 300;
const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';

@Injectable()
export class MockRulesApi extends RulesApi {
  private userRules: FirewallRule[] = [
    {
      id: '10000000-0000-4000-8000-000000000001',
      userId: MOCK_USER_ID,
      name: 'Block phishing test host',
      ruleType: 'DOMAIN',
      pattern: 'phishing-test.example',
      action: 'BLOCK',
      enabled: true,
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      updatedAt: new Date(Date.now() - 86_400_000).toISOString(),
    },
  ];

  list(): Observable<RulesListPayload> {
    return of({
      systemRules: MOCK_SYSTEM_RULES,
      userRules: [...this.userRules].sort(
        (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      ),
    }).pipe(delay(LATENCY_MS));
  }

  create(input: CreateFirewallRuleInput): Observable<FirewallRule> {
    const rule: FirewallRule = {
      id: crypto.randomUUID(),
      userId: MOCK_USER_ID,
      name: input.name?.trim() || null,
      ruleType: input.ruleType,
      pattern: input.pattern.trim(),
      action: input.action,
      enabled: input.enabled ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.userRules = [rule, ...this.userRules];
    return of(rule).pipe(delay(LATENCY_MS));
  }

  update(id: string, input: UpdateFirewallRuleInput): Observable<FirewallRule> {
    const index = this.userRules.findIndex((rule) => rule.id === id);
    if (index < 0) {
      return throwError(() => new Error('Firewall rule not found')).pipe(delay(LATENCY_MS));
    }

    const current = this.userRules[index];
    const updated: FirewallRule = {
      ...current,
      name: input.name !== undefined ? input.name.trim() || null : current.name,
      ruleType: input.ruleType ?? current.ruleType,
      pattern: input.pattern?.trim() ?? current.pattern,
      action: input.action ?? current.action,
      enabled: input.enabled ?? current.enabled,
      updatedAt: new Date().toISOString(),
    };

    this.userRules = [...this.userRules];
    this.userRules[index] = updated;
    return of(updated).pipe(delay(LATENCY_MS));
  }

  delete(id: string): Observable<void> {
    const exists = this.userRules.some((rule) => rule.id === id);
    if (!exists) {
      return throwError(() => new Error('Firewall rule not found')).pipe(delay(LATENCY_MS));
    }

    this.userRules = this.userRules.filter((rule) => rule.id !== id);
    return of(undefined).pipe(delay(LATENCY_MS));
  }
}
