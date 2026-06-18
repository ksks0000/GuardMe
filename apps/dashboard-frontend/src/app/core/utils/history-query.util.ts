import { FilterValues } from '../../shared/models/filter-bar.model';
import { TrafficLogQuery, SecurityEventQuery } from '../models';

const MAX_URL_SEARCH_LENGTH = 200;

export function sanitizeSearchTerm(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim().replace(/[\x00-\x1F\x7F]/g, '').slice(0, MAX_URL_SEARCH_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

export function toIsoOrUndefined(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
}

export function optionalFilter(value: string | undefined): string | undefined {
  if (!value || value.trim() === '') {
    return undefined;
  }

  return value.trim();
}

export function buildTrafficLogQuery(
  filters: FilterValues,
  page: number,
  pageSize: number,
): TrafficLogQuery {
  return {
    page,
    pageSize,
    threatVerdict: optionalFilter(filters['threatVerdict']),
    policyDecision: optionalFilter(filters['policyDecision']),
    urlSearch: sanitizeSearchTerm(filters['urlSearch']),
    destinationIp: sanitizeSearchTerm(filters['destinationIp']),
    from: toIsoOrUndefined(filters['from']),
    to: toIsoOrUndefined(filters['to']),
  };
}

export function buildSecurityEventQuery(
  filters: FilterValues,
  page: number,
  pageSize: number,
): SecurityEventQuery {
  return {
    page,
    pageSize,
    type: optionalFilter(filters['type']),
    severity: optionalFilter(filters['severity']),
    from: toIsoOrUndefined(filters['from']),
    to: toIsoOrUndefined(filters['to']),
  };
}
