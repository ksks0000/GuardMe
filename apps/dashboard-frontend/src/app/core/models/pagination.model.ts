export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TrafficLogQuery {
  page: number;
  pageSize: number;
  threatVerdict?: string;
  policyDecision?: string;
  urlSearch?: string;
  destinationIp?: string;
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
