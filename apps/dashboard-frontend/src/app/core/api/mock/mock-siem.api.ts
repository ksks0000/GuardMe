import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { SiemApi } from '../siem.api';
import {
  PaginatedResult,
  SecurityEvent,
  SecurityEventQuery,
  TrafficLog,
  TrafficLogQuery,
} from '../../models';
import { seedSecurityEvents, seedTrafficLogs } from './mock-data.util';

const LATENCY_MS = 350;
const ERROR_RATE = 0.03;

@Injectable()
export class MockSiemApi extends SiemApi {
  private readonly trafficLogs = seedTrafficLogs(120);
  private readonly securityEvents = seedSecurityEvents(45);

  getTrafficLogs(query: TrafficLogQuery): Observable<PaginatedResult<TrafficLog>> {
    if (Math.random() < ERROR_RATE) {
      return throwError(() => new Error('Mock SIEM: simulated traffic history failure')).pipe(
        delay(LATENCY_MS),
      );
    }

    let filtered = [...this.trafficLogs];

    if (query.threatVerdict) {
      filtered = filtered.filter((log) => log.threatVerdict === query.threatVerdict);
    }

    if (query.policyDecision) {
      filtered = filtered.filter((log) => log.policyDecision === query.policyDecision);
    }

    if (query.urlSearch) {
      const term = query.urlSearch.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.url.toLowerCase().includes(term) ||
          log.destinationHost.toLowerCase().includes(term),
      );
    }

    if (query.from) {
      const fromMs = Date.parse(query.from);
      filtered = filtered.filter((log) => Date.parse(log.timestamp) >= fromMs);
    }

    if (query.to) {
      const toMs = Date.parse(query.to);
      filtered = filtered.filter((log) => Date.parse(log.timestamp) <= toMs);
    }

    filtered.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

    return of(this.paginate(filtered, query.page, query.pageSize)).pipe(delay(LATENCY_MS));
  }

  getSecurityEvents(query: SecurityEventQuery): Observable<PaginatedResult<SecurityEvent>> {
    if (Math.random() < ERROR_RATE) {
      return throwError(() => new Error('Mock SIEM: simulated security history failure')).pipe(
        delay(LATENCY_MS),
      );
    }

    let filtered = [...this.securityEvents];

    if (query.type) {
      filtered = filtered.filter((event) => event.type === query.type);
    }

    if (query.severity) {
      filtered = filtered.filter((event) => event.severity === query.severity);
    }

    if (query.from) {
      const fromMs = Date.parse(query.from);
      filtered = filtered.filter((event) => Date.parse(event.createdAt) >= fromMs);
    }

    if (query.to) {
      const toMs = Date.parse(query.to);
      filtered = filtered.filter((event) => Date.parse(event.createdAt) <= toMs);
    }

    filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    return of(this.paginate(filtered, query.page, query.pageSize)).pipe(delay(LATENCY_MS));
  }

  private paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const start = (safePage - 1) * safePageSize;

    return {
      items: items.slice(start, start + safePageSize),
      total: items.length,
      page: safePage,
      pageSize: safePageSize,
    };
  }
}
