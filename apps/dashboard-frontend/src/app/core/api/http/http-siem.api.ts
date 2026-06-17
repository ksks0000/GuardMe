import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PaginatedResult,
  SecurityEvent,
  SecurityEventQuery,
  TrafficLog,
  TrafficLogQuery,
} from '../../models';
import { SiemApi } from '../siem.api';
import { toHttpParams } from './http-query.util';
import {
  PaginatedSecurityEventsResponse,
  PaginatedTrafficLogsResponse,
  mapPaginatedSecurityEvents,
  mapPaginatedTrafficLogs,
} from './siem-api.mapper';

@Injectable()
export class HttpSiemApi extends SiemApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/siem`;

  getTrafficLogs(query: TrafficLogQuery): Observable<PaginatedResult<TrafficLog>> {
    return this.http
      .get<PaginatedTrafficLogsResponse>(`${this.baseUrl}/traffic-logs`, {
        params: toHttpParams({
          page: query.page,
          pageSize: query.pageSize,
          threatVerdict: query.threatVerdict,
          policyDecision: query.policyDecision,
          urlSearch: query.urlSearch,
          from: query.from,
          to: query.to,
        }),
      })
      .pipe(map(mapPaginatedTrafficLogs));
  }

  getSecurityEvents(
    query: SecurityEventQuery,
  ): Observable<PaginatedResult<SecurityEvent>> {
    return this.http
      .get<PaginatedSecurityEventsResponse>(`${this.baseUrl}/security-events`, {
        params: toHttpParams({
          page: query.page,
          pageSize: query.pageSize,
          type: query.type,
          severity: query.severity,
          from: query.from,
          to: query.to,
        }),
      })
      .pipe(map(mapPaginatedSecurityEvents));
  }
}
