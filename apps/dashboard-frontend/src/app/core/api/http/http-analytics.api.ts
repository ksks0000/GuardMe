import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AnalyticsSummary, AnalyticsSummaryQuery } from '../../models';
import { AnalyticsApi } from '../analytics.api';
import { toHttpParams } from './http-query.util';

@Injectable()
export class HttpAnalyticsApi extends AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/siem/analytics`;

  getSummary(query: AnalyticsSummaryQuery): Observable<AnalyticsSummary> {
    return this.http.get<AnalyticsSummary>(`${this.baseUrl}/summary`, {
      params: toHttpParams({
        from: query.from,
        to: query.to,
        bucketHours: query.bucketHours,
      }),
    });
  }
}
