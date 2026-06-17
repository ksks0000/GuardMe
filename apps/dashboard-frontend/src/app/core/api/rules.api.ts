import { Observable } from 'rxjs';
import {
  CreateFirewallRuleInput,
  FirewallRule,
  RulesListPayload,
  UpdateFirewallRuleInput,
} from '../models';

export abstract class RulesApi {
  abstract list(): Observable<RulesListPayload>;
  abstract create(input: CreateFirewallRuleInput): Observable<FirewallRule>;
  abstract update(id: string, input: UpdateFirewallRuleInput): Observable<FirewallRule>;
  abstract delete(id: string): Observable<void>;
}
