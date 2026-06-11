export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TrafficLogQuery {
  page: number;
  pageSize: number;
  verdict?: string;
  urlSearch?: string;
  from?: string;
  to?: string;
}

export interface SecurityEventQuery {
  page: number;
  pageSize: number;
  type?: string;
  severity?: string;
  from?: string;
  to?: string;
}
