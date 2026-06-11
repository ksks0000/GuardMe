import { Observable } from 'rxjs';
import {
  PaginatedResult,
  SecurityEvent,
  SecurityEventQuery,
  TrafficLog,
  TrafficLogQuery,
} from '../models';

export abstract class SiemApi {
  abstract getTrafficLogs(query: TrafficLogQuery): Observable<PaginatedResult<TrafficLog>>;
  abstract getSecurityEvents(
    query: SecurityEventQuery,
  ): Observable<PaginatedResult<SecurityEvent>>;
}
