import { FilterValues } from '../../shared/models/filter-bar.model';
import { AnalyticsSummaryQuery } from '../models';

function optionalIsoDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function buildAnalyticsSummaryQuery(filters: FilterValues): AnalyticsSummaryQuery {
  return {
    from: optionalIsoDate(filters['from']),
    to: optionalIsoDate(filters['to']),
  };
}
