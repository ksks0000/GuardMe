import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BehaviorBaselinePayload, UebaAnomaliesPayload, UebaAnomaliesQuery } from '../../models/ueba.model';
import { UebaApi } from '../ueba.api';
import { toHttpParams } from './http-query.util';

@Injectable()
export class HttpUebaApi extends UebaApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ueba`;

  getBaseline(): Observable<BehaviorBaselinePayload> {
    return this.http.get<BehaviorBaselinePayload>(`${this.baseUrl}/baseline`);
  }

  getAnomalies(query: UebaAnomaliesQuery): Observable<UebaAnomaliesPayload> {
    return this.http.get<UebaAnomaliesPayload>(`${this.baseUrl}/anomalies`, {
      params: toHttpParams({
        from: query.from,
        to: query.to,
        page: query.page,
        pageSize: query.pageSize,
      }),
    });
  }
}
