import { Observable } from 'rxjs';
import { AnalyticsSummary, AnalyticsSummaryQuery } from '../models';

export abstract class AnalyticsApi {
  abstract getSummary(query: AnalyticsSummaryQuery): Observable<AnalyticsSummary>;
}
