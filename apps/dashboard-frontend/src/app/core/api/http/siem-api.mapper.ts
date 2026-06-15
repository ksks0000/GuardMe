import { PaginatedResult, SecurityEvent, TrafficLog } from '../../models';

export interface PaginatedTrafficLogsResponse {
  items: TrafficLog[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginatedSecurityEventsResponse {
  items: SecurityEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export function mapPaginatedTrafficLogs(
  response: PaginatedTrafficLogsResponse,
): PaginatedResult<TrafficLog> {
  return {
    items: response.items,
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
  };
}

export function mapPaginatedSecurityEvents(
  response: PaginatedSecurityEventsResponse,
): PaginatedResult<SecurityEvent> {
  return {
    items: response.items,
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
  };
}
