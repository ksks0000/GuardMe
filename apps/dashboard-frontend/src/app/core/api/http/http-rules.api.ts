import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateFirewallRuleInput,
  FirewallRule,
  RulesListPayload,
  UpdateFirewallRuleInput,
} from '../../models';
import { RulesApi } from '../rules.api';

@Injectable()
export class HttpRulesApi extends RulesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/rules`;

  list(): Observable<RulesListPayload> {
    return this.http.get<RulesListPayload>(this.baseUrl);
  }

  create(input: CreateFirewallRuleInput): Observable<FirewallRule> {
    return this.http.post<FirewallRule>(this.baseUrl, input);
  }

  update(id: string, input: UpdateFirewallRuleInput): Observable<FirewallRule> {
    return this.http.patch<FirewallRule>(`${this.baseUrl}/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }
}
