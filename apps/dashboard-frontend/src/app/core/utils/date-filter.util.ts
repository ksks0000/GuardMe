import { FilterValues } from '../../shared/models/filter-bar.model';
import { toIsoOrUndefined } from './history-query.util';

export function buildDateRangeFromFilters(filters: FilterValues): {
  from?: string;
  to?: string;
} {
  return {
    from: toIsoOrUndefined(filters['from']),
    to: toIsoOrUndefined(filters['to']),
  };
}
